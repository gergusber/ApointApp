# tRPC + TanStack Query Architecture Guide
**Backend Procedures → Frontend Hooks → Cache Management**

---

## 🎯 Overview

This guide shows how to structure your **backend tRPC procedures** and **frontend hooks** to leverage TanStack Query's powerful caching and state management.

### The Pattern

```
Backend (tRPC)          Frontend (React)        TanStack Query
─────────────────────────────────────────────────────────────
query procedure    →    useQuery hook      →    Automatic caching
                                                 Auto-refetch
                                                 Background updates

mutation procedure →    useMutation hook   →    Optimistic updates
                                                 Cache invalidation
                                                 Success/error handling
```

---

## 📋 Backend Structure (tRPC Procedures)

### Query Procedures (GET operations)
Use for: Reading data, fetching lists, getting details

```typescript
// src/server/api/routers/v1/appointments.ts

export const appointmentsRouter = createTRPCRouter({
  /**
   * GET operations use .query()
   * These will be called with useQuery on frontend
   */
  
  // Get all appointments for current user
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']).optional(),
      page: z.number().default(1),
      limit: z.number().default(20),
    }))
    .query(async ({ ctx, input }) => {
      // ✅ READ operation - no side effects
      const appointments = await ctx.prisma.appointment.findMany({
        where: {
          userId: ctx.userId,
          ...(input.status && { status: input.status }),
        },
        skip: (input.page - 1) * input.limit,
        take: input.limit,
      });
      
      return appointments;
    }),

  // Get single appointment
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // ✅ READ operation
      const appointment = await ctx.prisma.appointment.findUnique({
        where: { id: input.id },
        include: {
          service: true,
          business: true,
          professional: true,
        },
      });
      
      return appointment;
    }),

  // Check availability
  getAvailability: publicProcedure
    .input(z.object({
      serviceId: z.string(),
      date: z.date(),
    }))
    .query(async ({ ctx, input }) => {
      // ✅ READ operation - calculate available slots
      const slots = await calculateAvailability(input);
      return slots;
    }),
});
```

### Mutation Procedures (CREATE/UPDATE/DELETE operations)
Use for: Creating, updating, deleting data - anything that changes state

```typescript
export const appointmentsRouter = createTRPCRouter({
  /**
   * CREATE/UPDATE/DELETE operations use .mutation()
   * These will be called with useMutation on frontend
   */
  
  // Create new appointment
  create: protectedProcedure
    .input(createAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      // ✅ WRITE operation - creates new data
      const appointment = await ctx.prisma.appointment.create({
        data: {
          ...input,
          userId: ctx.userId,
          status: 'PENDING',
        },
      });
      
      // Send notification
      await sendAppointmentNotification(appointment);
      
      return appointment;
    }),

  // Approve appointment (business owner)
  approve: businessOwnerProcedure
    .input(z.object({ 
      appointmentId: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ✅ WRITE operation - updates status
      const appointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'PAYMENT_PENDING',
          approvedAt: new Date(),
          internalNotes: input.notes,
        },
      });
      
      // Generate payment link
      const paymentLink = await createMercadoPagoPreference(appointment);
      
      // Send payment link to user
      await sendPaymentLink(appointment, paymentLink);
      
      return { appointment, paymentLink };
    }),

  // Cancel appointment
  cancel: protectedProcedure
    .input(z.object({
      appointmentId: z.string(),
      reason: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // ✅ WRITE operation - updates status + processes refund
      const appointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: input.reason,
        },
      });
      
      // Process refund if eligible
      const refund = await processRefund(appointment);
      
      return { appointment, refund };
    }),

  // Reschedule appointment
  reschedule: protectedProcedure
    .input(rescheduleAppointmentSchema)
    .mutation(async ({ ctx, input }) => {
      // ✅ WRITE operation - updates date/time
      const appointment = await ctx.prisma.appointment.update({
        where: { id: input.appointmentId },
        data: {
          appointmentDate: input.newDate,
          startTime: input.newStartTime,
        },
      });
      
      // Record reschedule history
      await ctx.prisma.appointmentReschedule.create({
        data: {
          appointmentId: input.appointmentId,
          oldDate: input.oldDate,
          newDate: input.newDate,
          reason: input.reason,
        },
      });
      
      return appointment;
    }),
});
```

