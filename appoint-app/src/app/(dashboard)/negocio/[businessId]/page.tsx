'use client';

import { useBusinesses } from '@/hooks/use-businesses';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MainNav } from '@/components/navigation/main-nav';
import { use } from 'react';
import Link from 'next/link';
import {
  Building2,
  MapPin,
  Calendar,
  Settings,
  Plus,
  BarChart3,
} from 'lucide-react';

interface BusinessDashboardProps {
  params: Promise<{
    businessId: string;
  }>;
}

export default function BusinessDashboardPage({ params }: BusinessDashboardProps) {
  const { businessId } = use(params);
  const { useMyBusinesses } = useBusinesses();
  const { data: businesses, isLoading } = useMyBusinesses();

  const business = businesses?.find((b) => b.id === businessId);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando información...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-destructive">Negocio no encontrado</p>
          <Link href="/negocio/nuevo">
            <Button className="mt-4">Crear Nuevo Negocio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <div className="container py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">{business.name}</h1>
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  business.status === 'ACTIVE' ? 'default' : 'secondary'
                }
              >
                {business.status === 'ACTIVE' ? 'Activo' : 'Pendiente'}
              </Badge>
              <Badge variant="outline">{business.subscriptionTier}</Badge>
            </div>
          </div>
          <Link href={`/directorio/${business.slug}`}>
            <Button variant="outline">Ver Página Pública</Button>
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Citas Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{business._count.appointments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Reseñas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{business._count.reviews}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ubicaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{business.locations.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href={`/negocio/${businessId}/ubicaciones`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <MapPin className="h-6 w-6 text-primary" />
                <CardTitle>Ubicaciones</CardTitle>
              </div>
              <CardDescription>
                Gestiona las ubicaciones de tu negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                {business.locations.length === 0 ? (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Primera Ubicación
                  </>
                ) : (
                  'Gestionar Ubicaciones'
                )}
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/negocio/${businessId}/servicios`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Building2 className="h-6 w-6 text-primary" />
                <CardTitle>Servicios</CardTitle>
              </div>
              <CardDescription>
                Administra los servicios que ofreces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Gestionar Servicios
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/negocio/${businessId}/citas`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <CardTitle>Citas</CardTitle>
              </div>
              <CardDescription>
                Gestiona las citas y solicitudes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Citas
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/negocio/${businessId}/disponibilidad`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Calendar className="h-6 w-6 text-primary" />
                <CardTitle>Disponibilidad</CardTitle>
              </div>
              <CardDescription>
                Configura horarios y fechas bloqueadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Configurar
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/negocio/${businessId}/configuracion`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle>Configuración</CardTitle>
              </div>
              <CardDescription>
                Ajustes del negocio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Configurar
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/negocio/${businessId}/analiticas`}>
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardHeader>
              <div className="flex items-center gap-3">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle>Analíticas</CardTitle>
              </div>
              <CardDescription>
                Estadísticas y reportes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">
                Ver Analíticas
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>
      </div>
    </div>
  );
}

