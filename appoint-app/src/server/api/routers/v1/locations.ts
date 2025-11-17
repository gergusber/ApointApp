/**
 * Locations Router (v1)
 * Handles location-related operations
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, businessOwnerProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { Province } from '@prisma/client';

export const locationsRouter = createTRPCRouter({
  /**
   * Get all locations for a business
   */
  getByBusiness: protectedProcedure
    .input(z.object({
      businessId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify business ownership
      const business = await ctx.prisma.business.findFirst({
        where: {
          id: input.businessId,
          owner: { clerkId: ctx.userId },
        },
      });

      if (!business) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes acceso a este negocio',
        });
      }

      const locations = await ctx.prisma.location.findMany({
        where: {
          businessId: input.businessId,
        },
        include: {
          businessHours: true,
          _count: {
            select: {
              services: true,
            },
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return locations;
    }),

  /**
   * Get single location by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const location = await ctx.prisma.location.findFirst({
        where: {
          id: input.id,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
        include: {
          businessHours: true,
          blockedDates: {
            orderBy: {
              date: 'asc',
            },
          },
          services: {
            where: {
              status: 'ACTIVE',
            },
          },
        },
      });

      if (!location) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ubicación no encontrada',
        });
      }

      return location;
    }),

  /**
   * Create a new location
   */
  create: businessOwnerProcedure
    .input(
      z.object({
        businessId: z.string().cuid(),
        name: z.string().min(2).max(100),
        address: z.string().min(5),
        city: z.string().min(2),
        province: z.nativeEnum(Province),
        postalCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify business ownership
      const business = await ctx.prisma.business.findFirst({
        where: {
          id: input.businessId,
          owner: { clerkId: ctx.userId },
        },
      });

      if (!business) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes acceso a este negocio',
        });
      }

      const location = await ctx.prisma.location.create({
        data: {
          businessId: input.businessId,
          name: input.name,
          address: input.address,
          city: input.city,
          province: input.province,
          postalCode: input.postalCode,
          latitude: input.latitude,
          longitude: input.longitude,
        },
        include: {
          businessHours: true,
        },
      });

      return location;
    }),

  /**
   * Update a location
   */
  update: businessOwnerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(2).max(100).optional(),
        address: z.string().min(5).optional(),
        city: z.string().min(2).optional(),
        province: z.nativeEnum(Province).optional(),
        postalCode: z.string().optional(),
        latitude: z.number().optional(),
        longitude: z.number().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify location ownership
      const location = await ctx.prisma.location.findFirst({
        where: {
          id,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
      });

      if (!location) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ubicación no encontrada',
        });
      }

      const updated = await ctx.prisma.location.update({
        where: { id },
        data: updateData,
        include: {
          businessHours: true,
        },
      });

      return updated;
    }),

  /**
   * Delete a location
   */
  delete: businessOwnerProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify location ownership
      const location = await ctx.prisma.location.findFirst({
        where: {
          id: input.id,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
        include: {
          _count: {
            select: {
              services: true,
              appointments: true,
            },
          },
        },
      });

      if (!location) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ubicación no encontrada',
        });
      }

      // Check if location has services or appointments
      if (location._count.services > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No puedes eliminar una ubicación que tiene servicios asociados',
        });
      }

      await ctx.prisma.location.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

