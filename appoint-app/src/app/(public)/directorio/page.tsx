'use client';

import { BusinessCard } from '@/components/business/business-card';
import { useBusinesses } from '@/hooks/use-businesses';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { MainNav } from '@/components/navigation/main-nav';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function DirectoryPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const { useBusinessesList } = useBusinesses();

  const { data, isLoading, error } = useBusinessesList({
    page,
    limit: 20,
    search: search || undefined,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Directorio de Negocios</h1>
        <p className="text-muted-foreground">
          Encuentra el servicio que necesitas
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar negocios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit">Buscar</Button>
        </div>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando negocios...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">Error al cargar los negocios</p>
          <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
        </div>
      )}

      {/* Business Grid */}
      {data && (
        <>
          {data.businesses.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron negocios</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {data.businesses.map((business) => (
                  <BusinessCard key={business.id} business={business} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="flex justify-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Anterior
                  </Button>
                  <span className="flex items-center px-4">
                    Página {page} de {data.pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                    disabled={page === data.pagination.totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}
      </div>
    </div>
  );
}

