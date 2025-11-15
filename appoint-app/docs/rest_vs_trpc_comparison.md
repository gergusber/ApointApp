# Multi-Business Appointments Platform - V2 (tRPC + Mobile Ready)
**With tRPC, API Versioning, and Full Documentation**

---

## 🚀 Major Updates in V2

### New Features
1. ✅ **tRPC** for end-to-end type safety
2. ✅ **API Versioning** (v1, v2, etc.)
3. ✅ **OpenAPI Documentation** (auto-generated from tRPC)
4. ✅ **Mobile-Ready Architecture** (React Native support)
5. ✅ **Shared Types** between web and mobile
6. ✅ **Enhanced Developer Experience**

---

## 📦 Updated Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Validation**: Zod (shared with backend)
- **API Client**: tRPC Client (type-safe)
- **State Management**: React Context + tRPC queries

### Backend
- **API**: tRPC v11 (instead of REST API routes)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: Clerk (universal - web + mobile)
- **API Documentation**: tRPC-OpenAPI + Swagger UI
- **File Storage**: Cloudinary

### Mobile (Future Phase)
- **Framework**: React Native + Expo
- **API Client**: tRPC Client (same types as web!)
- **Auth**: @clerk/clerk-expo
- **State**: TanStack Query (React Query)

### DevOps
- **Deployment**: Vercel (Next.js)
- **Database Hosting**: Neon/Railway
- **Environment Management**: .env with validation

---

## 🗄️ Updated Project Structure

```
appointments-platform/
├── src/
│   ├── app/                              # Next.js App Router
│   │   ├── (auth)/
│   │   ├── (public)/
│   │   ├── (dashboard)/
│   │   ├── (admin)/
│   │   ├── api/
│   │   │   ├── trpc/[trpc]/route.ts     # tRPC endpoint
│   │   │   ├── docs/route.ts             # OpenAPI docs
│   │   │   ├── webhooks/
│   │   │   │   ├── clerk/route.ts
│   │   │   │   └── mercadopago/route.ts
│   │   │   └── health/route.ts           # Health check
│   │   ├── layout.tsx
│   │   └── globals.css
│   │
│   ├── server/                           # Backend (tRPC)
│   │   ├── api/
│   │   │   ├── root.ts                   # Root router
│   │   │   ├── trpc.ts                   # tRPC config
│   │   │   └── routers/                  # API routers
│   │   │       ├── v1/                   # Version 1 API
│   │   │       │   ├── auth.ts
│   │   │       │   ├── businesses.ts
│   │   │       │   ├── locations.ts
│   │   │       │   ├── services.ts
│   │   │       │   ├── appointments.ts
│   │   │       │   ├── professionals.ts
│   │   │       │   ├── payments.ts
│   │   │       │   ├── reviews.ts
│   │   │       │   ├── messages.ts
│   │   │       │   ├── notifications.ts
│   │   │       │   └── news.ts
│   │   │       └── index.ts              # Export all routers
│   │   │
│   │   ├── services/                     # Business logic
│   │   │   ├── appointment-service.ts
│   │   │   ├── availability-service.ts
│   │   │   ├── payment-service.ts
│   │   │   ├── notification-service.ts
│   │   │   └── conflict-detector.ts
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.ts                   # Auth middleware
│   │   │   └── logger.ts                 # Request logging
│   │   │
│   │   └── utils/
│   │       ├── errors.ts                 # Custom errors
│   │       └── response.ts               # Response helpers
│   │
│   ├── lib/
│   │   ├── db/
│   │   │   └── prisma.ts                 # Prisma client
│   │   ├── auth/
│   │   │   ├── clerk.ts
│   │   │   └── permissions.ts
│   │   ├── mercadopago/
│   │   │   ├── client.ts
│   │   │   ├── preferences.ts
│   │   │   └── webhooks.ts
│   │   ├── email/
│   │   │   ├── templates/
│   │   │   └── sender.ts
│   │   ├── validations/                  # Zod schemas
│   │   │   ├── business.ts
│   │   │   ├── location.ts
│   │   │   ├── service.ts
│   │   │   ├── appointment.ts
│   │   │   └── common.ts
│   │   └── utils/
│   │       ├── date.ts
│   │       ├── currency.ts
│   │       └── slugify.ts
│   │
│   ├── components/                       # React components
│   │   ├── ui/                          # shadcn/ui
│   │   ├── booking/
│   │   ├── business/
│   │   ├── dashboard/
│   │   ├── forms/
│   │   └── layout/
│   │
│   ├── hooks/                           # React hooks
│   │   ├── use-appointments.ts
│   │   ├── use-business.ts
│   │   └── use-availability.ts
│   │
│   └── types/                           # Shared types
│       ├── api.ts                       # API types (generated from tRPC)
│       ├── business.ts
│       └── appointment.ts
│
├── packages/                            # Shared packages (monorepo ready)
│   └── shared/                          # Shared between web & mobile
│       ├── types/                       # TypeScript types
│       ├── validations/                 # Zod schemas
│       └── utils/                       # Utility functions
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── docs/                                # API Documentation
│   ├── api/
│   │   ├── v1/
│   │   │   ├── appointments.md
│   │   │   ├── businesses.md
│   │   │   └── ...
│   │   └── openapi.json               # Auto-generated
│   ├── guides/
│   │   ├── mobile-integration.md
│   │   ├── authentication.md
│   │   └── webhooks.md
│   └── README.md
│
├── scripts/
│   ├── generate-openapi.ts             # Generate OpenAPI spec
│   └── seed-dev-data.ts
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 🔧 tRPC Setup

### 1. Installation

```bash
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
npm install @tanstack/react-query
npm install superjson  # For Date/Map/Set serialization
npm install trpc-openapi  # For OpenAPI documentation
```

### 2. tRPC Configuration

```typescript
// src/server/api/trpc.ts
import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import superjson from 'superjson';
import { ZodError } from 'zod';
import { auth } from '@clerk/nextjs';
import { prisma } from '@/lib/db/prisma';

