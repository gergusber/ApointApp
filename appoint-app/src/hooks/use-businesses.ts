import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for business-related operations
 * Encapsulates all business logic and cache management
 */
export function useBusinesses() {
  const utils = trpc.useUtils();
  const router = useRouter();

  // ============================================
  // QUERIES (GET operations)
  // ============================================

  /**
   * Get all businesses (public directory)
   * Auto-cached by TanStack Query
   */
  const useBusinessesList = (filters?: {
    page?: number;
    limit?: number;
    categoryId?: string;
    province?: string;
    search?: string;
  }) => {
    return trpc.v1.businesses.getAll.useQuery(
      {
        page: filters?.page || 1,
        limit: filters?.limit || 20,
        categoryId: filters?.categoryId,
        province: filters?.province,
        search: filters?.search,
      },
      {
        staleTime: 5 * 60 * 1000, // Cache 5 minutes
        keepPreviousData: true,
      }
    );
  };

  /**
   * Get single business by slug (public)
   */
  const useBusinessBySlug = (slug: string) => {
    return trpc.v1.businesses.getBySlug.useQuery(
      { slug },
      {
        enabled: !!slug,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  /**
   * Get businesses owned by current user
   */
  const useMyBusinesses = () => {
    return trpc.v1.businesses.getMyBusinesses.useQuery(undefined, {
      staleTime: 2 * 60 * 1000,
    });
  };

  // ============================================
  // MUTATIONS (CREATE/UPDATE/DELETE operations)
  // ============================================

  /**
   * Create new business
   */
  const useCreateBusiness = () => {
    return trpc.v1.businesses.create.useMutation({
      onSuccess: (business) => {
        // Invalidate businesses list
        utils.v1.businesses.getAll.invalidate();
        utils.v1.businesses.getMyBusinesses.invalidate();

        toast.success('Negocio creado exitosamente');
        router.push(`/negocio/${business.id}`);
      },
      onError: (error) => {
        toast.error('Error al crear el negocio', {
          description: error.message,
        });
      },
    });
  };

  return {
    // Queries
    useBusinessesList,
    useBusinessBySlug,
    useMyBusinesses,
    // Mutations
    useCreateBusiness,
  };
}

