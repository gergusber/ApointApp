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
import { Textarea } from '@/components/ui/textarea';
import { useServices } from '@/hooks/use-services';

const serviceFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  description: z.string().max(2000).optional(),
  durationMinutes: z.number().min(15).max(480),
  bufferMinutes: z.number().min(0).max(120).default(0),
  price: z.number().positive('El precio debe ser mayor a 0'),
  requiresDeposit: z.boolean().default(false),
  depositAmount: z.number().positive().optional(),
  depositPercentage: z.number().min(0).max(100).optional(),
  requiresApproval: z.boolean().default(true),
  maxAdvanceDays: z.number().min(1).max(365).default(30),
  image: z.string().url('URL inválida').optional().or(z.literal('')),
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  locationId: string;
  serviceId?: string;
  onSuccess?: () => void;
}

export function ServiceForm({ locationId, serviceId, onSuccess }: ServiceFormProps) {
  const { useCreateService, useUpdateService, useService } = useServices();
  const createMutation = useCreateService();
  const updateMutation = useUpdateService();
  const { data: existingService } = useService(serviceId || '');

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: existingService?.name || '',
      description: existingService?.description || '',
      durationMinutes: existingService?.durationMinutes || 60,
      bufferMinutes: existingService?.bufferMinutes || 0,
      price: existingService?.price || 0,
      requiresDeposit: existingService?.requiresDeposit || false,
      depositAmount: existingService?.depositAmount || undefined,
      depositPercentage: existingService?.depositPercentage || undefined,
      requiresApproval: existingService?.requiresApproval ?? true,
      maxAdvanceDays: existingService?.maxAdvanceDays || 30,
      image: existingService?.image || '',
    },
  });

  const requiresDeposit = form.watch('requiresDeposit');

  const onSubmit = (data: ServiceFormValues) => {
    const submitData = {
      ...data,
      image: data.image || undefined,
      description: data.description || undefined,
    };

    if (serviceId) {
      updateMutation.mutate(
        {
          id: serviceId,
          ...submitData,
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
          locationId,
          ...submitData,
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
              <FormLabel>Nombre del Servicio</FormLabel>
              <FormControl>
                <Input placeholder="Ej: Corte de Pelo" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe el servicio..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>Descripción del servicio (opcional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="durationMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duración (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={15}
                    max={480}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>Duración del servicio en minutos</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bufferMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tiempo de Buffer (minutos)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    max={120}
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    value={field.value}
                  />
                </FormControl>
                <FormDescription>Tiempo entre citas</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio (ARS)</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  min={0}
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="requiresDeposit"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="rounded"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Requiere depósito</FormLabel>
                <FormDescription>
                  Si está marcado, se requerirá un depósito al reservar
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {requiresDeposit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="depositAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto del Depósito (ARS)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>Monto fijo del depósito</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="depositPercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Porcentaje del Depósito (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>O porcentaje del precio total</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <FormField
          control={form.control}
          name="requiresApproval"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                  className="rounded"
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Requiere aprobación</FormLabel>
                <FormDescription>
                  Si está marcado, las citas requerirán aprobación manual
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxAdvanceDays"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Días de Anticipación Máxima</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  max={365}
                  {...field}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  value={field.value}
                />
              </FormControl>
              <FormDescription>
                Con cuántos días de anticipación se puede reservar
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="image"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Imagen</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://..." {...field} />
              </FormControl>
              <FormDescription>URL de la imagen del servicio (opcional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading
            ? 'Guardando...'
            : serviceId
            ? 'Actualizar Servicio'
            : 'Crear Servicio'}
        </Button>
      </form>
    </Form>
  );
}

