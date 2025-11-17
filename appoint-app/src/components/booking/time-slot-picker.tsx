'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlot {
  time: string;
  available: boolean;
  reason?: string;
}

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: string | undefined;
  onSelectSlot: (time: string) => void;
  isLoading?: boolean;
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
}: TimeSlotPickerProps) {
  const availableSlots = slots.filter((slot) => slot.available);
  const unavailableSlots = slots.filter((slot) => !slot.available);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Horarios Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Cargando horarios...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (slots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Horarios Disponibles</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No hay horarios disponibles para esta fecha</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Horarios Disponibles
        </CardTitle>
        <CardDescription>
          Selecciona un horario disponible
        </CardDescription>
      </CardHeader>
      <CardContent>
        {availableSlots.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">No hay horarios disponibles</p>
            {unavailableSlots.length > 0 && (
              <p className="text-sm text-muted-foreground">
                Todos los horarios están ocupados o no cumplen con los requisitos
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {availableSlots.map((slot) => (
              <Button
                key={slot.time}
                variant={selectedSlot === slot.time ? 'default' : 'outline'}
                onClick={() => onSelectSlot(slot.time)}
                className={cn(
                  'h-auto py-3',
                  selectedSlot === slot.time && 'ring-2 ring-primary'
                )}
              >
                {slot.time}
              </Button>
            ))}
          </div>
        )}

        {unavailableSlots.length > 0 && availableSlots.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <p className="text-sm font-medium mb-2">Horarios no disponibles:</p>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {unavailableSlots.map((slot) => (
                <div
                  key={slot.time}
                  className="text-xs p-2 border rounded text-muted-foreground text-center"
                  title={slot.reason}
                >
                  {slot.time}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