/**
 * 1. CONTEXT
 * This section defines the "contexts" that are available in the backend API.
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;
  
  // Get auth from Clerk (works for both web cookies and mobile JWT)
  const session = auth();
  
  return {
    prisma,
    session,
    req,
    res,
  };
};

/**
 * 2. INITIALIZATION
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE HELPERS
 */
export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

/**
 * Protected (authenticated) procedure
 * If you want a query or mutation to ONLY be accessible by logged in users
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  
  return next({
    ctx: {
      // infers the `session` as non-nullable
      session: { ...ctx.session, userId: ctx.session.userId },
    },
  });
});

/**
 * Business owner procedure
 * Only business owners can access
 */
export const businessOwnerProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { clerkId: ctx.session.userId },
      select: { role: true },
    });

    if (user?.role !== 'BUSINESS' && user?.role !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return next({ ctx });
  }
);

/**
 * Admin procedure
 * Only admins can access
 */
export const adminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { clerkId: ctx.session.userId },
      select: { role: true },
    });

    if (user?.role !== 'ADMIN') {
      throw new TRPCError({ code: 'FORBIDDEN' });
    }

    return next({ ctx });
  }
);
```

### 3. Root Router with Versioning

```typescript
// src/server/api/root.ts
import { createTRPCRouter } from './trpc';

// V1 Routers
import { authRouter } from './routers/v1/auth';
import { businessesRouter } from './routers/v1/businesses';
import { locationsRouter } from './routers/v1/locations';
import { servicesRouter } from './routers/v1/services';
import { appointmentsRouter } from './routers/v1/appointments';
import { paymentsRouter } from './routers/v1/payments';
import { reviewsRouter } from './routers/v1/reviews';
import { messagesRouter } from './routers/v1/messages';
import { notificationsRouter } from './routers/v1/notifications';
import { newsRouter } from './routers/v1/news';
import { professionalsRouter } from './routers/v1/professionals';

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  // Version 1 API
  v1: createTRPCRouter({
    auth: authRouter,
    businesses: businessesRouter,
    locations: locationsRouter,
    services: servicesRouter,
    appointments: appointmentsRouter,
    payments: paymentsRouter,
    reviews: reviewsRouter,
    messages: messagesRouter,
    notifications: notificationsRouter,
    news: newsRouter,
    professionals: professionalsRouter,
  }),
  
  // Future: Version 2 API
  // v2: createTRPCRouter({
  //   // Breaking changes go here
  // }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;
