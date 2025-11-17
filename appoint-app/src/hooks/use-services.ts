import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

/**
 * Custom hook for service-related operations
 */
export function useServices() {
  const utils = trpc.useUtils();

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get all services for a location
   */
  const useServicesByLocation = (locationId: string) => {
    return trpc.v1.services.getByLocation.useQuery(
      { locationId },
      {
        enabled: !!locationId,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  /**
   * Get single service by ID
   */
  const useService = (serviceId: string) => {
    return trpc.v1.services.getById.useQuery(
      { id: serviceId },
      {
        enabled: !!serviceId,
        staleTime: 2 * 60 * 1000,
      }
    );
  };

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Create new service
   */
  const useCreateService = () => {
    return trpc.v1.services.create.useMutation({
      onSuccess: (service) => {
        utils.v1.services.getByLocation.invalidate({
          locationId: service.locationId,
        });
        toast.success('Servicio creado exitosamente');
      },
      onError: (error) => {
        toast.error('Error al crear el servicio', {
          description: error.message,
        });
      },
    });
  };

  /**
   * Update service
   */
  const useUpdateService = () => {
    return trpc.v1.services.update.useMutation({
      onSuccess: (service) => {
        utils.v1.services.getByLocation.invalidate({
          locationId: service.locationId,
        });
        utils.v1.services.getById.invalidate({ id: service.id });
        toast.success('Servicio actualizado exitosamente');
      },
      onError: (error) => {
        toast.error('Error al actualizar el servicio', {
          description: error.message,
        });
      },
    });
  };

  /**
   * Delete service
   */
  const useDeleteService = () => {
    return trpc.v1.services.delete.useMutation({
      onSuccess: () => {
        utils.v1.services.getByLocation.invalidate();
        toast.success('Servicio eliminado exitosamente');
      },
      onError: (error) => {
        toast.error('Error al eliminar el servicio', {
          description: error.message,
        });
      },
    });
  };

  return {
    // Queries
    useServicesByLocation,
    useService,
    // Mutations
    useCreateService,
    useUpdateService,
    useDeleteService,
  };
}

