'use client';

import { BusinessHero } from '@/components/business/business-hero';
import { useBusinesses } from '@/hooks/use-businesses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Clock } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface BusinessPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function BusinessPage({ params }: BusinessPageProps) {
  const { slug } = use(params);
  const { useBusinessBySlug } = useBusinesses();
  const { data: business, isLoading, error } = useBusinessBySlug(slug);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando información del negocio...</p>
        </div>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar el negocio</p>
          <p className="text-sm text-muted-foreground mt-2">
            {error?.message || 'Negocio no encontrado'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <div className="container py-8">
      <BusinessHero
        business={business}
        averageRating={business.averageRating}
        reviewCount={business._count.reviews}
      />

      {/* Locations Section */}
      {business.locations.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Ubicaciones</CardTitle>
            <CardDescription>Nuestras sucursales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {business.locations.map((location) => (
                <div key={location.id} className="flex items-start gap-4">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{location.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {location.addressLine1}, {location.city}, {location.province}
                    </p>
                    {location.phone && (
                      <p className="text-sm text-muted-foreground">{location.phone}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Section */}
      {business.locations.some((loc) => loc.services.length > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Servicios</CardTitle>
            <CardDescription>Nuestros servicios disponibles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {business.locations.map((location) =>
                location.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{service.name}</h3>
                      {service.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {service.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          ${service.price.toLocaleString('es-AR')}
                        </span>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{service.durationMinutes} min</span>
                        </div>
                      </div>
                    </div>
                    <Link href={`/directorio/${slug}/reservar/${service.id}`}>
                      <Button>Reservar</Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Section */}
      {business.reviews.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Reseñas</CardTitle>
            <CardDescription>
              {business._count.reviews} reseñas de clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {business.reviews.map((review) => (
                <div key={review.id} className="border-b pb-4 last:border-0">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold">
                        {review.user.firstName} {review.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={i < review.rating ? 'text-yellow-400' : 'text-gray-300'}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}

