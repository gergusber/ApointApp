'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocations } from '@/hooks/use-locations';
import { Province } from '@prisma/client';

const locationFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  address: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  city: z.string().min(2, 'La ciudad debe tener al menos 2 caracteres'),
  province: z.nativeEnum(Province),
  postalCode: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

type LocationFormValues = z.infer<typeof locationFormSchema>;

interface LocationFormProps {
  businessId: string;
  locationId?: string;
  onSuccess?: () => void;
}

const PROVINCES = Object.values(Province).map((p) => ({
  value: p,
  label: p.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
}));

export function LocationForm({ businessId, locationId, onSuccess }: LocationFormProps) {
  const { useCreateLocation, useUpdateLocation, useLocation } = useLocations();
  const createMutation = useCreateLocation();
  const updateMutation = useUpdateLocation();
  const { data: existingLocation } = useLocation(locationId || '');

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: {
      name: existingLocation?.name || '',
      address: existingLocation?.address || '',
      city: existingLocation?.city || '',
      province: existingLocation?.province || Province.CABA,
      postalCode: existingLocation?.postalCode || '',
      latitude: existingLocation?.latitude || undefined,
      longitude: existingLocation?.longitude || undefined,
    },
  });

  const onSubmit = (data: LocationFormValues) => {
    if (locationId) {
      updateMutation.mutate(
        {
          id: locationId,
          ...data,
        },
        {
          onSuccess: () => {
            onSuccess?.();
          },
        }
      );
    } else {
      createMutation.mutate(
        {
          businessId,
          ...data,
        },
        {
          onSuccess: () => {
            form.reset();
            onSuccess?.();
          },
        }
      );
    }
  };

  const isLoading = createMutation.isLoading || updateMutation.isLoading;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Ubicación</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Sucursal Centro" {...field} />
              </FormControl>
              <FormDescription>
                Nombre identificador de esta ubicación
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Dirección</FormLabel>
              <FormControl>
                <Input placeholder="Calle y número" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciudad</FormLabel>
                <FormControl>
                  <Input placeholder="Ciudad" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="province"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Provincia</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una provincia" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PROVINCES.map((province) => (
                      <SelectItem key={province.value} value={province.value}>
                        {province.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="postalCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Código Postal</FormLabel>
              <FormControl>
                <Input placeholder="Código postal (opcional)" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="latitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Latitud</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Latitud (opcional)"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>Para mostrar en mapas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="longitude"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Longitud</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    placeholder="Longitud (opcional)"
                    {...field}
                    onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>Para mostrar en mapas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? 'Guardando...'
            : locationId
            ? 'Actualizar Ubicación'
            : 'Crear Ubicación'}
        </Button>
      </form>
    </Form>
  );
}

