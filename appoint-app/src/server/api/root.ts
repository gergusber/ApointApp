/**
 * Root tRPC Router
 * This is the main router that combines all API routers with versioning
 */

import { createTRPCRouter } from './trpc';
import { businessesRouter } from './routers/v1/businesses';

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
    // Add more routers here:
    // appointments: appointmentsRouter,
    // services: servicesRouter,
    // etc.
  }),

  // Version 2 API (future)
  // v2: createTRPCRouter({
  //   // Breaking changes go here
  // }),
});

// Export type definition of API
export type AppRouter = typeof appRouter;
