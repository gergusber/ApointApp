'use client';

import { use } from 'react';
import { useAppointments } from '@/hooks/use-appointments';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, DollarSign, User, X } from 'lucide-react';
import Link from 'next/link';

interface AppointmentDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PAYMENT_PENDING: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  REJECTED: 'bg-red-100 text-red-800',
  EXPIRED: 'bg-gray-100 text-gray-800',
  COMPLETED: 'bg-purple-100 text-purple-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Pendiente',
  PAYMENT_PENDING: 'Pago Pendiente',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  REJECTED: 'Rechazada',
  EXPIRED: 'Expirada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No se presentó',
};

export default function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const { id } = use(params);
  const { useAppointment, useCancelAppointment } = useAppointments();
  const { data: appointment, isLoading } = useAppointment(id);
  const cancelMutation = useCancelAppointment();

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando detalles de la cita...</p>
        </div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Cita no encontrada</p>
          <Link href="/panel/citas">
            <Button className="mt-4">Volver a Mis Citas</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canCancel =
    appointment.status === 'PENDING' ||
    appointment.status === 'PAYMENT_PENDING' ||
    appointment.status === 'CONFIRMED';

  const handleCancel = () => {
    if (confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
      cancelMutation.mutate({
        appointmentId: id,
        reason: 'Cancelado por el usuario',
      });
    }
  };

  return (
    <div className="container py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/panel/citas">
          <Button variant="ghost">← Volver a Mis Citas</Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-4xl font-bold">{appointment.service.name}</h1>
          <Badge className={statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}>
            {statusLabels[appointment.status] || appointment.status}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {appointment.service.location.business.name}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de la Cita</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Fecha</p>
                <p className="text-sm text-muted-foreground">
                  {format(appointment.appointmentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Horario</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.startTime} - {appointment.endTime}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duración: {appointment.service.durationMinutes} minutos
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Ubicación</p>
                <p className="text-sm text-muted-foreground">
                  {appointment.service.location.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  {appointment.service.location.address}, {appointment.service.location.city}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Información de Pago</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Precio del servicio:</span>
              <span>${appointment.servicePrice.toLocaleString('es-AR')} ARS</span>
            </div>
            {appointment.platformFee > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comisión plataforma (1%):</span>
                <span>${appointment.platformFee.toLocaleString('es-AR')} ARS</span>
              </div>
            )}
            <div className="flex justify-between text-base font-semibold pt-2 border-t">
              <span>Total:</span>
              <span>${appointment.totalAmount.toLocaleString('es-AR')} ARS</span>
            </div>
            {appointment.totalPaid > 0 && (
              <div className="flex justify-between text-sm pt-2">
                <span className="text-muted-foreground">Pagado:</span>
                <span className="text-green-600">
                  ${appointment.totalPaid.toLocaleString('es-AR')} ARS
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {appointment.customerNotes && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Notas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{appointment.customerNotes}</p>
          </CardContent>
        </Card>
      )}

      {appointment.rejectionReason && (
        <Card className="mb-6 border-destructive">
          <CardHeader>
            <CardTitle className="text-lg text-destructive">Razón del Rechazo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{appointment.rejectionReason}</p>
          </CardContent>
        </Card>
      )}

      {canCancel && (
        <div className="flex gap-4">
          <Button variant="destructive" onClick={handleCancel} disabled={cancelMutation.isLoading}>
            <X className="h-4 w-4 mr-2" />
            {cancelMutation.isLoading ? 'Cancelando...' : 'Cancelar Cita'}
          </Button>
        </div>
      )}
    </div>
  );
}

