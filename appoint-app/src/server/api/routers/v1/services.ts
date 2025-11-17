/**
 * Services Router (v1)
 * Handles service-related operations
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, businessOwnerProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export const servicesRouter = createTRPCRouter({
  /**
   * Get all services for a location
   */
  getByLocation: protectedProcedure
    .input(z.object({
      locationId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify location ownership
      const location = await ctx.prisma.location.findFirst({
        where: {
          id: input.locationId,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
      });

      if (!location) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes acceso a esta ubicación',
        });
      }

      const services = await ctx.prisma.service.findMany({
        where: {
          locationId: input.locationId,
        },
        include: {
          location: {
            include: {
              business: true,
            },
          },
          _count: {
            select: {
              appointments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return services;
    }),

  /**
   * Get single service by ID
   */
  getById: protectedProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const service = await ctx.prisma.service.findFirst({
        where: {
          id: input.id,
          location: {
            business: {
              owner: { clerkId: ctx.userId },
            },
          },
        },
        include: {
          location: {
            include: {
              business: true,
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Servicio no encontrado',
        });
      }

      return service;
    }),

  /**
   * Create a new service
   */
  create: businessOwnerProcedure
    .input(
      z.object({
        locationId: z.string().cuid(),
        name: z.string().min(2).max(100),
        description: z.string().max(2000).optional(),
        durationMinutes: z.number().min(15).max(480), // 15 min to 8 hours
        bufferMinutes: z.number().min(0).max(120).default(0),
        price: z.number().positive(),
        requiresDeposit: z.boolean().default(false),
        depositAmount: z.number().positive().optional(),
        depositPercentage: z.number().min(0).max(100).optional(),
        requiresApproval: z.boolean().default(true),
        maxAdvanceDays: z.number().min(1).max(365).default(30),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify location ownership
      const location = await ctx.prisma.location.findFirst({
        where: {
          id: input.locationId,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
      });

      if (!location) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'No tienes acceso a esta ubicación',
        });
      }

      const service = await ctx.prisma.service.create({
        data: {
          locationId: input.locationId,
          name: input.name,
          description: input.description,
          durationMinutes: input.durationMinutes,
          bufferMinutes: input.bufferMinutes,
          price: input.price,
          requiresDeposit: input.requiresDeposit,
          depositAmount: input.depositAmount,
          depositPercentage: input.depositPercentage,
          requiresApproval: input.requiresApproval,
          maxAdvanceDays: input.maxAdvanceDays,
          image: input.image,
        },
        include: {
          location: {
            include: {
              business: true,
            },
          },
        },
      });

      return service;
    }),

  /**
   * Update a service
   */
  update: businessOwnerProcedure
    .input(
      z.object({
        id: z.string().cuid(),
        name: z.string().min(2).max(100).optional(),
        description: z.string().max(2000).optional(),
        durationMinutes: z.number().min(15).max(480).optional(),
        bufferMinutes: z.number().min(0).max(120).optional(),
        price: z.number().positive().optional(),
        requiresDeposit: z.boolean().optional(),
        depositAmount: z.number().positive().optional(),
        depositPercentage: z.number().min(0).max(100).optional(),
        requiresApproval: z.boolean().optional(),
        maxAdvanceDays: z.number().min(1).max(365).optional(),
        isActive: z.boolean().optional(),
        image: z.string().url().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Verify service ownership
      const service = await ctx.prisma.service.findFirst({
        where: {
          id,
          location: {
            business: {
              owner: { clerkId: ctx.userId },
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Servicio no encontrado',
        });
      }

      const updated = await ctx.prisma.service.update({
        where: { id },
        data: updateData,
        include: {
          location: {
            include: {
              business: true,
            },
          },
        },
      });

      return updated;
    }),

  /**
   * Delete a service
   */
  delete: businessOwnerProcedure
    .input(z.object({
      id: z.string().cuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify service ownership
      const service = await ctx.prisma.service.findFirst({
        where: {
          id: input.id,
          location: {
            business: {
              owner: { clerkId: ctx.userId },
            },
          },
        },
        include: {
          _count: {
            select: {
              appointments: true,
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Servicio no encontrado',
        });
      }

      // Check if service has appointments
      if (service._count.appointments > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'No puedes eliminar un servicio que tiene citas asociadas',
        });
      }

      await ctx.prisma.service.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