---

## 🎨 Frontend Structure (Custom Hooks)

### Pattern: One Hook Per Feature

Create custom hooks that wrap tRPC calls and handle caching logic.

```typescript
// src/hooks/use-appointments.ts
import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Custom hook for appointment-related operations
 * Encapsulates all appointment logic and cache management
 */
export function useAppointments() {
  const utils = trpc.useUtils();
  const { toast } = useToast();

  // ============================================
  // QUERIES (GET operations)
  // ============================================

  /**
   * Get all appointments
   * Auto-cached by TanStack Query
   * Cache key: ['v1.appointments.getAll', { status, page, limit }]
   */
  const useAppointmentsList = (filters?: {
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    page?: number;
    limit?: number;
  }) => {
    return trpc.v1.appointments.getAll.useQuery(
      {
        status: filters?.status,
        page: filters?.page || 1,
        limit: filters?.limit || 20,
      },
      {
        // Cache for 5 minutes
        staleTime: 5 * 60 * 1000,
        
        // Refetch when window regains focus
        refetchOnWindowFocus: true,
        
        // Keep previous data while fetching new data
        keepPreviousData: true,
      }
    );
  };

  /**
   * Get single appointment by ID
   * Cached independently per ID
   */
  const useAppointment = (appointmentId: string) => {
    return trpc.v1.appointments.getById.useQuery(
      { id: appointmentId },
      {
        enabled: !!appointmentId, // Only run if ID exists
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  /**
   * Check available time slots
   * Short cache time since availability changes frequently
   */
  const useAvailability = (serviceId: string, date: Date) => {
    return trpc.v1.appointments.getAvailability.useQuery(
      { serviceId, date },
      {
        enabled: !!serviceId && !!date,
        staleTime: 30 * 1000, // 30 seconds only
        refetchInterval: 60 * 1000, // Refetch every minute
      }
    );
  };

  // ============================================
  // MUTATIONS (CREATE/UPDATE/DELETE operations)
  // ============================================

  /**
   * Create new appointment
   * Invalidates list cache on success
   */
  const useCreateAppointment = () => {
    return trpc.v1.appointments.create.useMutation({
      onSuccess: (newAppointment) => {
        // ✅ Invalidate appointments list to trigger refetch
        utils.v1.appointments.getAll.invalidate();
        
        // ✅ Add new appointment to cache optimistically
        utils.v1.appointments.getById.setData(
          { id: newAppointment.id },
          newAppointment
        );
        
        toast({
          title: 'Solicitud enviada',
          description: 'Tu cita está pendiente de aprobación',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  /**
   * Cancel appointment with optimistic update
   */
  const useCancelAppointment = () => {
    return trpc.v1.appointments.cancel.useMutation({
      // Optimistic update - update UI immediately
      onMutate: async ({ appointmentId }) => {
        // Cancel outgoing refetches
        await utils.v1.appointments.getById.cancel({ id: appointmentId });
        
        // Snapshot current value
        const previousAppointment = utils.v1.appointments.getById.getData({
          id: appointmentId,
        });
        
        // Optimistically update to cancelled
        utils.v1.appointments.getById.setData(
          { id: appointmentId },
          (old) => old ? { ...old, status: 'CANCELLED' } : undefined
        );
        
        // Return snapshot for rollback
        return { previousAppointment };
      },
      
      // Rollback on error
      onError: (error, variables, context) => {
        if (context?.previousAppointment) {
          utils.v1.appointments.getById.setData(
            { id: variables.appointmentId },
            context.previousAppointment
          );
        }
        
        toast({
          title: 'Error al cancelar',
          description: error.message,
          variant: 'destructive',
        });
      },
      
      // Refetch on success to ensure consistency
      onSuccess: (data) => {
        utils.v1.appointments.getAll.invalidate();
        
        toast({
          title: 'Cita cancelada',
          description: data.refund?.refundAmount 
            ? `Reembolso: $${data.refund.refundAmount}`
            : 'Sin reembolso',
        });
      },
    });
  };

  /**
   * Reschedule appointment
   */
  const useRescheduleAppointment = () => {
    return trpc.v1.appointments.reschedule.useMutation({
      onSuccess: (updatedAppointment) => {
        // Update single appointment cache
        utils.v1.appointments.getById.setData(
          { id: updatedAppointment.id },
          updatedAppointment
        );
        
        // Invalidate list to update all views
        utils.v1.appointments.getAll.invalidate();
        
        toast({
          title: 'Cita reprogramada',
          description: 'La nueva fecha fue confirmada',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // Return all hooks
  return {
    // Queries
    useAppointmentsList,
    useAppointment,
    useAvailability,
    
    // Mutations
    useCreateAppointment,
    useCancelAppointment,
    useRescheduleAppointment,
  };
}
```

