'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

interface BlockedDatesFormProps {
  locationId: string;
}

export function BlockedDatesForm({ locationId }: BlockedDatesFormProps) {
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const utils = trpc.useUtils();
  const { data: blockedDates } = trpc.v1.availability.getBlockedDates.useQuery({
    locationId,
  });

  const createBlockedDate = trpc.v1.availability.createBlockedDate.useMutation({
    onSuccess: () => {
      utils.v1.availability.getBlockedDates.invalidate({ locationId });
      setNewDate('');
      setReason('');
      setIsRecurring(false);
      toast.success('Fecha bloqueada agregada');
    },
    onError: (error) => {
      toast.error('Error al bloquear la fecha', {
        description: error.message,
      });
    },
  });

  const deleteBlockedDate = trpc.v1.availability.deleteBlockedDate.useMutation({
    onSuccess: () => {
      utils.v1.availability.getBlockedDates.invalidate({ locationId });
      toast.success('Fecha bloqueada eliminada');
    },
    onError: (error) => {
      toast.error('Error al eliminar la fecha bloqueada', {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) return;

    createBlockedDate.mutate({
      locationId,
      date: new Date(newDate),
      reason: reason || undefined,
      isRecurring,
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Agregar Fecha Bloqueada</CardTitle>
          <CardDescription>
            Bloquea fechas específicas para evitar reservas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="reason">Razón (opcional)</Label>
              <Input
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Feriado, mantenimiento..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="recurring"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded"
              />
              <Label htmlFor="recurring">Recurrente (anual)</Label>
            </div>
            <Button type="submit" disabled={createBlockedDate.isLoading}>
              {createBlockedDate.isLoading ? 'Agregando...' : 'Agregar Fecha Bloqueada'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {blockedDates && blockedDates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Fechas Bloqueadas</CardTitle>
            <CardDescription>
              Fechas actualmente bloqueadas para esta ubicación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {blockedDates.map((blockedDate) => (
                <div
                  key={blockedDate.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">
                      {format(blockedDate.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
                    </p>
                    {blockedDate.reason && (
                      <p className="text-sm text-muted-foreground">{blockedDate.reason}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {blockedDate.isRecurring && (
                      <Badge variant="secondary">Recurrente</Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteBlockedDate.mutate({ id: blockedDate.id })}
                      disabled={deleteBlockedDate.isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

