'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Check, X, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';

interface PendingApproval {
  id: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  customerNotes?: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  service: {
    name: string;
    price: number;
  };
}

interface PendingApprovalsProps {
  appointments: PendingApproval[];
  onApprove: (id: string, notes?: string) => void;
  onReject: (id: string, reason: string) => void;
  isLoading?: boolean;
}

export function PendingApprovals({
  appointments,
  onApprove,
  onReject,
  isLoading,
}: PendingApprovalsProps) {
  const [rejectDialogOpen, setRejectDialogOpen] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [approveNotes, setApproveNotes] = useState<Record<string, string>>({});

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay solicitudes pendientes</h3>
          <p className="text-muted-foreground">
            Todas las solicitudes han sido procesadas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {appointments.map((appointment) => (
        <Card key={appointment.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{appointment.service.name}</CardTitle>
                <CardDescription>
                  {appointment.user.firstName} {appointment.user.lastName} ({appointment.user.email})
                </CardDescription>
              </div>
              <Badge variant="outline">Pendiente</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mb-4">
              <div className="text-sm">
                <span className="font-medium">Fecha:</span>{' '}
                {format(appointment.appointmentDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
              </div>
              <div className="text-sm">
                <span className="font-medium">Horario:</span> {appointment.startTime} - {appointment.endTime}
              </div>
              <div className="text-sm">
                <span className="font-medium">Precio:</span> $
                {appointment.service.price.toLocaleString('es-AR')} ARS
              </div>
              {appointment.customerNotes && (
                <div className="text-sm">
                  <span className="font-medium">Notas del cliente:</span>
                  <p className="text-muted-foreground mt-1">{appointment.customerNotes}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="default" size="sm">
                    <Check className="h-4 w-4 mr-2" />
                    Aprobar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirmar Aprobación</DialogTitle>
                    <DialogDescription>
                      ¿Aprobar esta solicitud de cita?
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Notas internas (opcional)
                      </label>
                      <Textarea
                        placeholder="Notas solo visibles para el negocio..."
                        rows={3}
                        value={approveNotes[appointment.id] || ''}
                        onChange={(e) =>
                          setApproveNotes({ ...approveNotes, [appointment.id]: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setApproveNotes({ ...approveNotes, [appointment.id]: '' })}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        onApprove(appointment.id, approveNotes[appointment.id]);
                        setApproveNotes({ ...approveNotes, [appointment.id]: '' });
                      }}
                      disabled={isLoading}
                    >
                      Confirmar Aprobación
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog open={rejectDialogOpen === appointment.id} onOpenChange={(open) => {
                if (!open) {
                  setRejectDialogOpen(null);
                  setRejectReason('');
                } else {
                  setRejectDialogOpen(appointment.id);
                }
              }}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <X className="h-4 w-4 mr-2" />
                    Rechazar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Rechazar Solicitud</DialogTitle>
                    <DialogDescription>
                      Por favor, proporciona una razón para el rechazo
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Razón del rechazo *
                      </label>
                      <Textarea
                        placeholder="Ej: Horario no disponible, servicio no disponible..."
                        rows={4}
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Mínimo 10 caracteres
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setRejectDialogOpen(null);
                        setRejectReason('');
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (rejectReason.length >= 10) {
                          onReject(appointment.id, rejectReason);
                          setRejectDialogOpen(null);
                          setRejectReason('');
                        }
                      }}
                      disabled={isLoading || rejectReason.length < 10}
                    >
                      Confirmar Rechazo
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

