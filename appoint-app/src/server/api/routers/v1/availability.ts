/**
 * Availability Router (v1)
 * Handles business hours and blocked dates
 */

import { z } from 'zod';
import { createTRPCRouter, businessOwnerProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { DayOfWeek } from '@prisma/client';

export const availabilityRouter = createTRPCRouter({
  /**
   * Get business hours for a location
   */
  getBusinessHours: businessOwnerProcedure
    .input(z.object({ locationId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Verify location ownership
      const location = await ctx.prisma.location.findFirst({
        where: {
          id: input.locationId,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
        include: {
          businessHours: true,
        },
      });

      if (!location) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ubicación no encontrada',
        });
      }

      return location.businessHours;
    }),

  /**
   * Set business hours for a location
   */
  setBusinessHours: businessOwnerProcedure
    .input(
      z.object({
        locationId: z.string().cuid(),
        hours: z.array(
          z.object({
            dayOfWeek: z.nativeEnum(DayOfWeek),
            openTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
            closeTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
            isClosed: z.boolean().default(false),
          })
        ),
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
          code: 'NOT_FOUND',
          message: 'Ubicación no encontrada',
        });
      }

      // Delete existing hours
      await ctx.prisma.businessHours.deleteMany({
        where: { locationId: input.locationId },
      });

      // Create new hours
      const createdHours = await ctx.prisma.businessHours.createMany({
        data: input.hours.map((hour) => ({
          locationId: input.locationId,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed,
        })),
      });

      // Return updated hours
      const updatedHours = await ctx.prisma.businessHours.findMany({
        where: { locationId: input.locationId },
      });

      return updatedHours;
    }),

  /**
   * Get blocked dates for a location
   */
  getBlockedDates: businessOwnerProcedure
    .input(
      z.object({
        locationId: z.string().cuid(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
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
          code: 'NOT_FOUND',
          message: 'Ubicación no encontrada',
        });
      }

      const blockedDates = await ctx.prisma.blockedDate.findMany({
        where: {
          locationId: input.locationId,
          ...(input.startDate && { date: { gte: input.startDate } }),
          ...(input.endDate && { date: { lte: input.endDate } }),
        },
        orderBy: {
          date: 'asc',
        },
      });

      return blockedDates;
    }),

  /**
   * Create blocked date
   */
  createBlockedDate: businessOwnerProcedure
    .input(
      z.object({
        locationId: z.string().cuid(),
        date: z.date(),
        reason: z.string().max(200).optional(),
        isRecurring: z.boolean().default(false),
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
          code: 'NOT_FOUND',
          message: 'Ubicación no encontrada',
        });
      }

      // Check if date is already blocked
      const existing = await ctx.prisma.blockedDate.findFirst({
        where: {
          locationId: input.locationId,
          date: input.date,
        },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Esta fecha ya está bloqueada',
        });
      }

      const blockedDate = await ctx.prisma.blockedDate.create({
        data: {
          locationId: input.locationId,
          date: input.date,
          reason: input.reason,
          isRecurring: input.isRecurring,
        },
      });

      return blockedDate;
    }),

  /**
   * Delete blocked date
   */
  deleteBlockedDate: businessOwnerProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify blocked date ownership
      const blockedDate = await ctx.prisma.blockedDate.findFirst({
        where: {
          id: input.id,
          location: {
            business: {
              owner: { clerkId: ctx.userId },
            },
          },
        },
      });

      if (!blockedDate) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Fecha bloqueada no encontrada',
        });
      }

      await ctx.prisma.blockedDate.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});

