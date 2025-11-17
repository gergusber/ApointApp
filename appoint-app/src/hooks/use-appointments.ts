import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

/**
 * Custom hook for appointment-related operations
 * Encapsulates all appointment logic and cache management
 */
export function useAppointments() {
  const utils = trpc.useUtils();
  const router = useRouter();

  // ============================================
  // QUERIES (GET operations)
  // ============================================

  /**
   * Get all appointments for current user
   */
  const useAppointmentsList = (filters?: {
    status?:
      | 'PENDING'
      | 'PAYMENT_PENDING'
      | 'CONFIRMED'
      | 'CANCELLED'
      | 'REJECTED'
      | 'EXPIRED'
      | 'COMPLETED'
      | 'NO_SHOW';
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
        staleTime: 5 * 60 * 1000, // 5 minutes
        keepPreviousData: true,
      }
    );
  };

  /**
   * Get single appointment by ID
   */
  const useAppointment = (appointmentId: string) => {
    return trpc.v1.appointments.getById.useQuery(
      { id: appointmentId },
      {
        enabled: !!appointmentId,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  /**
   * Check available time slots
   */
  const useAvailability = (serviceId: string, date: Date) => {
    return trpc.v1.appointments.getAvailability.useQuery(
      { serviceId, date },
      {
        enabled: !!serviceId && !!date,
        staleTime: 30 * 1000, // 30 seconds only
      }
    );
  };

  // ============================================
  // MUTATIONS (CREATE/UPDATE/DELETE operations)
  // ============================================

  /**
   * Create new appointment
   */
  const useCreateAppointment = () => {
    return trpc.v1.appointments.create.useMutation({
      onSuccess: (newAppointment) => {
        // Invalidate appointments list to trigger refetch
        utils.v1.appointments.getAll.invalidate();

        // Add new appointment to cache
        utils.v1.appointments.getById.setData(
          { id: newAppointment.id },
          newAppointment
        );

        toast.success('Solicitud de cita enviada', {
          description: 'Esperando aprobación del negocio',
        });

        router.push(`/panel/citas/${newAppointment.id}`);
      },
      onError: (error) => {
        toast.error('Error al crear la cita', {
          description: error.message,
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
          (old) =>
            old
              ? {
                  ...old,
                  status: 'CANCELLED' as const,
                  cancelledAt: new Date(),
                }
              : undefined
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

        toast.error('Error al cancelar la cita', {
          description: error.message,
        });
      },

      // Refetch on success to ensure consistency
      onSuccess: (data) => {
        utils.v1.appointments.getAll.invalidate();

        toast.success('Cita cancelada', {
          description:
            data.refund.refundAmount > 0
              ? `Reembolso: $${data.refund.refundAmount.toLocaleString('es-AR')} ARS`
              : 'Sin reembolso según la política',
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

        toast.success('Cita reprogramada', {
          description: 'La nueva fecha fue confirmada',
        });
      },
      onError: (error) => {
        toast.error('Error al reprogramar la cita', {
          description: error.message,
        });
      },
    });
  };

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

