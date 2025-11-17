/**
 * Categories Router (v1)
 * Handles category-related operations
 */

import { createTRPCRouter, publicProcedure } from "../../trpc";

export const categoriesRouter = createTRPCRouter({
  /**
   * Get all categories (public)
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return categories;
  }),
});

