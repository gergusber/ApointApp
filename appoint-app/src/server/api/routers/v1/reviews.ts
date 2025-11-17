/**
 * Reviews Router (v1)
 * Handles review-related operations
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, businessOwnerProcedure, publicProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export const reviewsRouter = createTRPCRouter({
  /**
   * Get reviews for a business (public)
   */
  getByBusiness: publicProcedure
    .input(
      z.object({
        businessId: z.string().cuid(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where = {
        businessId: input.businessId,
        isPublished: true,
      };

      const [reviews, total] = await Promise.all([
        ctx.prisma.review.findMany({
          where,
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.review.count({ where }),
      ]);

      return {
        reviews,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Create a review (authenticated user)
   */
  create: protectedProcedure
    .input(
      z.object({
        businessId: z.string().cuid(),
        rating: z.number().min(1).max(5),
        comment: z.string().max(1000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.dbUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión',
        });
      }

      // Check if user has completed appointments with this business
      const hasAppointments = await ctx.prisma.appointment.findFirst({
        where: {
          userId: ctx.dbUser.id,
          businessId: input.businessId,
          status: 'COMPLETED',
        },
      });

      if (!hasAppointments) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Debes tener al menos una cita completada para dejar una reseña',
        });
      }

      // Check if user already reviewed this business
      const existingReview = await ctx.prisma.review.findFirst({
        where: {
          userId: ctx.dbUser.id,
          businessId: input.businessId,
        },
      });

      if (existingReview) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Ya has dejado una reseña para este negocio',
        });
      }

      const review = await ctx.prisma.review.create({
        data: {
          userId: ctx.dbUser.id,
          businessId: input.businessId,
          rating: input.rating,
          comment: input.comment,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return review;
    }),

  /**
   * Business responds to a review
   */
  respond: businessOwnerProcedure
    .input(
      z.object({
        reviewId: z.string().cuid(),
        response: z.string().min(10).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify review belongs to business owned by user
      const review = await ctx.prisma.review.findFirst({
        where: {
          id: input.reviewId,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
      });

      if (!review) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reseña no encontrada',
        });
      }

      const updatedReview = await ctx.prisma.review.update({
        where: { id: input.reviewId },
        data: {
          response: input.response,
          respondedAt: new Date(),
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      return updatedReview;
    }),
});

