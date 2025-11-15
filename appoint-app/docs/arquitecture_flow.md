# Complete Architecture Flow - Frontend to Backend

## 📊 Visual Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                            │
│                     (React Components)                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Uses custom hooks
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      CUSTOM HOOKS LAYER                          │
│                   (hooks/use-*.ts)                               │
│                                                                  │
│  useAppointments() {                                             │
│    // Queries (GET)                                              │
│    useAppointmentsList() → useQuery                              │
│    useAppointment(id)    → useQuery                              │
│    useAvailability()     → useQuery                              │
│                                                                  │
│    // Mutations (CREATE/UPDATE/DELETE)                           │
│    useCreateAppointment()     → useMutation                      │
│    useCancelAppointment()     → useMutation + optimistic        │
│    useRescheduleAppointment() → useMutation                      │
│  }                                                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Calls tRPC client
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      tRPC CLIENT                                 │
│                  (@trpc/react-query)                             │
│                                                                  │
│  - Handles type inference                                        │
│  - Manages request/response                                      │
│  - Works with TanStack Query                                     │
│  - Serializes with SuperJSON                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTP Request
                         │ POST /api/trpc/v1.appointments.getAll
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      NEXT.JS API ROUTE                           │
│                  app/api/trpc/[trpc]/route.ts                    │
│                                                                  │
│  - Receives HTTP request                                         │
│  - Creates tRPC context (auth, prisma)                           │
│  - Routes to correct procedure                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Delegates to router
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      tRPC ROUTER                                 │
│              server/api/routers/v1/appointments.ts               │
│                                                                  │
│  Query Procedures:                                               │
│    getAll: protectedProcedure                                    │
│      .input(schema)                                              │
│      .query(async ({ ctx, input }) => {                          │
│        return await ctx.prisma.appointment.findMany(...)         │
│      })                                                          │
│                                                                  │
│  Mutation Procedures:                                            │
│    create: protectedProcedure                                    │
│      .input(createSchema)                                        │
│      .mutation(async ({ ctx, input }) => {                       │
│        const appointment = await ctx.prisma.appointment.create() │
│        await sendNotification()                                  │
│        return appointment                                        │
│      })                                                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ Accesses database
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      PRISMA CLIENT                               │
│                    (Database ORM)                                │
│                                                                  │
│  - Generates type-safe queries                                   │
│  - Handles migrations                                            │
│  - Connection pooling                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ SQL Queries
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      PostgreSQL                                  │
│                    (Database)                                    │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Complete Request Flow Example

### Scenario: User Books an Appointment

```
1. USER CLICKS "RESERVAR"
   │
   ├─→ Component calls hook
   │   const { useCreateAppointment } = useAppointments();
   │   const createMutation = useCreateAppointment();
   │
   ├─→ User fills form and clicks submit
   │   createMutation.mutate({
   │     serviceId: "abc",
   │     appointmentDate: new Date(),
   │     startTime: "10:00",
   │   });
   │
   ▼

2. CUSTOM HOOK (Frontend)
   │
   ├─→ useMutation hook executes
   │   - Shows loading state
   │   - Calls tRPC client
   │
   ▼

3. tRPC CLIENT
   │
   ├─→ Serializes data with SuperJSON
   ├─→ Adds authentication (Clerk)
   ├─→ Sends HTTP POST to /api/trpc/v1.appointments.create
   │
   ▼

4. NEXT.JS API ROUTE
   │
   ├─→ Receives request
   ├─→ Creates context { userId, prisma }
   ├─→ Routes to appointments.create procedure
   │
   ▼

5. tRPC PROCEDURE (Backend)
   │
   ├─→ Validates input with Zod schema
   ├─→ Checks authentication (protectedProcedure)
   ├─→ Business logic:
   │   - Calculate pricing
   │   - Check conflicts
   │   - Create appointment
   │   - Send notification
   │
   ▼

6. PRISMA
   │
   ├─→ Executes SQL INSERT
   ├─→ Returns created appointment
   │
   ▼

7. RESPONSE FLOWS BACK
   │
   ├─→ Procedure returns appointment
   ├─→ API route serializes response
   ├─→ tRPC client deserializes
   ├─→ TanStack Query updates cache
   ├─→ onSuccess callback runs:
   │   - Invalidates appointment list cache
   │   - Adds new appointment to cache
   │   - Shows success toast
   │   - Navigates to appointment page
   │
   ▼

8. UI UPDATES
   │
   └─→ Component re-renders with new data
       Loading state → Success state
       Shows appointment details
```

