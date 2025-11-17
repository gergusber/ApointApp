'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, DollarSign, MapPin } from 'lucide-react';

interface BookingSummaryProps {
  service: {
    name: string;
    durationMinutes: number;
    price: number;
    location: {
      name: string;
      address: string;
      city: string;
      province: string;
    };
  };
  date: Date;
  time: string;
  platformFee?: number;
}

export function BookingSummary({ service, date, time, platformFee = 0 }: BookingSummaryProps) {
  const totalAmount = service.price + platformFee;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumen de la Reserva</CardTitle>
        <CardDescription>Revisa los detalles antes de confirmar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Fecha y Hora</p>
              <p className="text-sm text-muted-foreground">
                {format(date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              <p className="text-sm text-muted-foreground">{time}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Servicio</p>
              <p className="text-sm text-muted-foreground">{service.name}</p>
              <p className="text-sm text-muted-foreground">
                Duración: {service.durationMinutes} minutos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Ubicación</p>
              <p className="text-sm text-muted-foreground">{service.location.name}</p>
              <p className="text-sm text-muted-foreground">
                {service.location.address}, {service.location.city}, {service.location.province.replace(/_/g, ' ')}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 pt-3 border-t">
            <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium mb-2">Precio</p>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Servicio:</span>
                  <span>${service.price.toLocaleString('es-AR')} ARS</span>
                </div>
                {platformFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Comisión plataforma (1%):</span>
                    <span>${platformFee.toLocaleString('es-AR')} ARS</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold pt-2 border-t">
                  <span>Total:</span>
                  <span>${totalAmount.toLocaleString('es-AR')} ARS</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

