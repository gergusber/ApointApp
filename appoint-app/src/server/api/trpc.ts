/**
 * tRPC Configuration
 * This file sets up the tRPC context, middleware, and procedures
 */

import { initTRPC, TRPCError } from '@trpc/server';
import { type CreateNextContextOptions } from '@trpc/server/adapters/next';
import { ZodError } from 'zod';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { getOrCreateUser } from '@/server/services/user-sync';

/**
 * 1. CONTEXT
 * This section defines the "context" that is available in the backend API.
 * The context is created for each request and contains:
 * - Prisma client instance
 * - User session from Clerk
 * - Request and response objects
 */
export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts;

  console.log('[tRPC Context] Creating context...');

  // Get auth session from Clerk (works for both web cookies and mobile JWT)
  const session = await auth();
  const userId = session?.userId ?? null;

  console.log('[tRPC Context] Session:', { userId, hasSession: !!session });

  // Ensure user exists in our database (sync from Clerk if needed)
  let dbUser = null;
  if (userId) {
    console.log('[tRPC Context] User is authenticated, syncing to DB...');
    try {
      dbUser = await getOrCreateUser(userId);
      console.log('[tRPC Context] User synced:', { id: dbUser.id, email: dbUser.email });
    } catch (error: any) {
      console.error('[tRPC Context] Error syncing user:', error);
      console.error('[tRPC Context] Error details:', {
        message: error.message,
        stack: error.stack,
        userId,
      });
      // Continue without user if sync fails (shouldn't happen, but graceful degradation)
      // The client-side sync hook will retry
    }
  } else {
    console.log('[tRPC Context] No authenticated user (public request)');
  }

  return {
    prisma,
    session,
    userId,
    dbUser, // Our database user record
    req,
    res,
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
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

/**
 * Create a new tRPC router
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for logging requests
 */
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);
  }

  return result;
});

/**
 * Public (unauthenticated) procedure
 * Anyone can call these procedures
 */
export const publicProcedure = t.procedure.use(loggerMiddleware);

/**
 * Protected (authenticated) procedure
 * Only logged-in users can access
 */
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.userId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'Debes iniciar sesión para acceder a este recurso'
      });
    }

    return next({
      ctx: {
        ...ctx,
        userId: ctx.userId, // Type is now non-nullable
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
      where: { clerkId: ctx.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado'
      });
    }

    if (user.role !== 'BUSINESS' && user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Solo los propietarios de negocios pueden acceder a este recurso'
      });
    }

    return next({
      ctx: {
        ...ctx,
        user,
      }
    });
  }
);

/**
 * Admin procedure
 * Only platform admins can access
 */
export const adminProcedure = protectedProcedure.use(
  async ({ ctx, next }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { clerkId: ctx.userId },
      select: { id: true, role: true },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Usuario no encontrado'
      });
    }

    if (user.role !== 'ADMIN') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Solo los administradores pueden acceder a este recurso'
      });
    }

    return next({
      ctx: {
        ...ctx,
        user,
      }
    });
  }
);
