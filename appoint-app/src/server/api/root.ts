/**
 * Root tRPC Router
 * This is the main router that combines all API routers with versioning
 */

import { createTRPCRouter } from './trpc';
import { businessesRouter } from './routers/v1/businesses';
import { locationsRouter } from './routers/v1/locations';
import { servicesRouter } from './routers/v1/services';
import { appointmentsRouter } from './routers/v1/appointments';
import { availabilityRouter } from './routers/v1/availability';
import { paymentsRouter } from './routers/v1/payments';
import { reviewsRouter } from './routers/v1/reviews';
import { usersRouter } from './routers/v1/users';
import { categoriesRouter } from './routers/v1/categories';

/**
 * This is the primary router for your server.
 * All routers added in /api/routers should be manually added here.
 *
 * API Versioning:
 * - v1: Current stable API
 * - v2: Future breaking changes (when needed)
 */
export const appRouter = createTRPCRouter({
  // Version 1 API
  v1: createTRPCRouter({
    businesses: businessesRouter,
    locations: locationsRouter,
    services: servicesRouter,
    appointments: appointmentsRouter,
    availability: availabilityRouter,
    payments: paymentsRouter,
    reviews: reviewsRouter,
    users: usersRouter,
    categories: categoriesRouter,
  }),

  // Version 2 API (future)
  // v2: createTRPCRouter({
  //   // Breaking changes go here
  // }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;
