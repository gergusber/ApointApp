import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for location-related operations
 */
export function useLocations() {
  const utils = trpc.useUtils();
  const router = useRouter();

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get all locations for a business
   */
  const useLocationsByBusiness = (businessId: string) => {
    return trpc.v1.locations.getByBusiness.useQuery(
      { businessId },
      {
        enabled: !!businessId,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  /**
   * Get single location by ID
   */
  const useLocation = (locationId: string) => {
    return trpc.v1.locations.getById.useQuery(
      { id: locationId },
      {
        enabled: !!locationId,
        staleTime: 2 * 60 * 1000,
      }
    );
  };

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Create new location
   */
  const useCreateLocation = () => {
    return trpc.v1.locations.create.useMutation({
      onSuccess: (location) => {
        utils.v1.locations.getByBusiness.invalidate({
          businessId: location.businessId,
        });
        toast.success('Ubicación creada exitosamente');
      },
      onError: (error) => {
        toast.error('Error al crear la ubicación', {
          description: error.message,
        });
      },
    });
  };

  /**
   * Update location
   */
  const useUpdateLocation = () => {
    return trpc.v1.locations.update.useMutation({
      onSuccess: (location) => {
        utils.v1.locations.getByBusiness.invalidate({
          businessId: location.businessId,
        });
        utils.v1.locations.getById.invalidate({ id: location.id });
        toast.success('Ubicación actualizada exitosamente');
      },
      onError: (error) => {
        toast.error('Error al actualizar la ubicación', {
          description: error.message,
        });
      },
    });
  };

  /**
   * Delete location
   */
  const useDeleteLocation = () => {
    return trpc.v1.locations.delete.useMutation({
      onSuccess: (_, variables) => {
        // We need to invalidate by businessId, but we don't have it here
        // So we invalidate all location queries
        utils.v1.locations.getByBusiness.invalidate();
        toast.success('Ubicación eliminada exitosamente');
      },
      onError: (error) => {
        toast.error('Error al eliminar la ubicación', {
          description: error.message,
        });
      },
    });
  };

  return {
    // Queries
    useLocationsByBusiness,
    useLocation,
    // Mutations
    useCreateLocation,
    useUpdateLocation,
    useDeleteLocation,
  };
}

