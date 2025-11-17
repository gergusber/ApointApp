'use client';

import React from 'react';
import { useServices } from '@/hooks/use-services';
import { useLocations } from '@/hooks/use-locations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ServiceForm } from '@/components/forms/service-form';
import { use } from 'react';
import { Plus, Clock, DollarSign, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ServicesPageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default function ServicesPage({ params }: ServicesPageProps) {
  const { businessId } = use(params);
  const { useLocationsByBusiness } = useLocations();
  const { data: locations } = useLocationsByBusiness(businessId);
  const [selectedLocationId, setSelectedLocationId] = React.useState<string>('');
  const { useServicesByLocation, useDeleteService } = useServices();
  const { data: services, isLoading } = useServicesByLocation(selectedLocationId || '');
  const deleteMutation = useDeleteService();
  const [editingServiceId, setEditingServiceId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  React.useEffect(() => {
    if (locations && locations.length > 0 && !selectedLocationId) {
      setSelectedLocationId(locations[0].id);
    }
  }, [locations, selectedLocationId]);

  const handleDelete = (serviceId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este servicio?')) {
      deleteMutation.mutate({ id: serviceId });
    }
  };

  if (!locations || locations.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay ubicaciones</h3>
            <p className="text-muted-foreground mb-4">
              Primero debes crear una ubicación para agregar servicios
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Servicios</h1>
          <p className="text-muted-foreground">
            Gestiona los servicios que ofreces
          </p>
        </div>
        {selectedLocationId && (
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Servicio
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Crear Nuevo Servicio</DialogTitle>
              </DialogHeader>
              <ServiceForm
                locationId={selectedLocationId}
                onSuccess={() => {
                  setIsCreateDialogOpen(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Location Selector */}
      <div className="mb-6">
        <label className="text-sm font-medium mb-2 block">Selecciona una ubicación</label>
        <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
          <SelectTrigger className="w-full md:w-[300px]">
            <SelectValue placeholder="Selecciona una ubicación" />
          </SelectTrigger>
          <SelectContent>
            {locations.map((location) => (
              <SelectItem key={location.id} value={location.id}>
                {location.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando servicios...</p>
        </div>
      ) : services && services.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay servicios</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primer servicio para comenzar
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primer Servicio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services?.map((service) => (
            <Card key={service.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <CardTitle>{service.name}</CardTitle>
                  <Badge variant={service.isActive ? 'default' : 'secondary'}>
                    {service.isActive ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
                {service.description && (
                  <CardDescription className="line-clamp-2">
                    {service.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      ${service.price.toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{service.durationMinutes} minutos</span>
                    {service.bufferMinutes > 0 && (
                      <span>(+{service.bufferMinutes} min buffer)</span>
                    )}
                  </div>
                  {service.requiresApproval && (
                    <Badge variant="outline" className="text-xs">
                      Requiere aprobación
                    </Badge>
                  )}
                  {service.requiresDeposit && (
                    <Badge variant="outline" className="text-xs">
                      Requiere depósito
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingServiceId(service.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Editar Servicio</DialogTitle>
                      </DialogHeader>
                      <ServiceForm
                        locationId={service.locationId}
                        serviceId={service.id}
                        onSuccess={() => {
                          setEditingServiceId(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(service.id)}
                    disabled={deleteMutation.isLoading}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