```

### 4. Example Router - Appointments

```typescript
// src/server/api/routers/v1/appointments.ts
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, businessOwnerProcedure } from '../../trpc';
import { TRPCError } from '@trpc/server';
import { createAppointmentSchema, rescheduleAppointmentSchema } from '@/lib/validations/appointment';
import { calculateAvailability } from '@/server/services/availability-service';
import { detectConflicts } from '@/server/services/conflict-detector';
import { sendAppointmentNotification } from '@/server/services/notification-service';

export const appointmentsRouter = createTRPCRouter({
  /**
   * Get all appointments for current user
   */
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(20),
    }))
    .query(async ({ ctx, input }) => {
      const userId = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.session.userId },
        select: { id: true },
      });

      if (!userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const where = {
        userId: userId.id,
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
                    business: true,
                  },
                },
              },
            },
            professional: true,
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
      const userId = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.session.userId },
        select: { id: true },
      });

      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.id,
          userId: userId?.id,
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
          payments: true,
          rescheduleHistory: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
      }

      return appointment;
    }),

  /**
   * Get appointments for business owner
   */
  getBusinessAppointments: businessOwnerProcedure
    .input(z.object({
      businessId: z.string().cuid(),
      status: z.enum(['PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']).optional(),
      startDate: z.date().optional(),
      endDate: z.date().optional(),
    }))
    .query(async ({ ctx, input }) => {
      // Verify business ownership
      const business = await ctx.prisma.business.findFirst({
        where: {
          id: input.businessId,
          owner: { clerkId: ctx.session.userId },
        },
      });

      if (!business) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      const appointments = await ctx.prisma.appointment.findMany({
        where: {
          businessId: input.businessId,
          ...(input.status && { status: input.status }),
          ...(input.startDate && { appointmentDate: { gte: input.startDate } }),
          ...(input.endDate && { appointmentDate: { lte: input.endDate } }),
        },
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
          professional: true,
        },
        orderBy: { appointmentDate: 'asc' },
      });

      return appointments;
    }),

  /**
   * Check available time slots
   */
  getAvailability: protectedProcedure
    .input(z.object({
      serviceId: z.string().cuid(),
      date: z.date(),
      professionalId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const service = await ctx.prisma.service.findUnique({
        where: { id: input.serviceId },
        include: {
          location: {
            include: {
              business: true,
              businessHours: true,
              blockedDates: true,
            },
          },
        },
      });

      if (!service) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service not found' });
      }

      const availability = await calculateAvailability({
        service,
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
    .input(createAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.session.userId },
        select: { id: true },
      });

      if (!userId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Service not found' });
      }

      // Check for conflicts
      const conflicts = await detectConflicts({
        serviceId: input.serviceId,
        date: input.appointmentDate,
        startTime: input.startTime,
        durationMinutes: service.durationMinutes,
        prisma: ctx.prisma,
      });

      // Calculate pricing
      const platformFee = service.price * 0.01; // 1% platform fee
      const totalAmount = service.price + platformFee;
      const depositAmount = service.depositAmount || 
        (service.depositPercentage ? service.price * (service.depositPercentage / 100) : null);

      // Calculate end time
      const [hours, minutes] = input.startTime.split(':').map(Number);
      const endDate = new Date(input.appointmentDate);
      endDate.setHours(hours, minutes + service.durationMinutes);
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;

      // Calculate approval deadline (2 hours from now)
      const approvalDeadline = new Date();
      approvalDeadline.setHours(approvalDeadline.getHours() + service.location.business.bookingApprovalHours);

      // Create appointment
      const appointment = await ctx.prisma.appointment.create({
        data: {
          userId: userId.id,
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
          conflictNotes: conflicts.length > 0 ? `Conflicto detectado con ${conflicts.length} cita(s)` : null,
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

      // Send notifications
      await sendAppointmentNotification({
        type: 'APPOINTMENT_REQUEST',
        appointment,
        prisma: ctx.prisma,
      });

      return appointment;
    }),

  /**
   * Business approves appointment
   */
  approve: businessOwnerProcedure
    .input(z.object({
      appointmentId: z.string().cuid(),
      internalNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          business: {
            owner: { clerkId: ctx.session.userId },
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
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
      }

      if (appointment.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Appointment already processed' });
      }

      // Generate MercadoPago payment link
      const paymentLink = await createPaymentPreference({
        appointment,
        mercadoPagoAccount: appointment.business.mercadoPagoAccount,
      });

      // Update appointment
      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'PAYMENT_PENDING',
          approvedAt: new Date(),
          internalNotes: input.internalNotes,
        },
      });

      // Send payment link to user
      await sendAppointmentNotification({
        type: 'PAYMENT_REQUIRED',
        appointment: updatedAppointment,
        paymentLink,
        prisma: ctx.prisma,
      });

      return {
        appointment: updatedAppointment,
        paymentLink,
      };
    }),

  /**
   * Business rejects appointment
   */
  reject: businessOwnerProcedure
    .input(z.object({
      appointmentId: z.string().cuid(),
      reason: z.string().min(10).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          business: {
            owner: { clerkId: ctx.session.userId },
          },
        },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
      }

      if (appointment.status !== 'PENDING') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Appointment already processed' });
      }

      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'REJECTED',
          rejectedAt: new Date(),
          rejectionReason: input.reason,
        },
      });

      // Notify user
      await sendAppointmentNotification({
        type: 'APPOINTMENT_REJECTED',
        appointment: updatedAppointment,
        prisma: ctx.prisma,
      });

      return updatedAppointment;
    }),

  /**
   * User cancels appointment
   */
  cancel: protectedProcedure
    .input(z.object({
      appointmentId: z.string().cuid(),
      reason: z.string().min(5).max(500),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.session.userId },
        select: { id: true },
      });

      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          userId: userId?.id,
        },
        include: {
          business: true,
          payments: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
      }

      if (appointment.status === 'CANCELLED') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Already cancelled' });
      }

      // Calculate refund eligibility
      const refundInfo = calculateRefund(appointment);

      // Update appointment
      const updatedAppointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });

      // Process refund if eligible
      if (refundInfo.refundAmount > 0 && appointment.paymentStatus === 'PAID') {
        await processRefund({
          appointment: updatedAppointment,
          refundAmount: refundInfo.refundAmount,
          prisma: ctx.prisma,
        });
      }

      // Notify business
      await sendAppointmentNotification({
        type: 'APPOINTMENT_CANCELLED',
        appointment: updatedAppointment,
        prisma: ctx.prisma,
      });

      return {
        appointment: updatedAppointment,
        refund: refundInfo,
      };
    }),

  /**
   * Reschedule appointment
   */
  reschedule: protectedProcedure
    .input(rescheduleAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = await ctx.prisma.user.findUnique({
        where: { clerkId: ctx.session.userId },
        select: { id: true },
      });

      const appointment = await ctx.prisma.appointment.findFirst({
        where: {
          id: input.appointmentId,
          userId: userId?.id,
        },
        include: {
          service: true,
        },
      });

      if (!appointment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Appointment not found' });
      }

      // Check new time availability
      const conflicts = await detectConflicts({
        serviceId: appointment.serviceId,
        date: input.newDate,
        startTime: input.newStartTime,
        durationMinutes: appointment.service.durationMinutes,
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
          initiatedBy: userId!.id,
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
      });

      // Notify business
      await sendAppointmentNotification({
        type: 'APPOINTMENT_RESCHEDULED',
        appointment: updatedAppointment,
        prisma: ctx.prisma,
      });

      return updatedAppointment;
    }),
});

