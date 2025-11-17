'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { trpc } from '@/lib/trpc/client';

interface ReviewsSectionProps {
  businessId: string;
}

export function ReviewsSection({ businessId }: ReviewsSectionProps) {
  const { data, isLoading } = trpc.v1.reviews.getByBusiness.useQuery({
    businessId,
    page: 1,
    limit: 10,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">Cargando reseñas...</p>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.reviews.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Reseñas</CardTitle>
          <CardDescription>No hay reseñas aún</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Calculate average rating
  const averageRating =
    data.reviews.reduce((sum, review) => sum + review.rating, 0) / data.reviews.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Reseñas</CardTitle>
            <CardDescription>
              {data.pagination.total} reseña(s)
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold">{averageRating.toFixed(1)}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.reviews.map((review) => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold">
                    {review.user.firstName} {review.user.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(review.createdAt, 'dd/MM/yyyy', { locale: es })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.comment && (
                <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
              )}
              {review.response && (
                <div className="mt-3 p-3 bg-muted rounded-lg">
                  <p className="text-xs font-semibold mb-1">Respuesta del negocio:</p>
                  <p className="text-sm">{review.response}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

