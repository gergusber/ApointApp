'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useBusinesses } from '@/hooks/use-businesses';
import { BusinessCard } from '@/components/business/business-card';
import { MainNav } from '@/components/navigation/main-nav';
import { Calendar, Clock, Shield, Star, Search, ArrowRight } from 'lucide-react';

export default function Home() {
  const { useBusinessesList } = useBusinesses();
  const { data: featuredBusinesses } = useBusinessesList({
    page: 1,
    limit: 6,
  });

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
        <div className="container relative z-10 py-24 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl mb-6">
              Reserva tu cita
              <span className="text-primary"> fácil y rápido</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Encuentra y reserva servicios en negocios de toda Argentina. 
              Gestión simple, pagos seguros, confirmación instantánea.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/directorio">
                <Button size="lg" className="w-full sm:w-auto">
                  <Search className="mr-2 h-5 w-5" />
                  Explorar Negocios
                </Button>
              </Link>
              <Link href="/negocio/nuevo">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Registra tu Negocio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">¿Por qué elegirnos?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Una plataforma diseñada para simplificar la gestión de citas
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Calendar className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Reserva en Línea</CardTitle>
                <CardDescription>
                  Reserva tu cita las 24 horas del día, desde cualquier dispositivo
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Clock className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Horarios Reales</CardTitle>
                <CardDescription>
                  Consulta disponibilidad en tiempo real y evita conflictos
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Pagos Seguros</CardTitle>
                <CardDescription>
                  Pagos procesados de forma segura con MercadoPago
                </CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <Star className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Reseñas Verificadas</CardTitle>
                <CardDescription>
                  Lee reseñas de clientes reales antes de reservar
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Businesses Section */}
      {featuredBusinesses?.businesses && featuredBusinesses.businesses.length > 0 && (
        <section className="py-16 md:py-24 bg-muted/50">
          <div className="container">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Negocios Destacados</h2>
                <p className="text-muted-foreground">
                  Descubre los servicios más populares
                </p>
              </div>
              <Link href="/directorio">
                <Button variant="outline">
                  Ver Todos
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredBusinesses.businesses.slice(0, 6).map((business) => (
                <BusinessCard key={business.id} business={business} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="container">
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-4">
                ¿Eres dueño de un negocio?
              </CardTitle>
              <CardDescription className="text-lg">
                Únete a nuestra plataforma y gestiona tus citas de forma profesional.
                Aumenta tus reservas y simplifica tu administración.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Link href="/negocio/nuevo">
                <Button size="lg">
                  Registra tu Negocio Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