---

## 🎨 Using Hooks in Components

### Example 1: Appointments List Page

```tsx
// app/(dashboard)/panel/citas/page.tsx
'use client';

import { useState } from 'react';
import { useAppointments } from '@/hooks/use-appointments';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<'PENDING' | 'CONFIRMED' | 'CANCELLED'>('CONFIRMED');
  
  // Get appointments hook
  const { useAppointmentsList, useCancelAppointment } = useAppointments();
  
  // Query - automatically cached and refetched
  const { data, isLoading, error } = useAppointmentsList({
    status: activeTab,
  });
  
  // Mutation - for cancelling
  const cancelMutation = useCancelAppointment();

  if (isLoading) {
    return <div>Cargando citas...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Mis Citas</h1>
      
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="PENDING">Pendientes</TabsTrigger>
          <TabsTrigger value="CONFIRMED">Confirmadas</TabsTrigger>
          <TabsTrigger value="CANCELLED">Canceladas</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab}>
          <div className="grid gap-4 mt-6">
            {data?.appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={(id, reason) => {
                  cancelMutation.mutate({
                    appointmentId: id,
                    reason,
                  });
                }}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Example 2: Booking Form

```tsx
// app/(public)/directorio/[slug]/reservar/[serviceId]/page.tsx
'use client';

import { useState } from 'react';
import { useAppointments } from '@/hooks/use-appointments';
import { Calendar } from '@/components/ui/calendar';
import { TimeSlotPicker } from '@/components/booking/time-slot-picker';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useRouter } from 'next/navigation';

export default function BookingPage({
  params,
}: {
  params: { slug: string; serviceId: string };
}) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();
  const [notes, setNotes] = useState('');

  const { useAvailability, useCreateAppointment } = useAppointments();

  // Query - get available slots
  const { data: availability, isLoading: loadingSlots } = useAvailability(
    params.serviceId,
    selectedDate!
  );

  // Mutation - create appointment
  const createMutation = useCreateAppointment();

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return;

    createMutation.mutate(
      {
        serviceId: params.serviceId,
        appointmentDate: selectedDate,
        startTime: selectedTime,
        customerNotes: notes,
      },
      {
        onSuccess: (appointment) => {
          // Navigate to confirmation page
          router.push(`/panel/citas/${appointment.id}`);
        },
      }
    );
  };

  return (
    <div className="container py-8 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Reservar Cita</h1>

      {/* Step 1: Select Date */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">1. Selecciona una fecha</h2>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          disabled={(date) => date < new Date()}
          className="rounded-md border"
        />
      </div>

      {/* Step 2: Select Time */}
      {selectedDate && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">2. Selecciona un horario</h2>
          {loadingSlots ? (
            <div>Cargando horarios disponibles...</div>
          ) : (
            <TimeSlotPicker
              slots={availability?.slots || []}
              selectedSlot={selectedTime}
              onSelectSlot={setSelectedTime}
            />
          )}
        </div>
      )}

      {/* Step 3: Add Notes */}
      {selectedTime && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">3. Notas adicionales (opcional)</h2>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="¿Algo que debamos saber?"
            maxLength={500}
          />
        </div>
      )}

      {/* Submit */}
      {selectedTime && (
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isLoading}
          className="w-full"
          size="lg"
        >
          {createMutation.isLoading ? 'Enviando solicitud...' : 'Solicitar Cita'}
        </Button>
      )}
    </div>
  );
}
```

### Example 3: Business Dashboard with Approval

```tsx
// app/(dashboard)/negocio/[businessId]/citas/page.tsx
'use client';

