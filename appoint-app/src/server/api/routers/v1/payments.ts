/**
 * Payments Router (v1)
 * Handles payment-related operations
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, businessOwnerProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { createAppointmentPreference } from '@/lib/mercadopago/preferences';

export const paymentsRouter = createTRPCRouter({
  /**
   * Create payment preference for an appointment
   */
  createPreference: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.dbUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión',
        });
      }

      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          userId: ctx.dbUser.id,
        },
        include: {
          user: true,
          service: {
            include: {
              location: {
                include: {
                  business: true,
                },
              },
            },
          },
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        });
      }

      if (appointment.status !== 'PAYMENT_PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta cita no requiere pago en este momento',
        });
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      const preference = await createAppointmentPreference({
        appointmentId: appointment.id,
        title: `Cita - ${appointment.service.name}`,
        description: `Cita en ${appointment.service.location.business.name}`,
        amount: appointment.totalAmount,
        payerEmail: appointment.user.email,
        payerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
        successUrl: `${baseUrl}/panel/citas/${appointment.id}?payment=success`,
        failureUrl: `${baseUrl}/panel/citas/${appointment.id}?payment=failure`,
        pendingUrl: `${baseUrl}/panel/citas/${appointment.id}?payment=pending`,
      });

      // Store preference ID in payment record
      await ctx.prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: appointment.totalAmount,
          status: 'PENDING',
          preferenceId: preference.id,
          paymentLink: preference.init_point || preference.sandbox_init_point || null,
          type: 'FULL_PAYMENT',
          platformFee: appointment.platformFee,
          netAmount: appointment.totalAmount - appointment.platformFee,
        },
      });

      return {
        preferenceId: preference.id,
        initPoint: preference.init_point,
        sandboxInitPoint: preference.sandbox_init_point,
      };
    }),

  /**
   * Get payment status
   */
  getPaymentStatus: protectedProcedure
    .input(z.object({ appointmentId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.dbUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión',
        });
      }

      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          userId: ctx.dbUser.id,
        },
        include: {
          payments: {
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        });
      }

      return {
        appointmentStatus: appointment.status,
        paymentStatus: appointment.paymentStatus,
        totalAmount: appointment.totalAmount,
        totalPaid: appointment.totalPaid,
        payments: appointment.payments,
      };
    }),

  /**
   * Process refund (business owner only)
   */
  processRefund: businessOwnerProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
        amount: z.number().positive().optional(), // If not provided, refund full amount
        reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          business: {
            owner: { clerkId: ctx.userId },
          },
        },
        include: {
          payments: {
            where: {
              status: 'PAID',
            },
          },
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        });
      }

      // TODO: Implement actual MercadoPago refund API call
      // For now, just update the payment status

      const refundAmount = input.amount || appointment.totalPaid;

      if (refundAmount > appointment.totalPaid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El monto del reembolso excede el monto pagado',
        });
      }

      // Create refund payment record
      await ctx.prisma.payment.create({
        data: {
          appointmentId: appointment.id,
          amount: -refundAmount, // Negative for refund
          status: 'REFUNDED',
          type: 'REFUND',
          platformFee: 0,
          netAmount: -refundAmount,
          metadata: input.reason ? { reason: input.reason } : undefined,
        },
      });

      // Update appointment
      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          totalPaid: appointment.totalPaid - refundAmount,
          paymentStatus: refundAmount === appointment.totalPaid ? 'REFUNDED' : 'PARTIALLY_REFUNDED',
        },
      });

      // TODO: Send notification when notification service is created

      return {
        appointment: updatedAppointment,
        refundAmount,
      };
    }),
});