// Helper functions (import from services)
function calculateRefund(appointment: any) {
  // Implementation from previous plan
  const now = new Date();
  const appointmentDateTime = new Date(
    `${appointment.appointmentDate}T${appointment.startTime}`
  );
  
  const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntil >= appointment.business.cancellationHours) {
    return {
      refundPercentage: 100,
      refundAmount: appointment.totalPaid,
    };
  }
  
  if (hoursUntil >= 4) {
    return {
      refundPercentage: appointment.business.refundPercentage,
      refundAmount: appointment.totalPaid * (appointment.business.refundPercentage / 100),
    };
  }
  
  return {
    refundPercentage: 0,
    refundAmount: 0,
  };
}

async function processRefund(params: any) {
  // Implementation using MercadoPago refund API
  // See payment-service.ts
}

async function createPaymentPreference(params: any) {
  // Implementation using MercadoPago
  // See payment-service.ts
}
```

### 5. Next.js tRPC Route Handler

```typescript
// src/app/api/trpc/[trpc]/route.ts
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';
import { appRouter } from '@/server/api/root';
import { createTRPCContext } from '@/server/api/trpc';

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
```

### 6. Client Setup (Web)

```typescript
// src/lib/trpc/client.ts
import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@/server/api/root';

export const trpc = createTRPCReact<AppRouter>();
```

```typescript
// src/app/providers.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import { useState } from 'react';
import { trpc } from '@/lib/trpc/client';
import superjson from 'superjson';

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }));

  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: `${process.env.NEXT_PUBLIC_APP_URL}/api/trpc`,
          // Works with Clerk cookies automatically!
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

