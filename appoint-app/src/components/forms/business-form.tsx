'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useBusinesses } from '@/hooks/use-businesses';
import { useCategories } from '@/hooks/use-categories';
import { useState } from 'react';
import { toast } from 'sonner';

const businessFormSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'El slug solo puede contener letras minúsculas, números y guiones'),
  description: z.string().max(1000).optional(),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'Teléfono inválido'),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  cuit: z.string().regex(/^\d{2}-\d{8}-\d{1}$/, 'CUIT inválido (formato: XX-XXXXXXXX-X)'),
  categoryIds: z.array(z.string()).min(1, 'Debes seleccionar al menos una categoría'),
});

type BusinessFormValues = z.infer<typeof businessFormSchema>;

interface BusinessFormProps {
  onSuccess?: (businessId: string) => void;
}

export function BusinessForm({ onSuccess }: BusinessFormProps) {
  const { useCreateBusiness } = useBusinesses();
  const createMutation = useCreateBusiness();
  const [slugFromName, setSlugFromName] = useState('');

  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      email: '',
      phone: '',
      website: '',
      cuit: '',
      categoryIds: [],
    },
  });

  // Generate slug from name
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlugFromName(slug);
    form.setValue('slug', slug);
  };

  const onSubmit = async (data: BusinessFormValues) => {
    console.log('=== FORM SUBMIT START ===');
    console.log('Form data:', data);

    // Ensure categoryIds is always an array
    const categoryIds = Array.isArray(data.categoryIds) && data.categoryIds.length > 0 
      ? data.categoryIds 
      : [];
    
    if (categoryIds.length === 0) {
      toast.error('Debes seleccionar al menos una categoría');
      return;
    }

    const payload = {
      name: data.name.trim(),
      slug: data.slug.trim(),
      description: data.description && data.description.trim() !== '' ? data.description.trim() : undefined,
      email: data.email.trim(),
      phone: data.phone.trim(),
      website: data.website && data.website.trim() !== '' ? data.website.trim() : undefined,
      cuit: data.cuit.trim(),
      categoryIds: categoryIds,
    };

    console.log('=== PAYLOAD VALIDATION ===');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('Payload types:', {
      name: typeof payload.name,
      slug: typeof payload.slug,
      description: typeof payload.description,
      email: typeof payload.email,
      phone: typeof payload.phone,
      website: typeof payload.website,
      cuit: typeof payload.cuit,
      categoryIds: Array.isArray(payload.categoryIds) ? `array[${payload.categoryIds.length}]` : typeof payload.categoryIds,
    });
    console.log('categoryIds value:', payload.categoryIds);
    console.log('categoryIds is array:', Array.isArray(payload.categoryIds));
    console.log('categoryIds length:', payload.categoryIds?.length);

    try {
      console.log('=== CALLING MUTATION ===');
      console.log('Payload:', JSON.stringify(payload, null, 2));
      
      const result = await createMutation.mutateAsync(payload);
      console.log('✅ Success! Result:', result);
      toast.success('Negocio creado exitosamente!');
      if (onSuccess) {
        onSuccess(result.id);
      }
    } catch (error: unknown) {
      console.error('=== FORM ERROR ===');
      console.error('Error caught:', error);
      
      // Extract error message from tRPC error
      let errorMessage = 'Error al crear el negocio';
      
      if (error && typeof error === 'object') {
        // Check for tRPC error structure
        if ('data' in error) {
          const errorData = error.data as {
            zodError?: { formErrors?: string[] };
            message?: string;
          };
          
          if (errorData?.zodError?.formErrors?.[0]) {
            errorMessage = errorData.zodError.formErrors[0];
          } else if (errorData?.message) {
            errorMessage = errorData.message;
          }
        }
        
        // Check for standard Error message
        if ('message' in error && typeof error.message === 'string') {
          errorMessage = error.message;
        }
      }
      
      console.error('Final error message:', errorMessage);
      
      toast.error('Error al crear el negocio', {
        description: errorMessage,
        duration: 5000,
      });
    }
  };

  // Fetch categories from API using hook (returns plain JSON array)
  const { useCategoriesList } = useCategories();
  const { data: categories = [], isLoading: categoriesLoading, error: categoriesError } = useCategoriesList();
  
  // Debug categories
  console.log('[Business Form] Categories:', categories);
  console.log('[Business Form] Categories loading:', categoriesLoading);
  console.log('[Business Form] Categories error:', categoriesError);
  console.log('[Business Form] Categories length:', categories.length);

  const onInvalid = () => {
    toast.error('Por favor completa todos los campos requeridos');
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Negocio</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Peluquería Centro"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    handleNameChange(e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                El nombre público de tu negocio
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Negocio</FormLabel>
              <FormControl>
                <Input placeholder="peluqueria-centro" {...field} />
              </FormControl>
              <FormDescription>
                URL única para tu negocio: /directorio/{slugFromName || 'tu-negocio'}
              </FormDescription>
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
                  placeholder="Describe tu negocio..."
                  className="resize-none"
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Una breve descripción de tu negocio (opcional)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="contacto@negocio.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input type="tel" placeholder="+54 9 XXX XXX-XXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="website"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sitio Web</FormLabel>
              <FormControl>
                <Input type="url" placeholder="https://www.negocio.com" {...field} />
              </FormControl>
              <FormDescription>URL de tu sitio web (opcional)</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cuit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>CUIT</FormLabel>
              <FormControl>
                <Input placeholder="XX-XXXXXXXX-X" {...field} />
              </FormControl>
              <FormDescription>
                CUIT del negocio (formato: XX-XXXXXXXX-X)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Categorías</FormLabel>
              <FormControl>
                {categoriesLoading ? (
                  <div className="text-sm text-muted-foreground">Cargando categorías...</div>
                ) : categoriesError ? (
                  <div className="text-sm text-destructive">
                    Error al cargar categorías: {categoriesError.message}
                  </div>
                ) : !categories || categories.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No hay categorías disponibles</div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {categories.map((category) => (
                      <label
                        key={category.id}
                        className="flex items-center space-x-2 p-3 border rounded-md cursor-pointer hover:bg-accent"
                      >
                        <input
                          type="checkbox"
                          checked={Array.isArray(field.value) && field.value.includes(category.id)}
                          onChange={(e) => {
                            const currentValue = Array.isArray(field.value) ? field.value : [];
                            if (e.target.checked) {
                              field.onChange([...currentValue, category.id]);
                            } else {
                              field.onChange(currentValue.filter((id) => id !== category.id));
                            }
                          }}
                          className="rounded"
                        />
                        <span>{category.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </FormControl>
              <FormDescription>
                Selecciona al menos una categoría
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Debug button */}
        <Button
          type="button"
          onClick={() => {
            console.log('Form state:', form.getValues());
            console.log('Form errors:', form.formState.errors);
            console.log('Form isValid:', form.formState.isValid);
          }}
          variant="outline"
          className="w-full"
        >
          Debug: Ver estado del formulario
        </Button>

        <Button type="submit" disabled={createMutation.isPending} className="w-full">
          {createMutation.isPending ? 'Creando...' : 'Crear Negocio'}
        </Button>

        {createMutation.error && (
          <p className="text-sm text-red-600 mt-2">
            Error: {createMutation.error.message}
          </p>
        )}
      </form>
    </Form>
  );
}

