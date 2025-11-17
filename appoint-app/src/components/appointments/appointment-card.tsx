'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, MapPin, DollarSign, X } from 'lucide-react';
import Link from 'next/link';

interface AppointmentCardProps {
  appointment: {
    id: string;
    appointmentDate: Date;
    startTime: string;
    endTime: string;
    status: string;
    totalAmount: number;
    service: {
      name: string;
      durationMinutes: number;
      location: {
        name: string;
        address: string;
        city: string;
        province: string;
        business: {
          name: string;
          slug: string;
        };
      };
    };
  };
  onCancel?: (id: string) => void;
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

export function AppointmentCard({ appointment, onCancel }: AppointmentCardProps) {
  const canCancel =
    appointment.status === 'PENDING' ||
    appointment.status === 'PAYMENT_PENDING' ||
    appointment.status === 'CONFIRMED';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{appointment.service.name}</CardTitle>
            <CardDescription>
              {appointment.service.location.business.name}
            </CardDescription>
          </div>
          <Badge className={statusColors[appointment.status] || 'bg-gray-100 text-gray-800'}>
            {statusLabels[appointment.status] || appointment.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {format(appointment.appointmentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              {appointment.startTime} - {appointment.endTime} ({appointment.service.durationMinutes} min)
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>
              {appointment.service.location.name}, {appointment.service.location.city}
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="font-semibold">
              ${appointment.totalAmount.toLocaleString('es-AR')} ARS
            </span>
          </div>

          <div className="flex gap-2 pt-2">
            <Link href={`/panel/citas/${appointment.id}`}>
              <Button variant="outline" size="sm">
                Ver Detalles
              </Button>
            </Link>
            {canCancel && onCancel && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onCancel(appointment.id)}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

