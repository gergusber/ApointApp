/**
 * Businesses Router (v1)
 * Handles business-related operations
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure, protectedProcedure, businessOwnerProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export const businessesRouter = createTRPCRouter({
  /**
   * Get all active businesses (public directory)
   */
  getAll: publicProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
      categoryId: z.string().optional(),
      province: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const where = {
        status: 'ACTIVE' as const,
        subscriptionStatus: 'ACTIVE',
        ...(input.categoryId && {
          categories: {
            some: {
              id: input.categoryId,
            },
          },
        }),
        ...(input.search && {
          OR: [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { description: { contains: input.search, mode: 'insensitive' as const } },
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
          orderBy: { createdAt: 'desc' },
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
    .input(z.object({
      slug: z.string(),
    }))
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
            orderBy: { createdAt: 'desc' },
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
          code: 'NOT_FOUND',
          message: 'Negocio no encontrado',
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
    .input(z.object({
      name: z.string().min(2).max(100),
      slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
      description: z.string().max(1000).optional(),
      email: z.string().email(),
      phone: z.string(),
      website: z.string().url().optional(),
      cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/),
      categoryIds: z.array(z.string()).min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get or create user
      let user = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.userId },
      });

      if (!user) {
        // Create user from Clerk session
        const clerkUser = await ctx.session;
        user = await ctx.prisma.user.create({
          data: {
            clerkId: ctx.userId,
            email: clerkUser?.emailAddresses?.[0]?.emailAddress ?? input.email,
            firstName: clerkUser?.firstName ?? 'Usuario',
            lastName: clerkUser?.lastName ?? '',
            role: 'BUSINESS',
          },
        });
      } else if (user.role === 'USER') {
        // Upgrade user to business role
        user = await ctx.prisma.user.update({
          where: { id: user.id },
          data: { role: 'BUSINESS' },
        });
      }

      // Check if slug is available
      const existingBusiness = await ctx.prisma.business.findUnique({
        where: { slug: input.slug },
      });

      if (existingBusiness) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este nombre de negocio ya está en uso',
        });
      }

      // Check if CUIT is available
      const existingCuit = await ctx.prisma.business.findUnique({
        where: { cuit: input.cuit },
      });

      if (existingCuit) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Este CUIT ya está registrado',
        });
      }

      // Create business
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
            connect: input.categoryIds.map(id => ({ id })),
          },
        },
        include: {
          categories: true,
        },
      });

      return business;
    }),

  /**
   * Get businesses owned by current user
   */
  getMyBusinesses: protectedProcedure
    .query(async ({ ctx }) => {
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
        orderBy: { createdAt: 'desc' },
      });

      return businesses;
    }),
});
