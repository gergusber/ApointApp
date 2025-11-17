import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

/**
 * Custom hook for business owner appointment operations
 */
export function useBusinessAppointments(businessId: string) {
  const utils = trpc.useUtils();

  // ============================================
  // QUERIES
  // ============================================

  /**
   * Get appointments for business
   */
  const useBusinessAppointments = (filters?: {
    status?:
      | 'PENDING'
      | 'PAYMENT_PENDING'
      | 'CONFIRMED'
      | 'CANCELLED'
      | 'REJECTED'
      | 'EXPIRED'
      | 'COMPLETED'
      | 'NO_SHOW';
    startDate?: Date;
    endDate?: Date;
  }) => {
    return trpc.v1.appointments.getBusinessAppointments.useQuery(
      {
        businessId,
        status: filters?.status,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      },
      {
        enabled: !!businessId,
        staleTime: 2 * 60 * 1000, // 2 minutes
      }
    );
  };

  /**
   * Get pending approvals
   */
  const usePendingAppointments = () => {
    return useBusinessAppointments({ status: 'PENDING' });
  };

  // ============================================
  // MUTATIONS
  // ============================================

  /**
   * Approve appointment
   */
  const useApproveAppointment = () => {
    return trpc.v1.appointments.approve.useMutation({
      onSuccess: (data) => {
        utils.v1.appointments.getBusinessAppointments.invalidate({
          businessId,
        });
        utils.v1.appointments.getById.invalidate({ id: data.appointment.id });

        toast.success('Cita aprobada', {
          description: 'Se enviará el link de pago al cliente',
        });
      },
      onError: (error) => {
        toast.error('Error al aprobar la cita', {
          description: error.message,
        });
      },
    });
  };

  /**
   * Reject appointment
   */
  const useRejectAppointment = () => {
    return trpc.v1.appointments.reject.useMutation({
      onSuccess: () => {
        utils.v1.appointments.getBusinessAppointments.invalidate({
          businessId,
        });

        toast.success('Cita rechazada', {
          description: 'El cliente ha sido notificado',
        });
      },
      onError: (error) => {
        toast.error('Error al rechazar la cita', {
          description: error.message,
        });
      },
    });
  };

  return {
    // Queries
    useBusinessAppointments,
    usePendingAppointments,
    // Mutations
    useApproveAppointment,
    useRejectAppointment,
  };
}