import { useBusinessAppointments } from '@/hooks/use-business-appointments';
import { AppointmentApprovalCard } from '@/components/dashboard/appointment-approval-card';

export default function BusinessAppointmentsPage({
  params,
}: {
  params: { businessId: string };
}) {
  const {
    usePendingAppointments,
    useApproveAppointment,
    useRejectAppointment,
  } = useBusinessAppointments(params.businessId);

  // Query - pending approvals
  const { data: pendingAppointments, isLoading } = usePendingAppointments();

  // Mutations
  const approveMutation = useApproveAppointment();
  const rejectMutation = useRejectAppointment();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">
        Solicitudes Pendientes
        {pendingAppointments && ` (${pendingAppointments.length})`}
      </h1>

      <div className="grid gap-4">
        {pendingAppointments?.map((appointment) => (
          <AppointmentApprovalCard
            key={appointment.id}
            appointment={appointment}
            onApprove={(id, notes) => {
              approveMutation.mutate({
                appointmentId: id,
                notes,
              });
            }}
            onReject={(id, reason) => {
              rejectMutation.mutate({
                appointmentId: id,
                reason,
              });
            }}
            isApproving={approveMutation.isLoading}
            isRejecting={rejectMutation.isLoading}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 🔄 Advanced Cache Management Patterns

### Pattern 1: Optimistic Updates

```typescript
// hooks/use-appointments.ts

const useToggleFavorite = () => {
  const utils = trpc.useUtils();
  
  return trpc.v1.appointments.toggleFavorite.useMutation({
    // Update UI immediately (before server responds)
    onMutate: async ({ appointmentId }) => {
      // Cancel any outgoing refetches
      await utils.v1.appointments.getById.cancel({ id: appointmentId });
      
      // Snapshot the previous value
      const previous = utils.v1.appointments.getById.getData({ id: appointmentId });
      
      // Optimistically update
      utils.v1.appointments.getById.setData(
        { id: appointmentId },
        (old) => old ? { ...old, isFavorite: !old.isFavorite } : undefined
      );
      
      // Return context for rollback
      return { previous };
    },
    
    // Rollback on error
    onError: (err, variables, context) => {
      if (context?.previous) {
        utils.v1.appointments.getById.setData(
          { id: variables.appointmentId },
          context.previous
        );
      }
    },
    
    // Always refetch after error or success
    onSettled: (data, error, variables) => {
      utils.v1.appointments.getById.invalidate({ id: variables.appointmentId });
    },
  });
};
```

### Pattern 2: Prefetching

```typescript
// hooks/use-appointments.ts

const usePrefetchAppointment = () => {
  const utils = trpc.useUtils();
  
  return (appointmentId: string) => {
    // Prefetch appointment details on hover
    utils.v1.appointments.getById.prefetch({ id: appointmentId });
  };
};

// Usage in component
const prefetch = usePrefetchAppointment();

<div
  onMouseEnter={() => prefetch(appointment.id)}
  onClick={() => router.push(`/citas/${appointment.id}`)}
>
  {appointment.title}
</div>
```

### Pattern 3: Infinite Scroll

```typescript
// hooks/use-appointments.ts

const useInfiniteAppointments = (filters?: AppointmentFilters) => {
  return trpc.v1.appointments.getAll.useInfiniteQuery(
    { ...filters, limit: 20 },
    {
      getNextPageParam: (lastPage) => {
        if (lastPage.pagination.page < lastPage.pagination.totalPages) {
          return lastPage.pagination.page + 1;
        }
        return undefined;
      },
    }
  );
};

// Usage in component
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
} = useInfiniteAppointments({ status: 'CONFIRMED' });

// Render all pages
data?.pages.map((page) =>
  page.appointments.map((appointment) => (
    <AppointmentCard key={appointment.id} appointment={appointment} />
  ))
);

// Load more button
{hasNextPage && (
  <Button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
    {isFetchingNextPage ? 'Cargando...' : 'Ver más'}
  </Button>
)}
```

### Pattern 4: Dependent Queries

```typescript
// First, get service
const { data: service } = trpc.v1.services.getById.useQuery({ 
  id: serviceId 
});

// Then, get availability (only runs if service exists)
const { data: availability } = trpc.v1.appointments.getAvailability.useQuery(
  {
    serviceId: serviceId,
    date: selectedDate,
  },
  {
    enabled: !!service, // Only run if service loaded
  }
);
```

### Pattern 5: Parallel Queries

```typescript
// Load multiple data sources in parallel
const appointments = trpc.v1.appointments.getAll.useQuery();
const businesses = trpc.v1.businesses.getAll.useQuery();
const reviews = trpc.v1.reviews.getRecent.useQuery();

// All queries run in parallel!
// Data available when each finishes
```

---

## 📊 Complete Hook Structure

```typescript
// hooks/use-appointments.ts - Complete example

import { trpc } from '@/lib/trpc/client';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export function useAppointments() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  const router = useRouter();

  // ============================================
  // QUERIES
  // ============================================

  const useAppointmentsList = (filters?: {
    status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
    page?: number;
    limit?: number;
  }) => {
    return trpc.v1.appointments.getAll.useQuery(filters || {}, {
      staleTime: 5 * 60 * 1000,
      keepPreviousData: true,
    });
  };

  const useAppointment = (id: string) => {
    return trpc.v1.appointments.getById.useQuery(
      { id },
      { enabled: !!id }
    );
  };

  const useAvailability = (serviceId: string, date: Date) => {
    return trpc.v1.appointments.getAvailability.useQuery(
      { serviceId, date },
      {
        enabled: !!serviceId && !!date,
        staleTime: 30 * 1000,
      }
    );
  };

  const usePrefetchAppointment = () => {
    return (id: string) => {
      utils.v1.appointments.getById.prefetch({ id });
    };
  };

  // ============================================
  // MUTATIONS
  // ============================================

  const useCreateAppointment = () => {
    return trpc.v1.appointments.create.useMutation({
      onSuccess: (data) => {
        utils.v1.appointments.getAll.invalidate();
        utils.v1.appointments.getById.setData({ id: data.id }, data);
        
        toast({
          title: 'Solicitud enviada',
          description: 'Esperando aprobación del negocio',
        });
        
        router.push(`/panel/citas/${data.id}`);
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  const useCancelAppointment = () => {
    return trpc.v1.appointments.cancel.useMutation({
      onMutate: async ({ appointmentId }) => {
        await utils.v1.appointments.getById.cancel({ id: appointmentId });
        
        const previous = utils.v1.appointments.getById.getData({ id: appointmentId });
        
        utils.v1.appointments.getById.setData(
          { id: appointmentId },
          (old) => old ? { ...old, status: 'CANCELLED' } : undefined
        );
        
        return { previous };
      },
      onError: (err, variables, context) => {
        if (context?.previous) {
          utils.v1.appointments.getById.setData(
            { id: variables.appointmentId },
            context.previous
          );
        }
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive',
        });
      },
      onSuccess: (data) => {
        utils.v1.appointments.getAll.invalidate();
        
        toast({
          title: 'Cita cancelada',
          description: data.refund?.refundAmount 
            ? `Reembolso: $${data.refund.refundAmount}`
            : 'Sin reembolso según la política',
        });
      },
    });
  };

  const useRescheduleAppointment = () => {
    return trpc.v1.appointments.reschedule.useMutation({
      onSuccess: (data) => {
        utils.v1.appointments.getById.setData({ id: data.id }, data);
        utils.v1.appointments.getAll.invalidate();
        
        toast({
          title: 'Cita reprogramada',
          description: 'Nueva fecha confirmada',
        });
      },
      onError: (error) => {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      },
    });
  };

  // ============================================
  // RETURN ALL HOOKS
  // ============================================

  return {
    // Queries
    useAppointmentsList,
    useAppointment,
    useAvailability,
    usePrefetchAppointment,
    
    // Mutations
    useCreateAppointment,
    useCancelAppointment,
    useRescheduleAppointment,
  };
}
```

---

## 🗂️ Folder Structure

```
src/
├── server/
│   └── api/
│       └── routers/
│           └── v1/
│               ├── appointments.ts      # Query & Mutation procedures
│               ├── businesses.ts
│               ├── services.ts
│               └── ...
│
├── hooks/
│   ├── use-appointments.ts             # Appointment hooks
│   ├── use-businesses.ts               # Business hooks
│   ├── use-services.ts                 # Service hooks
│   ├── use-business-appointments.ts    # Business owner hooks
│   └── ...
│
├── components/
│   ├── appointments/
│   │   ├── appointment-card.tsx        # Uses hooks
│   │   ├── appointment-form.tsx        # Uses mutations
│   │   └── ...
│   │
│   └── booking/
│       ├── booking-calendar.tsx        # Uses availability query
│       ├── time-slot-picker.tsx
│       └── ...
│
└── app/
    ├── (dashboard)/
    │   └── panel/
    │       └── citas/
    │           └── page.tsx            # Uses hooks
    │
    └── (public)/
        └── directorio/
            └── [slug]/
                └── reservar/
                    └── [serviceId]/
                        └── page.tsx    # Uses hooks
```

---

## ✅ Best Practices Summary

### Backend (tRPC Procedures)
✅ Use `.query()` for READ operations (GET)
✅ Use `.mutation()` for WRITE operations (CREATE/UPDATE/DELETE)
✅ Keep procedures focused and single-purpose
✅ Add proper input validation with Zod
✅ Include proper error handling

### Frontend (Hooks)
✅ Create one custom hook per domain (e.g., `use-appointments`)
✅ Wrap tRPC calls in custom hooks for better organization
✅ Use `useQuery` for data fetching
✅ Use `useMutation` for data changes
✅ Implement proper cache invalidation
✅ Use optimistic updates for better UX

### Cache Management
✅ Set appropriate `staleTime` per query
✅ Invalidate related caches on mutations
✅ Use optimistic updates for instant feedback
✅ Prefetch data on hover for better UX
✅ Use `keepPreviousData` for pagination

---

## 🎯 Summary

| Backend | Frontend | TanStack Query |
|---------|----------|----------------|
| `.query()` → Read | `useQuery()` → Fetch | Auto-cache, refetch |
| `.mutation()` → Write | `useMutation()` → Change | Invalidate, update |

**This pattern gives you:**
- ✅ Type safety end-to-end
- ✅ Automatic caching
- ✅ Optimistic updates
- ✅ Perfect mobile support
- ✅ Clean code organization

Ready to build! 🚀