---

## 📁 File Organization

```
your-project/
│
├── src/
│   │
│   ├── app/                                    # NEXT.JS PAGES
│   │   ├── (public)/
│   │   │   └── directorio/[slug]/
│   │   │       └── reservar/[serviceId]/
│   │   │           └── page.tsx               ← Uses useAppointments()
│   │   │
│   │   ├── (dashboard)/
│   │   │   └── panel/citas/
│   │   │       └── page.tsx                   ← Uses useAppointments()
│   │   │
│   │   └── api/
│   │       └── trpc/[trpc]/
│   │           └── route.ts                   ← tRPC endpoint
│   │
│   ├── hooks/                                  # CUSTOM HOOKS
│   │   ├── use-appointments.ts                ← Wraps tRPC calls
│   │   ├── use-businesses.ts
│   │   └── use-services.ts
│   │
│   ├── server/                                 # BACKEND
│   │   └── api/
│   │       ├── trpc.ts                        ← tRPC config
│   │       ├── root.ts                        ← Root router
│   │       │
│   │       └── routers/
│   │           └── v1/                        ← Version 1 API
│   │               ├── appointments.ts        ← Procedures
│   │               ├── businesses.ts
│   │               └── services.ts
│   │
│   ├── lib/
│   │   ├── trpc/
│   │   │   └── client.ts                      ← tRPC client setup
│   │   │
│   │   └── validations/                       # ZOD SCHEMAS
│   │       ├── appointment.ts                 ← Shared validation
│   │       └── business.ts
│   │
│   └── components/                             # UI COMPONENTS
│       └── appointments/
│           └── appointment-card.tsx           ← Uses hooks
│
└── prisma/
    └── schema.prisma                           # DATABASE SCHEMA
```

---

## 🎯 Code Flow by Feature

### Feature: List User's Appointments

```typescript
// 1. BACKEND - Define query procedure
// server/api/routers/v1/appointments.ts
export const appointmentsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .input(z.object({
      status: z.enum(['PENDING', 'CONFIRMED']).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.prisma.appointment.findMany({
        where: {
          userId: ctx.userId,
          ...(input.status && { status: input.status }),
        },
      });
    }),
});

// 2. FRONTEND - Create custom hook
// hooks/use-appointments.ts
export function useAppointments() {
  const useAppointmentsList = (status?: 'PENDING' | 'CONFIRMED') => {
    return trpc.v1.appointments.getAll.useQuery(
      { status },
      {
        staleTime: 5 * 60 * 1000, // Cache 5 minutes
      }
    );
  };
  
  return { useAppointmentsList };
}

// 3. COMPONENT - Use the hook
// app/(dashboard)/panel/citas/page.tsx
export default function AppointmentsPage() {
  const { useAppointmentsList } = useAppointments();
  const { data, isLoading } = useAppointmentsList('CONFIRMED');
  
  if (isLoading) return <div>Loading...</div>;
  
  return (
    <div>
      {data?.map(apt => (
        <AppointmentCard key={apt.id} appointment={apt} />
      ))}
    </div>
  );
}
```

### Feature: Create Appointment

```typescript
// 1. BACKEND - Define mutation procedure
// server/api/routers/v1/appointments.ts
export const appointmentsRouter = createTRPCRouter({
  create: protectedProcedure
    .input(z.object({
      serviceId: z.string(),
      appointmentDate: z.date(),
      startTime: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const appointment = await ctx.prisma.appointment.create({
        data: {
          ...input,
          userId: ctx.userId,
          status: 'PENDING',
        },
      });
      
      await sendNotification(appointment);
      
      return appointment;
    }),
});

// 2. FRONTEND - Create custom hook
// hooks/use-appointments.ts
export function useAppointments() {
  const utils = trpc.useUtils();
  const { toast } = useToast();
  
  const useCreateAppointment = () => {
    return trpc.v1.appointments.create.useMutation({
      onSuccess: (newAppointment) => {
        // Invalidate cache to refetch list
        utils.v1.appointments.getAll.invalidate();
        
        // Add to cache
        utils.v1.appointments.getById.setData(
          { id: newAppointment.id },
          newAppointment
        );
        
        toast({ title: 'Cita solicitada!' });
      },
    });
  };
  
  return { useCreateAppointment };
}

// 3. COMPONENT - Use the hook
// app/(public)/directorio/[slug]/reservar/page.tsx
export default function BookingPage() {
  const { useCreateAppointment } = useAppointments();
  const createMutation = useCreateAppointment();
  
  const handleSubmit = (data: FormData) => {
    createMutation.mutate({
      serviceId: data.serviceId,
      appointmentDate: data.date,
      startTime: data.time,
    });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      <Button disabled={createMutation.isLoading}>
        {createMutation.isLoading ? 'Enviando...' : 'Reservar'}
      </Button>
    </form>
  );
}
```

