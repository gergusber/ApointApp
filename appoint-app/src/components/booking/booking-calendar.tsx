'use client';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface BookingCalendarProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  disabledDates?: Date[];
}

export function BookingCalendar({
  selectedDate,
  onDateSelect,
  disabledDates = [],
}: BookingCalendarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Selecciona una Fecha</CardTitle>
        <CardDescription>
          Elige el día para tu cita
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={onDateSelect}
          disabled={(date) => {
            // Disable past dates
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date < today) return true;

            // Disable specific dates
            return disabledDates.some(
              (disabledDate) =>
                format(disabledDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
            );
          }}
          locale={es}
          className="rounded-md border"
        />
        {selectedDate && (
          <p className="mt-4 text-sm text-muted-foreground">
            Fecha seleccionada: {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