```typescript
// src/app/layout.tsx
import { TRPCProvider } from './providers';
import { ClerkProvider } from '@clerk/nextjs';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="es">
        <body>
          <TRPCProvider>
            {children}
          </TRPCProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

### 7. Using tRPC in Components

```typescript
// Example: Booking page
'use client';

import { trpc } from '@/lib/trpc/client';
import { useState } from 'react';

export function BookingPage({ serviceId }: { serviceId: string }) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Query - Type-safe! Auto-complete works!
  const { data: availability, isLoading } = trpc.v1.appointments.getAvailability.useQuery({
    serviceId,
    date: selectedDate,
  });
  
  // Mutation - Type-safe!
  const createAppointment = trpc.v1.appointments.create.useMutation({
    onSuccess: (data) => {
      console.log('Appointment created:', data);
      // Navigate or show success
    },
    onError: (error) => {
      console.error('Error:', error.message);
    },
  });
  
  const handleBook = () => {
    createAppointment.mutate({
      serviceId,
      appointmentDate: selectedDate,
      startTime: '10:00',
      customerNotes: 'Test booking',
    });
  };
  
  if (isLoading) return <div>Cargando disponibilidad...</div>;
  
  return (
    <div>
      <h2>Horarios disponibles</h2>
      {availability?.slots.map(slot => (
        <button key={slot} onClick={() => handleBook()}>
          {slot}
        </button>
      ))}
    </div>
  );
}
```

---

## 📱 Mobile Integration (React Native)

### 1. Setup

```bash
# In your React Native project
npm install @trpc/client @trpc/react-query
npm install @tanstack/react-query
npm install superjson
npm install @clerk/clerk-expo
```

### 2. Client Configuration

```typescript
// mobile/src/lib/trpc.ts
import { createTRPCReact } from '@trpc/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { useAuth } from '@clerk/clerk-expo';

// Import type from your server
import type { AppRouter } from '../../../src/server/api/root';

export const trpc = createTRPCReact<AppRouter>();

export function useTRPC() {
  const { getToken } = useAuth();
  
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: 'https://yourapp.com/api/trpc',
        async headers() {
          const token = await getToken();
          return {
            authorization: token ? `Bearer ${token}` : undefined,
          };
        },
      }),
    ],
  });
}
```

### 3. Usage in Mobile

```typescript
// mobile/src/screens/BookingScreen.tsx
import { trpc } from '../lib/trpc';
import { View, Text, TouchableOpacity } from 'react-native';