---

## 🔄 Cache Invalidation Strategies

### Strategy 1: Invalidate All
```typescript
// Refetch all appointments after creating one
utils.v1.appointments.getAll.invalidate();
```

### Strategy 2: Invalidate Specific
```typescript
// Only refetch specific appointment
utils.v1.appointments.getById.invalidate({ id: appointmentId });
```

### Strategy 3: Set Data Directly
```typescript
// Update cache without refetching
utils.v1.appointments.getById.setData(
  { id: appointmentId },
  updatedAppointment
);
```

### Strategy 4: Optimistic Update
```typescript
// Update UI before server responds
onMutate: async (variables) => {
  // Cancel outgoing refetches
  await utils.v1.appointments.getById.cancel({ id: variables.id });
  
  // Snapshot current value
  const previous = utils.v1.appointments.getById.getData({ id: variables.id });
  
  // Update immediately
  utils.v1.appointments.getById.setData(
    { id: variables.id },
    { ...previous, status: 'CANCELLED' }
  );
  
  return { previous }; // For rollback
},

onError: (error, variables, context) => {
  // Rollback on error
  utils.v1.appointments.getById.setData(
    { id: variables.id },
    context.previous
  );
},
```

---

## ✅ Type Safety Flow

```typescript
// 1. Define Zod schema (BACKEND)
const createAppointmentSchema = z.object({
  serviceId: z.string().cuid(),
  appointmentDate: z.date(),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
});

// 2. Use in procedure (BACKEND)
create: protectedProcedure
  .input(createAppointmentSchema)
  .mutation(async ({ ctx, input }) => {
    // input is typed as:
    // {
    //   serviceId: string,
    //   appointmentDate: Date,
    //   startTime: string
    // }
  })

// 3. Frontend automatically typed (FRONTEND)
const createMutation = trpc.v1.appointments.create.useMutation();

createMutation.mutate({
  serviceId: 'abc',        // ✅ Type-safe
  appointmentDate: new Date(), // ✅ Type-safe
  startTime: '10:00',      // ✅ Type-safe
  
  // randomField: 'test'   // ❌ TypeScript error!
});

// 4. Response is also typed
createMutation.mutate(data, {
  onSuccess: (appointment) => {
    // appointment is fully typed!
    console.log(appointment.id);          // ✅
    console.log(appointment.status);      // ✅
    console.log(appointment.serviceId);   // ✅
  }
});
```

---

## 🎯 Summary

### This Architecture Gives You:

✅ **Type Safety**: End-to-end TypeScript from DB to UI
✅ **Caching**: Automatic with TanStack Query
✅ **Optimistic Updates**: Instant UI feedback
✅ **Code Reuse**: Same hooks work on web and mobile
✅ **Clean Organization**: Clear separation of concerns
✅ **Developer Experience**: Auto-complete everywhere

### The Flow:

```
Component → Custom Hook → tRPC Client → API Route → 
Procedure → Prisma → Database → 
Response → Cache → UI Update
```

### Key Files:

1. **Backend**: `server/api/routers/v1/*.ts` - Procedures
2. **Frontend**: `hooks/use-*.ts` - Custom hooks
3. **Components**: `app/**/*.tsx` - Use hooks
4. **Validation**: `lib/validations/*.ts` - Zod schemas

---

**Ready to build!** 🚀

Every feature follows this same pattern:
1. Create backend procedure (query or mutation)
2. Create frontend hook (wraps tRPC call)
3. Use hook in component
4. Handle cache invalidation
5. Done!