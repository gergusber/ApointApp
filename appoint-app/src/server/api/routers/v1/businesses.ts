/**
 * Businesses Router (v1)
 * Handles business-related operations
 */

import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "../../trpc";
import { TRPCError } from "@trpc/server";
import { getOrCreateUser } from "@/server/services/user-sync";

export const businessesRouter = createTRPCRouter({
  /**
   * Test mutation - minimal example
   */
  test: publicProcedure
    .input(z.object({ message: z.string() }))
    .mutation(({ input }) => {
      console.log("[Test] Received:", input);
      return { success: true, echo: input.message };
    }),

  /**
   * Get all active businesses (public directory)
   */
  getAll: publicProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          categoryId: z.string().optional(),
          province: z.string().optional(),
          search: z.string().optional(),
        })
        .optional()
        .default({ page: 1, limit: 20 })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        status: "ACTIVE" as const,
        subscriptionStatus: "ACTIVE",
        ...(input.categoryId && {
          categories: {
            some: {
              id: input.categoryId,
            },
          },
        }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: "insensitive" as const } },
            {
              description: {
                contains: input.search,
                mode: "insensitive" as const,
              },
            },
          ],
        }),
      };

      const [businesses, total] = await Promise.all([
        ctx.prisma.business.findMany({
          where,
          include: {
            categories: true,
            locations: {
              where: { isActive: true },
              take: 1, // Just get first location for preview
            },
            _count: {
              select: {
                reviews: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.business.count({ where }),
      ]);

      return {
        businesses,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Get single business by slug (public)
   */
  getBySlug: publicProcedure
    .input(
      z.object({
        slug: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const business = await ctx.prisma.business.findUnique({
        where: { slug: input.slug },
        include: {
          categories: true,
          locations: {
            where: { isActive: true },
            include: {
              services: {
                where: { isActive: true },
              },
              businessHours: true,
            },
          },
          reviews: {
            where: { isPublished: true },
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
            orderBy: { createdAt: "desc" },
            take: 10,
          },
          _count: {
            select: {
              reviews: true,
            },
          },
        },
      });

      if (!business) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Negocio no encontrado",
        });
      }

      // Calculate average rating
      const reviews = await ctx.prisma.review.aggregate({
        where: {
          businessId: business.id,
          isPublished: true,
        },
        _avg: {
          rating: true,
        },
      });

      return {
        ...business,
        averageRating: reviews._avg.rating ?? 0,
      };
    }),

  /**
   * Create a new business (authenticated)
   */
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(2).max(100),
        slug: z
          .string()
          .min(2)
          .max(100)
          .regex(/^[a-z0-9-]+$/),
        description: z.string().max(1000).optional(),
        email: z.string().email(),
        phone: z.string(),
        website: z
          .string()
          .url()
          .optional()
          .or(z.literal("").transform(() => undefined)),
        cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/),
        categoryIds: z.array(z.string()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      console.log("[Business Create] ===== START =====");
      console.log("[Business Create] Received input:", JSON.stringify(input, null, 2));
      console.log("[Business Create] UserId from context:", ctx.userId);
      console.log("[Business Create] Has userId:", !!ctx.userId);

      if (!ctx.userId) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Debes estar autenticado para crear un negocio",
        });
      }

      // Get or create user using the sync service (handles all edge cases)
      console.log("[Business Create] Getting/creating user...");
      let user;
      try {
        user = await getOrCreateUser(ctx.userId);
        console.log("[Business Create] User obtained:", { id: user.id, email: user.email, role: user.role });
      } catch (error) {
        console.error("[Business Create] Error getting/creating user:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error al obtener el usuario: ${error instanceof Error ? error.message : "Error desconocido"}`,
        });
      }

      // Upgrade user to business role if they're still a regular user
      if (user.role === "USER") {
        user = await ctx.prisma.user.update({
          where: { id: user.id },
          data: { role: "BUSINESS" },
        });
      }

      // Check if slug is available
      const existingBusiness = await ctx.prisma.business.findUnique({
        where: { slug: input.slug },
      });

      if (existingBusiness) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este nombre de negocio ya está en uso",
        });
      }

      // Check if CUIT is available
      const existingCuit = await ctx.prisma.business.findUnique({
        where: { cuit: input.cuit },
      });

      if (existingCuit) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Este CUIT ya está registrado",
        });
      }

      // Validate that all categories exist
      console.log("[Business Create] Validating categories:", input.categoryIds);
      const categories = await ctx.prisma.category.findMany({
        where: {
          id: { in: input.categoryIds },
        },
      });
      console.log("[Business Create] Found categories:", categories.map(c => ({ id: c.id, name: c.name })));

      if (categories.length !== input.categoryIds.length) {
        const foundIds = categories.map((c) => c.id);
        const missingIds = input.categoryIds.filter((id) => !foundIds.includes(id));
        console.error("[Business Create] Missing categories:", missingIds);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Las siguientes categorías no existen: ${missingIds.join(", ")}. Por favor, asegúrate de que las categorías existan en la base de datos.`,
        });
      }

      // Create business
      console.log("[Business Create] Creating business with data:", {
        name: input.name,
        slug: input.slug,
        email: input.email,
        phone: input.phone,
        cuit: input.cuit,
        ownerId: user.id,
        categoryIds: input.categoryIds,
      });

      try {
        const business = await ctx.prisma.business.create({
          data: {
            name: input.name,
            slug: input.slug,
            description: input.description,
            email: input.email,
            phone: input.phone,
            website: input.website,
            cuit: input.cuit,
            ownerId: user.id,
            categories: {
              connect: input.categoryIds.map((id) => ({ id })),
            },
          },
          // Don't include categories in create response to avoid serialization issues
          // Categories can be fetched separately via getBySlug if needed
        });

        console.log("[Business Create] ✅ Business created successfully!");
        console.log("[Business Create] Business ID:", business.id);
        console.log("[Business Create] Business slug:", business.slug);
        
        // Return a clean, serializable object to avoid superjson issues
        // Categories are not included here - they can be fetched separately if needed
        const result = {
          id: business.id,
          name: business.name,
          slug: business.slug,
          description: business.description,
          email: business.email,
          phone: business.phone,
          website: business.website,
          cuit: business.cuit,
          status: business.status,
          createdAt: business.createdAt,
          updatedAt: business.updatedAt,
        };
        
        // Test serialization before returning
        try {
          JSON.stringify(result);
          console.log("[Business Create] ✅ Response is serializable");
        } catch (e) {
          console.error("[Business Create] ❌ Response NOT serializable:", e);
        }
        
        console.log("[Business Create] ===== SUCCESS =====");
        return result;
      } catch (error: unknown) {
        console.error("[Business Create] Error creating business:", error);
        
        // Handle Prisma errors
        if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
          // Unique constraint violation
          const field = (error as { meta?: { target?: string[] } }).meta?.target?.[0];
          if (field === "slug") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Este nombre de negocio ya está en uso",
            });
          }
          if (field === "cuit") {
            throw new TRPCError({
              code: "CONFLICT",
              message: "Este CUIT ya está registrado",
            });
          }
          throw new TRPCError({
            code: "CONFLICT",
            message: "Ya existe un negocio con estos datos",
          });
        }
        
        // Re-throw TRPC errors as-is
        if (error instanceof TRPCError) {
          throw error;
        }
        
        // Generic error
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error al crear el negocio: ${errorMessage}`,
        });
      }
    }),

  /**
   * Get businesses owned by current user
   */
  getMyBusinesses: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      select: { id: true },
    });

    if (!user) {
      return [];
    }

    const businesses = await ctx.prisma.business.findMany({
      where: { ownerId: user.id },
      include: {
        categories: true,
        locations: {
          where: { isActive: true },
        },
        _count: {
          select: {
            appointments: true,
            reviews: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return businesses;
  }),
});
