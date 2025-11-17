'use client';

import { use } from 'react';
import { useLocations } from '@/hooks/use-locations';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AvailabilityForm } from '@/components/forms/availability-form';
import { BlockedDatesForm } from '@/components/forms/blocked-dates-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AvailabilityPageProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default function AvailabilityPage({ params }: AvailabilityPageProps) {
  const { businessId } = use(params);
  const { useLocationsByBusiness } = useLocations();
  const { data: locations } = useLocationsByBusiness(businessId);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  if (!locations || locations.length === 0) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h3 className="text-lg font-semibold mb-2">No hay ubicaciones</h3>
            <p className="text-muted-foreground mb-4">
              Primero debes crear una ubicación para configurar la disponibilidad
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!selectedLocationId && locations.length > 0) {
    setSelectedLocationId(locations[0].id);
  }

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Disponibilidad</h1>
        <p className="text-muted-foreground">
          Configura horarios y fechas bloqueadas
        </p>
      </div>

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

      {selectedLocationId && (
        <Tabs defaultValue="hours" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hours">Horarios</TabsTrigger>
            <TabsTrigger value="blocked">Fechas Bloqueadas</TabsTrigger>
          </TabsList>

          <TabsContent value="hours">
            <Card>
              <CardHeader>
                <CardTitle>Horarios de Atención</CardTitle>
                <CardDescription>
                  Configura los horarios de atención para cada día de la semana
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AvailabilityForm locationId={selectedLocationId} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blocked">
            <BlockedDatesForm locationId={selectedLocationId} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

