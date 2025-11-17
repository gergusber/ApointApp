'use client';

import { useState } from 'react';
import { useAppointments } from '@/hooks/use-appointments';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { AppointmentFilters } from '@/components/appointments/appointment-filters';
import { Button } from '@/components/ui/button';

export default function AppointmentsPage() {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [page, setPage] = useState(1);
  const { useAppointmentsList, useCancelAppointment } = useAppointments();

  const status =
    activeTab === 'all'
      ? undefined
      : (activeTab as
          | 'PENDING'
          | 'PAYMENT_PENDING'
          | 'CONFIRMED'
          | 'CANCELLED'
          | 'REJECTED'
          | 'EXPIRED'
          | 'COMPLETED'
          | 'NO_SHOW');

  const { data, isLoading, error } = useAppointmentsList({
    status,
    page,
    limit: 20,
  });

  const cancelMutation = useCancelAppointment();

  const handleCancel = (appointmentId: string) => {
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      cancelMutation.mutate({
        appointmentId,
        reason: 'Cancelado por el usuario',
      });
    }
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mis Citas</h1>
        <p className="text-muted-foreground">
          Gestiona todas tus citas y reservas
        </p>
      </div>

      <div className="mb-6">
        <AppointmentFilters activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando citas...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar las citas</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      )}

      {data && (
        <>
          {data.appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron citas</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {data.appointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onCancel={handleCancel}
                  />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4">
                    Página {page} de {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setPage((p) => Math.min(data.pagination.totalPages, p + 1))
                    }
                    disabled={page === data.pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

