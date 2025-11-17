/**
 * Users Router (v1)
 * Handles user-related operations
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';

export const usersRouter = createTRPCRouter({
  /**
   * Get current user profile
   */
  getMe: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.dbUser) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Debes iniciar sesión',
      });
    }

    return ctx.dbUser;
  }),

  /**
   * Update current user profile
   */
  updateMe: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        phone: z.string().optional(),
        documentType: z.enum(['DNI', 'PASSPORT', 'CUIT', 'CUIL']).optional(),
        documentNumber: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.dbUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión',
        });
      }

      const updated = await ctx.prisma.user.update({
        where: { id: ctx.dbUser.id },
        data: input,
      });

      return updated;
    }),

  /**
   * Sync user - ensures user exists in database
   * This is a no-op if user already exists, but triggers creation if needed
   */
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.dbUser) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Debes iniciar sesión',
      });
    }

    // User already synced in context, just return it
    return ctx.dbUser;
  }),
});

