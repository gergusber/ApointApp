import { trpc } from '@/lib/trpc/client';

/**
 * Custom hook for category-related operations
 * Encapsulates all category logic and cache management
 */
export function useCategories() {
  const utils = trpc.useUtils();

  // ============================================
  // QUERIES (GET operations)
  // ============================================

  /**
   * Get all categories (public)
   * Auto-cached by TanStack Query
   * Returns plain JSON array directly
   */
  const useCategoriesList = () => {
    return trpc.v1.categories.getAll.useQuery(undefined, {
      staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    });
  };

  return {
    // Queries
    useCategoriesList,
  };
}

