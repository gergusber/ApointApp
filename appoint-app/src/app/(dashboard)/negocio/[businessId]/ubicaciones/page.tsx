'use client';

import React from 'react';
import { useLocations } from '@/hooks/use-locations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LocationForm } from '@/components/forms/location-form';
import { use } from 'react';
import { Plus, MapPin, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LocationsPageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default function LocationsPage({ params }: LocationsPageProps) {
  const { businessId } = use(params);
  const { useLocationsByBusiness, useDeleteLocation } = useLocations();
  const { data: locations, isLoading } = useLocationsByBusiness(businessId);
  const deleteMutation = useDeleteLocation();
  const [editingLocationId, setEditingLocationId] = React.useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  const handleDelete = (locationId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta ubicación?')) {
      deleteMutation.mutate({ id: locationId });
    }
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando ubicaciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Ubicaciones</h1>
          <p className="text-muted-foreground">
            Gestiona las ubicaciones de tu negocio
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Ubicación
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Crear Nueva Ubicación</DialogTitle>
            </DialogHeader>
            <LocationForm
              businessId={businessId}
              onSuccess={() => {
                setIsCreateDialogOpen(false);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {locations && locations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay ubicaciones</h3>
            <p className="text-muted-foreground mb-4">
              Crea tu primera ubicación para comenzar
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Primera Ubicación
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations?.map((location) => (
            <Card key={location.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      {location.name}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {location.address}, {location.city}, {location.province.replace(/_/g, ' ')}
                    </CardDescription>
                  </div>
                  <Badge variant={location.isActive ? 'default' : 'secondary'}>
                    {location.isActive ? 'Activa' : 'Inactiva'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  {location.postalCode && (
                    <p className="text-sm text-muted-foreground">
                      CP: {location.postalCode}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    {location._count.services} servicio(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingLocationId(location.id)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Editar Ubicación</DialogTitle>
                      </DialogHeader>
                      <LocationForm
                        businessId={businessId}
                        locationId={location.id}
                        onSuccess={() => {
                          setEditingLocationId(null);
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(location.id)}
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