export function BookingScreen({ serviceId }: { serviceId: string }) {
  // SAME API as web! Type-safe!
  const { data: availability } = trpc.v1.appointments.getAvailability.useQuery({
    serviceId,
    date: new Date(),
  });
  
  const createAppointment = trpc.v1.appointments.create.useMutation();
  
  return (
    <View>
      <Text>Horarios disponibles</Text>
      {availability?.slots.map(slot => (
        <TouchableOpacity
          key={slot}
          onPress={() => createAppointment.mutate({
            serviceId,
            appointmentDate: new Date(),
            startTime: slot,
          })}
        >
          <Text>{slot}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
```

---

## 📚 API Documentation (OpenAPI)

### 1. Generate OpenAPI Spec from tRPC

```typescript
// scripts/generate-openapi.ts
import { generateOpenApiDocument } from 'trpc-openapi';
import { appRouter } from '../src/server/api/root';
import fs from 'fs';

const openApiDocument = generateOpenApiDocument(appRouter, {
  title: 'Appointments API',
  description: 'API documentation for Argentina Appointments Platform',
  version: '1.0.0',
  baseUrl: 'https://yourapp.com/api/trpc',
  docsUrl: 'https://yourapp.com/api/docs',
  tags: ['v1'],
});

// Save to file
fs.writeFileSync(
  './docs/api/openapi.json',
  JSON.stringify(openApiDocument, null, 2)
);

console.log('✅ OpenAPI spec generated!');
```

### 2. Add to package.json

```json
{
  "scripts": {
    "generate:openapi": "tsx scripts/generate-openapi.ts",
    "dev": "next dev",
    "build": "npm run generate:openapi && next build"
  }
}
```

### 3. Swagger UI Route

```typescript
// src/app/api/docs/route.ts
import { NextResponse } from 'next/server';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import openApiSpec from '@/docs/api/openapi.json';

export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>API Documentation</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@latest/swagger-ui.css" />
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@latest/swagger-ui-bundle.js"></script>
        <script>
          SwaggerUIBundle({
            url: '/api/docs/spec',
            dom_id: '#swagger-ui',
          });
        </script>
      </body>
    </html>
  `;
  
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html' },
  });
}
```

```typescript
// src/app/api/docs/spec/route.ts
import { NextResponse } from 'next/server';
import openApiSpec from '@/docs/api/openapi.json';

export async function GET() {
  return NextResponse.json(openApiSpec);
}
```

### 4. Access Documentation

Visit: `https://yourapp.com/api/docs`

---

## 📖 Manual Documentation

Create comprehensive docs in `/docs/api/v1/`:

```markdown
<!-- docs/api/v1/appointments.md -->

# Appointments API

## Overview
The Appointments API allows users to create, manage, and query appointments.

## Endpoints

### Get All Appointments
**Procedure:** `v1.appointments.getAll`

**Type:** Query

**Authentication:** Required

**Input:**
```typescript
{
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
  page?: number,
  limit?: number
}
```

**Output:**
```typescript
{
  appointments: Appointment[],
  pagination: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}
```

**Example (Web):**
```typescript
const { data } = trpc.v1.appointments.getAll.useQuery({
  status: 'CONFIRMED',
  page: 1,
  limit: 20
});
```

**Example (Mobile):**
```typescript
const { data } = trpc.v1.appointments.getAll.useQuery({
  status: 'CONFIRMED',
  page: 1,
  limit: 20
});
```

**Example (cURL):**
```bash
curl -X GET 'https://yourapp.com/api/trpc/v1.appointments.getAll?input={"status":"CONFIRMED"}' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Create Appointment
**Procedure:** `v1.appointments.create`

**Type:** Mutation

**Authentication:** Required

**Input:**
```typescript
{
  serviceId: string,
  appointmentDate: Date,
  startTime: string, // HH:MM format
  customerNotes?: string,
  professionalId?: string
}
```

**Output:**
```typescript
Appointment
```

**Validation:**
- `serviceId`: Must be valid CUID
- `appointmentDate`: Cannot be in the past
- `startTime`: Must be HH:MM format (24-hour)
- `customerNotes`: Max 500 characters

**Error Codes:**
- `UNAUTHORIZED`: User not logged in
- `NOT_FOUND`: Service not found
- `BAD_REQUEST`: Invalid input or time slot unavailable

**Example:**
```typescript
const createAppointment = trpc.v1.appointments.create.useMutation();

createAppointment.mutate({
  serviceId: 'abc123',
  appointmentDate: new Date('2025-01-15'),
  startTime: '10:00',
  customerNotes: 'Primera consulta'
});
```
```

---

## 🔧 Updated Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/appointments_ar"

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/ingresar
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/registrarse
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/panel
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/panel

# tRPC
NEXT_PUBLIC_TRPC_URL=http://localhost:3000/api/trpc

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxx

# Email
RESEND_API_KEY=re_xxxxx
EMAIL_FROM=noreply@tucita.com.ar

# File Upload
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=xxxxx
CLOUDINARY_API_KEY=xxxxx
CLOUDINARY_API_SECRET=xxxxx

# Encryption
ENCRYPTION_KEY=xxxxx

# Timezone
TZ=America/Argentina/Buenos_Aires

# Platform Settings
PLATFORM_FEE_PERCENTAGE=1
DEFAULT_APPROVAL_HOURS=2
API_VERSION=v1
```

---

## 📦 Updated Package.json

```json
{
  "name": "appointments-platform",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "npm run generate:openapi && next build",
    "start": "next start",
    "lint": "next lint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts",
    "generate:openapi": "tsx scripts/generate-openapi.ts",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@clerk/nextjs": "^5.0.0",
    "@prisma/client": "^5.20.0",
    "@tanstack/react-query": "^5.50.0",
    "@trpc/client": "^11.0.0",
    "@trpc/next": "^11.0.0",
    "@trpc/react-query": "^11.0.0",
    "@trpc/server": "^11.0.0",
    "mercadopago": "^2.0.0",
    "next": "15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "superjson": "^2.2.0",
    "trpc-openapi": "^1.2.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^19.0.0",
    "prisma": "^5.20.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.5.0",
    "tsx": "^4.7.0"
  }
}
```

---

## 🚀 Updated Development Roadmap

### Phase 1: MVP (Weeks 1-8)

#### Week 1-2: Foundation & tRPC Setup
- [ ] Project initialization
- [ ] **Install tRPC dependencies**
- [ ] **Configure tRPC with Clerk auth**
- [ ] Database schema and migrations
- [ ] **Set up API versioning structure (v1/)**
- [ ] shadcn/ui components
- [ ] Utilities (date, currency)

#### Week 3-4: Core API Routers
- [ ] **Auth router** (if needed beyond Clerk)
- [ ] **Businesses router** (CRUD)
- [ ] **Locations router**
- [ ] **Services router**
- [ ] **Basic documentation for each router**
- [ ] Business registration flow (UI)
- [ ] Service management (UI)

#### Week 5-6: Appointments API & UI
- [ ] **Appointments router (full CRUD)**
- [ ] **Availability calculation procedure**
- [ ] **Approval/rejection procedures**
- [ ] Booking UI components
- [ ] Calendar integration
- [ ] Time slot picker

#### Week 7-8: Directory & Business Pages
- [ ] Public directory listing
- [ ] Business landing pages
- [ ] Service display
- [ ] Reviews display (read-only)
- [ ] SEO optimization

### Phase 2: Payments & Management (Weeks 9-12)

#### Week 9-10: Payments Router & MercadoPago
- [ ] **Payments router**
- [ ] **Payment preference creation procedure**
- [ ] MercadoPago integration
- [ ] Webhook handling (REST endpoint, not tRPC)
- [ ] Payment confirmation flow
- [ ] **Refund procedures**

#### Week 11-12: Dashboards & Advanced Features
- [ ] **Messages router**
- [ ] **Notifications router**
- [ ] User dashboard UI
- [ ] Business dashboard UI
- [ ] Calendar views
- [ ] Basic analytics

### Phase 3: Documentation & Mobile Prep (Weeks 13-16)

#### Week 13: API Documentation
- [ ] **Generate OpenAPI spec**
- [ ] **Set up Swagger UI**
- [ ] **Write manual documentation**
- [ ] **Create integration guides**
- [ ] **Mobile integration guide**

#### Week 14: Professional Management
- [ ] **Professionals router**
- [ ] Professional assignment
- [ ] Location-day scheduling
- [ ] Professional dashboard

#### Week 15: Reviews & News
- [ ] **Reviews router**
- [ ] **News router (admin)**
- [ ] Review submission UI
- [ ] News display

#### Week 16: Testing & Polish
- [ ] **API testing (all routers)**
- [ ] **Mobile integration test (React Native)**
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deploy to production

---

## ✅ Benefits of This Approach

### For Development
1. **Type Safety**: Full TypeScript inference from backend to frontend
2. **Auto-completion**: IDE knows all procedures and their types
3. **Validation**: Zod schemas validate both input and output
4. **No API client code**: No need to write fetch/axios wrappers
5. **Versioning**: Easy to add v2 without breaking v1

### For Mobile
1. **Same API**: Web and mobile use identical procedures
2. **Shared types**: Import types from server to mobile
3. **No duplication**: Write business logic once
4. **Consistent errors**: Same error handling everywhere

### For Documentation
1. **Auto-generated**: OpenAPI spec from tRPC routers
2. **Always up-to-date**: Docs match actual implementation
3. **Interactive**: Swagger UI for testing
4. **Examples**: Real TypeScript examples

---

## 🎯 Next Steps

1. **Answer remaining checklist questions**
2. **Set up accounts** (Clerk, MercadoPago, etc.)
3. **Initialize project with tRPC**
4. **Create first router** (businesses)
5. **Test with React Native** (early validation)

Would you like me to help you initialize the project with this new structure?