'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DayOfWeek } from '@prisma/client';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
  { value: 'SUNDAY', label: 'Domingo' },
];

interface AvailabilityFormProps {
  locationId: string;
  onSuccess?: () => void;
}

export function AvailabilityForm({ locationId, onSuccess }: AvailabilityFormProps) {
  const utils = trpc.useUtils();
  const { data: existingHours } = trpc.v1.availability.getBusinessHours.useQuery({
    locationId,
  });

  const [hours, setHours] = useState<Record<DayOfWeek, { open: string; close: string; closed: boolean }>>(
    () => {
      const defaultHours: Record<DayOfWeek, { open: string; close: string; closed: boolean }> = {
        MONDAY: { open: '09:00', close: '18:00', closed: false },
        TUESDAY: { open: '09:00', close: '18:00', closed: false },
        WEDNESDAY: { open: '09:00', close: '18:00', closed: false },
        THURSDAY: { open: '09:00', close: '18:00', closed: false },
        FRIDAY: { open: '09:00', close: '18:00', closed: false },
        SATURDAY: { open: '09:00', close: '13:00', closed: false },
        SUNDAY: { open: '09:00', close: '18:00', closed: true },
      };

      if (existingHours) {
        existingHours.forEach((hour) => {
          defaultHours[hour.dayOfWeek] = {
            open: hour.openTime,
            close: hour.closeTime,
            closed: hour.isClosed,
          };
        });
      }

      return defaultHours;
    }
  );

  const setBusinessHours = trpc.v1.availability.setBusinessHours.useMutation({
    onSuccess: () => {
      utils.v1.availability.getBusinessHours.invalidate({ locationId });
      toast.success('Horarios actualizados exitosamente');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Error al actualizar los horarios', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBusinessHours.mutate({
      locationId,
      hours: DAYS.map((day) => ({
        dayOfWeek: day.value,
        openTime: hours[day.value].open,
        closeTime: hours[day.value].close,
        isClosed: hours[day.value].closed,
      })),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        {DAYS.map((day) => (
          <Card key={day.value}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-24">
                  <Label className="font-semibold">{day.label}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!hours[day.value].closed}
                    onChange={(e) =>
                      setHours({
                        ...hours,
                        [day.value]: { ...hours[day.value], closed: !e.target.checked },
                      })
                    }
                    className="rounded"
                  />
                  <Label className="text-sm">Abierto</Label>
                </div>
                {!hours[day.value].closed && (
                  <>
                    <Input
                      type="time"
                      value={hours[day.value].open}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [day.value]: { ...hours[day.value], open: e.target.value },
                        })
                      }
                      className="w-32"
                    />
                    <span className="text-muted-foreground">-</span>
                    <Input
                      type="time"
                      value={hours[day.value].close}
                      onChange={(e) =>
                        setHours({
                          ...hours,
                          [day.value]: { ...hours[day.value], close: e.target.value },
                        })
                      }
                      className="w-32"
                    />
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Button type="submit" disabled={setBusinessHours.isLoading} className="w-full">
        {setBusinessHours.isLoading ? 'Guardando...' : 'Guardar Horarios'}
      </Button>
    </form>
  );
}

