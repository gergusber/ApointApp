'use client';

import { useAppointments } from '@/hooks/use-appointments';
import { AppointmentCard } from '@/components/appointments/appointment-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MainNav } from '@/components/navigation/main-nav';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function UserDashboardPage() {
  const { useAppointmentsList, useCancelAppointment } = useAppointments();
  const { data: upcomingData } = useAppointmentsList({
    status: 'CONFIRMED',
    limit: 5,
  });
  const { data: pendingData } = useAppointmentsList({
    status: 'PENDING',
    limit: 5,
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
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Mi Panel</h1>
        <p className="text-muted-foreground">
          Gestiona tus citas y reservas
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Próximas Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingData?.appointments.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pendientes de Aprobación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingData?.appointments.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Citas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(upcomingData?.pagination.total || 0) + (pendingData?.pagination.total || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Appointments */}
      {pendingData && pendingData.appointments.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Pendientes de Aprobación</h2>
            <Link href="/panel/citas?status=PENDING">
              <Button variant="outline">Ver Todas</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingData.appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Appointments */}
      {upcomingData && upcomingData.appointments.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold">Próximas Citas</h2>
            <Link href="/panel/citas?status=CONFIRMED">
              <Button variant="outline">Ver Todas</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingData.appointments.map((appointment) => (
              <AppointmentCard
                key={appointment.id}
                appointment={appointment}
                onCancel={handleCancel}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tienes citas próximas</h3>
            <p className="text-muted-foreground mb-4">
              Explora el directorio para encontrar servicios
            </p>
            <Link href="/directorio">
              <Button>Explorar Negocios</Button>
            </Link>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

