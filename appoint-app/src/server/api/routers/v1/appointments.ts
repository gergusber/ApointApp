/**
 * Appointments Router (v1)
 * Handles appointment-related operations
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, businessOwnerProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { AppointmentStatus, PaymentStatus } from '@prisma/client';
import { calculateAvailability } from '@/server/services/availability-service';
import { detectConflicts } from '@/server/services/conflict-detector';
import { sendAppointmentNotification } from '@/server/services/notification-service';

export const appointmentsRouter = createTRPCRouter({
  /**
   * Get all appointments for current user
   */
  getAll: protectedProcedure
    .input(
      z.object({
        status: z
          .enum([
            'PENDING',
            'PAYMENT_PENDING',
            'CONFIRMED',
            'CANCELLED',
            'REJECTED',
            'EXPIRED',
            'COMPLETED',
            'NO_SHOW',
          ])
          .optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.dbUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión',
        });
      }

      const where: any = {
        userId: ctx.dbUser.id,
        ...(input.status && { status: input.status }),
      };

      const [appointments, total] = await Promise.all([
        ctx.prisma.appointment.findMany({
          where,
          include: {
            service: {
              include: {
                location: {
                  include: {
                    business: {
                      select: {
                        id: true,
                        name: true,
                        slug: true,
                      },
                    },
                  },
                },
              },
            },
            professional: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
          orderBy: { appointmentDate: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.appointment.count({ where }),
      ]);

      return {
        appointments,
        pagination: {
          page: input.page,
          limit: input.limit,
          total,
          totalPages: Math.ceil(total / input.limit),
        },
      };
    }),

  /**
   * Get single appointment by ID
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.dbUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión',
        });
      }

      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.id,
          OR: [
            { userId: ctx.dbUser.id }, // User owns it
            {
              business: {
                owner: { clerkId: ctx.userId }, // Or user owns the business
              },
            },
          ],
        },
        include: {
          service: {
            include: {
              location: {
                include: {
                  business: true,
                },
              },
            },
          },
          professional: true,
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          payments: true,
          rescheduleHistory: {
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

      return appointment;
    }),

  /**
   * Get appointments for business owner
   */
  getBusinessAppointments: businessOwnerProcedure
    .input(
      z.object({
        businessId: z.string().cuid(),
        status: z
          .enum([
            'PENDING',
            'PAYMENT_PENDING',
            'CONFIRMED',
            'CANCELLED',
            'REJECTED',
            'EXPIRED',
            'COMPLETED',
            'NO_SHOW',
          ])
          .optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
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

      const where: any = {
        businessId: input.businessId,
        ...(input.status && { status: input.status }),
        ...(input.startDate && { appointmentDate: { gte: input.startDate } }),
        ...(input.endDate && { appointmentDate: { lte: input.endDate } }),
      };

      const appointments = await ctx.prisma.appointment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          service: true,
          professional: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { appointmentDate: 'asc' },
      });

      return appointments;
    }),

  /**
   * Check available time slots
   */
  getAvailability: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().cuid(),
        date: z.date(),
        professionalId: z.string().cuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const availability = await calculateAvailability({
        serviceId: input.serviceId,
        date: input.date,
        professionalId: input.professionalId,
        prisma: ctx.prisma,
      });

      return availability;
    }),

  /**
   * Create appointment request
   */
  create: protectedProcedure
    .input(
      z.object({
        serviceId: z.string().cuid(),
        appointmentDate: z.date(),
        startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        customerNotes: z.string().max(500).optional(),
        professionalId: z.string().cuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Use dbUser from context (already synced)
      if (!ctx.dbUser) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'Debes iniciar sesión para crear una cita',
        });
      }

      const user = ctx.dbUser;

      // Get service details
      const service = await ctx.prisma.service.findUnique({
        where: { id: input.serviceId },
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

      if (!service.isActive) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Este servicio no está disponible',
        });
      }

      // Check for conflicts
      const conflicts = await detectConflicts({
        serviceId: input.serviceId,
        date: input.appointmentDate,
        startTime: input.startTime,
        durationMinutes: service.durationMinutes,
        professionalId: input.professionalId,
        prisma: ctx.prisma,
      });

      // Calculate pricing
      const platformFee = service.price * 0.01; // 1% platform fee
      const totalAmount = service.price + platformFee;
      const depositAmount = service.requiresDeposit
        ? service.depositAmount ||
          (service.depositPercentage
            ? service.price * (service.depositPercentage / 100)
            : null)
        : null;

      // Calculate end time
      const [hours, minutes] = input.startTime.split(':').map(Number);
      const endDate = new Date(input.appointmentDate);
      endDate.setHours(hours, minutes + service.durationMinutes);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      // Calculate approval deadline (2 hours from now by default)
      const approvalDeadline = new Date();
      approvalDeadline.setHours(
        approvalDeadline.getHours() + service.location.business.bookingApprovalHours
      );

      // Create appointment
      const appointment = await ctx.prisma.appointment.create({
        data: {
          userId: user.id,
          businessId: service.location.business.id,
          serviceId: input.serviceId,
          professionalId: input.professionalId,
          appointmentDate: input.appointmentDate,
          startTime: input.startTime,
          endTime,
          customerNotes: input.customerNotes,
          servicePrice: service.price,
          depositAmount,
          totalAmount,
          platformFee,
          approvalDeadline,
          hasConflict: conflicts.length > 0,
          conflictNotes:
            conflicts.length > 0
              ? `Conflicto detectado con ${conflicts.length} cita(s)`
              : null,
          status: service.requiresApproval ? 'PENDING' : 'CONFIRMED',
        },
        include: {
          service: {
            include: {
              location: {
                include: {
                  business: true,
                },
              },
            },
          },
          user: true,
        },
      });

      // Send notification if approval required
      if (service.requiresApproval) {
        await sendAppointmentNotification({
          appointmentId: appointment.id,
          type: 'REQUEST',
          prisma: ctx.prisma,
        });
      }

      return appointment;
    }),

  /**
   * Business approves appointment
   */
  approve: businessOwnerProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
        internalNotes: z.string().optional(),
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
          business: {
            include: {
              mercadoPagoAccount: true,
            },
          },
          user: true,
          service: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        });
      }

      if (appointment.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta cita ya fue procesada',
        });
      }

      // Check if approval deadline has passed
      if (appointment.approvalDeadline && new Date() > appointment.approvalDeadline) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El plazo de aprobación ha expirado',
        });
      }

      // Update appointment
      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'PAYMENT_PENDING',
          approvedAt: new Date(),
          internalNotes: input.internalNotes,
        },
        include: {
          service: {
            include: {
              location: {
                include: {
                  business: true,
                },
              },
            },
          },
          user: true,
        },
      });

      // Send notification
      await sendAppointmentNotification({
        appointmentId: input.appointmentId,
        type: 'APPROVED',
        prisma: ctx.prisma,
      });

      return {
        appointment: updatedAppointment,
      };
    }),

  /**
   * Business rejects appointment
   */
  reject: businessOwnerProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
        reason: z.string().min(10).max(500),
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
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        });
      }

      if (appointment.status !== 'PENDING') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta cita ya fue procesada',
        });
      }

      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        },
        include: {
          service: {
            include: {
              location: {
                include: {
                  business: true,
                },
              },
            },
          },
          user: true,
        },
      });

      // Send notification
      await sendAppointmentNotification({
        appointmentId: input.appointmentId,
        type: 'REJECTED',
        prisma: ctx.prisma,
      });

      return updatedAppointment;
    }),

  /**
   * User cancels appointment
   */
  cancel: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
        reason: z.string().min(5).max(500),
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
          business: true,
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

      if (appointment.status === 'CANCELLED') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Esta cita ya fue cancelada',
        });
      }

      // Calculate refund eligibility
      const now = new Date();
      const appointmentDateTime = new Date(appointment.appointmentDate);
      const [hours, minutes] = appointment.startTime.split(':').map(Number);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      let refundPercentage = 0;
      if (hoursUntil >= appointment.business.cancellationHours) {
        refundPercentage = 100;
      } else if (hoursUntil >= 4) {
        refundPercentage = appointment.business.refundPercentage;
      }

      const refundAmount =
        appointment.payments.length > 0
          ? (appointment.totalPaid * refundPercentage) / 100
          : 0;

      // Update appointment
      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });

      // TODO: Process refund when payments router is created

      return {
        appointment: updatedAppointment,
        refund: {
          refundPercentage,
          refundAmount,
        },
      };
    }),

  /**
   * Reschedule appointment
   */
  reschedule: protectedProcedure
    .input(
      z.object({
        appointmentId: z.string().cuid(),
        newDate: z.date(),
        newStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
        reason: z.string().max(500).optional(),
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
          service: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Cita no encontrada',
        });
      }

      // Check new time availability
      const conflicts = await detectConflicts({
        serviceId: appointment.serviceId,
        date: input.newDate,
        startTime: input.newStartTime,
        durationMinutes: appointment.service.durationMinutes,
        professionalId: appointment.professionalId || undefined,
        excludeAppointmentId: appointment.id,
        prisma: ctx.prisma,
      });

      if (conflicts.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'El horario seleccionado no está disponible',
        });
      }

      // Record reschedule history
      await ctx.prisma.appointmentReschedule.create({
        data: {
          appointmentId: appointment.id,
          oldDate: appointment.appointmentDate,
          oldStartTime: appointment.startTime,
          newDate: input.newDate,
          newStartTime: input.newStartTime,
          reason: input.reason,
          initiatedBy: ctx.dbUser.id,
        },
      });

      // Calculate new end time
      const [hours, minutes] = input.newStartTime.split(':').map(Number);
      const endDate = new Date(input.newDate);
      endDate.setHours(hours, minutes + appointment.service.durationMinutes);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      // Update appointment
      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          appointmentDate: input.newDate,
          startTime: input.newStartTime,
          endTime,
        },
        include: {
          service: {
            include: {
              location: {
                include: {
                  business: true,
                },
              },
            },
          },
          user: true,
        },
      });

      // TODO: Send notification when notification service is created

      return updatedAppointment;
    }),
});

