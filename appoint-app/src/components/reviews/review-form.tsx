'use client';

import { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { toast } from 'sonner';

const reviewFormSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

type ReviewFormValues = z.infer<typeof reviewFormSchema>;

interface ReviewFormProps {
  businessId: string;
  onSuccess?: () => void;
}

export function ReviewForm({ businessId, onSuccess }: ReviewFormProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const form = useForm<ReviewFormValues>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const createReview = trpc.v1.reviews.create.useMutation({
    onSuccess: () => {
      utils.v1.reviews.getByBusiness.invalidate({ businessId });
      form.reset();
      toast.success('Reseña creada exitosamente');
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Error al crear la reseña', {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: ReviewFormValues) => {
    if (data.rating === 0) {
      toast.error('Por favor selecciona una calificación');
      return;
    }

    createReview.mutate({
      businessId,
      rating: data.rating,
      comment: data.comment || undefined,
    });
  };

  const rating = form.watch('rating');
  const displayRating = hoveredRating || rating;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dejar una Reseña</CardTitle>
        <CardDescription>
          Comparte tu experiencia con este negocio
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Calificación</FormLabel>
                  <FormControl>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(null)}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= displayRating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comentario (opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Comparte tu experiencia..."
                      className="resize-none"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Máximo 1000 caracteres</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={createReview.isLoading} className="w-full">
              {createReview.isLoading ? 'Enviando...' : 'Enviar Reseña'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

