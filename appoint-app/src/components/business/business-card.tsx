import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';

interface BusinessCardProps {
  business: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    logo: string | null;
    categories: Array<{ id: string; name: string; slug: string }>;
    locations: Array<{
      id: string;
      name: string;
      city: string;
      province: string;
    }>;
    _count: {
      reviews: number;
    };
  };
  averageRating?: number;
}

export function BusinessCard({ business, averageRating }: BusinessCardProps) {
  const location = business.locations[0];
  const initials = business.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Link href={`/directorio/${business.slug}`}>
      <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={business.logo || undefined} alt={business.name} />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl mb-2">{business.name}</CardTitle>
              {location && (
                <CardDescription className="text-sm">
                  {location.city}, {location.province}
                </CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {business.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {business.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {business.categories.slice(0, 3).map((category) => (
              <Badge key={category.id} variant="secondary">
                {category.name}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {averageRating !== undefined && averageRating > 0 && (
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span>{averageRating.toFixed(1)}</span>
              </div>
            )}
            {business._count.reviews > 0 && (
              <span>({business._count.reviews} reseñas)</span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

