'use client';

import { useState } from 'react';
import { use } from 'react';
import { useBusinessAppointments } from '@/hooks/use-business-appointments';
import { PendingApprovals } from '@/components/dashboard/pending-approvals';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, User, DollarSign } from 'lucide-react';

interface BusinessAppointmentsPageProps {
  params: Promise<{
    businessId: string;
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

export default function BusinessAppointmentsPage({ params }: BusinessAppointmentsPageProps) {
  const { businessId } = use(params);
  const { usePendingAppointments, useApproveAppointment, useRejectAppointment } =
    useBusinessAppointments(businessId);

  const { data: pendingAppointments, isLoading: loadingPending } = usePendingAppointments();
  const { data: allAppointments, isLoading: loadingAll } = useBusinessAppointments(
    businessId
  ).useBusinessAppointments();

  const approveMutation = useApproveAppointment();
  const rejectMutation = useRejectAppointment();

  const handleApprove = (appointmentId: string, notes?: string) => {
    approveMutation.mutate({
      appointmentId,
      internalNotes: notes,
    });
  };

  const handleReject = (appointmentId: string, reason: string) => {
    rejectMutation.mutate({
      appointmentId,
      reason,
    });
  };

  const confirmedAppointments =
    allAppointments?.filter((apt) => apt.status === 'CONFIRMED') || [];
  const paymentPendingAppointments =
    allAppointments?.filter((apt) => apt.status === 'PAYMENT_PENDING') || [];

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Gestión de Citas</h1>
        <p className="text-muted-foreground">
          Gestiona las solicitudes y citas de tu negocio
        </p>
      </div>

      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pending">
            Pendientes ({pendingAppointments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="payment">
            Pago Pendiente ({paymentPendingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="confirmed">
            Confirmadas ({confirmedAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="all">Todas</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-6">
          {loadingPending ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando solicitudes pendientes...</p>
            </div>
          ) : (
            <PendingApprovals
              appointments={
                pendingAppointments?.map((apt) => ({
                  id: apt.id,
                  appointmentDate: apt.appointmentDate,
                  startTime: apt.startTime,
                  endTime: apt.endTime,
                  customerNotes: apt.customerNotes || undefined,
                  user: {
                    firstName: apt.user.firstName,
                    lastName: apt.user.lastName,
                    email: apt.user.email,
                  },
                  service: {
                    name: apt.service.name,
                    price: apt.servicePrice,
                  },
                })) || []
              }
              onApprove={handleApprove}
              onReject={handleReject}
              isLoading={approveMutation.isLoading || rejectMutation.isLoading}
            />
          )}
        </TabsContent>

        <TabsContent value="payment" className="space-y-4">
          {paymentPendingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay citas pendientes de pago</p>
              </CardContent>
            </Card>
          ) : (
            paymentPendingAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{appointment.service.name}</CardTitle>
                      <CardDescription>
                        {appointment.user.firstName} {appointment.user.lastName}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Fecha</p>
                      <p className="text-muted-foreground">
                        {format(appointment.appointmentDate, 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Horario</p>
                      <p className="text-muted-foreground">{appointment.startTime}</p>
                    </div>
                    <div>
                      <User className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Cliente</p>
                      <p className="text-muted-foreground">{appointment.user.email}</p>
                    </div>
                    <div>
                      <DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Total</p>
                      <p className="text-muted-foreground">
                        ${appointment.totalAmount.toLocaleString('es-AR')} ARS
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="confirmed" className="space-y-4">
          {confirmedAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay citas confirmadas</p>
              </CardContent>
            </Card>
          ) : (
            confirmedAppointments.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{appointment.service.name}</CardTitle>
                      <CardDescription>
                        {appointment.user.firstName} {appointment.user.lastName}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Fecha</p>
                      <p className="text-muted-foreground">
                        {format(appointment.appointmentDate, 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Horario</p>
                      <p className="text-muted-foreground">{appointment.startTime}</p>
                    </div>
                    <div>
                      <User className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Cliente</p>
                      <p className="text-muted-foreground">{appointment.user.email}</p>
                    </div>
                    <div>
                      <DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Total</p>
                      <p className="text-muted-foreground">
                        ${appointment.totalAmount.toLocaleString('es-AR')} ARS
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {loadingAll ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Cargando todas las citas...</p>
            </div>
          ) : allAppointments && allAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No hay citas</p>
              </CardContent>
            </Card>
          ) : (
            allAppointments?.map((appointment) => (
              <Card key={appointment.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{appointment.service.name}</CardTitle>
                      <CardDescription>
                        {appointment.user.firstName} {appointment.user.lastName}
                      </CardDescription>
                    </div>
                    <Badge className={statusColors[appointment.status]}>
                      {statusLabels[appointment.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <Calendar className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Fecha</p>
                      <p className="text-muted-foreground">
                        {format(appointment.appointmentDate, 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                    <div>
                      <Clock className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Horario</p>
                      <p className="text-muted-foreground">{appointment.startTime}</p>
                    </div>
                    <div>
                      <User className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Cliente</p>
                      <p className="text-muted-foreground">{appointment.user.email}</p>
                    </div>
                    <div>
                      <DollarSign className="h-4 w-4 text-muted-foreground mb-1" />
                      <p className="font-medium">Total</p>
                      <p className="text-muted-foreground">
                        ${appointment.totalAmount.toLocaleString('es-AR')} ARS
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

