import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Phone, Mail, Globe } from 'lucide-react';

interface BusinessHeroProps {
  business: {
    name: string;
    description: string | null;
    logo: string | null;
    coverImage: string | null;
    email: string;
    phone: string;
    website: string | null;
    categories: Array<{ id: string; name: string }>;
    locations: Array<{
      id: string;
      name: string;
      addressLine1: string;
      city: string;
      province: string;
      phone: string | null;
    }>;
  };
  averageRating?: number;
  reviewCount?: number;
}

export function BusinessHero({ business, averageRating, reviewCount }: BusinessHeroProps) {
  const initials = business.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const primaryLocation = business.locations[0];

  return (
    <div className="relative">
      {/* Cover Image */}
      {business.coverImage && (
        <div className="h-64 w-full overflow-hidden rounded-t-lg">
          <img
            src={business.coverImage}
            alt={business.name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <Avatar className="h-24 w-24 border-4 border-background">
            <AvatarImage src={business.logo || undefined} alt={business.name} />
            <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
          </Avatar>

          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{business.name}</h1>

            {/* Rating */}
            {(averageRating !== undefined || reviewCount) && (
              <div className="flex items-center gap-2 mb-4">
                {averageRating !== undefined && averageRating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold">{averageRating.toFixed(1)}</span>
                  </div>
                )}
                {reviewCount !== undefined && reviewCount > 0 && (
                  <span className="text-muted-foreground">({reviewCount} reseñas)</span>
                )}
              </div>
            )}

            {/* Categories */}
            {business.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {business.categories.map((category) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Contact Info */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              {primaryLocation && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {primaryLocation.addressLine1}, {primaryLocation.city}, {primaryLocation.province}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>{business.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>{business.email}</span>
              </div>
              {business.website && (
                <a
                  href={business.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary"
                >
                  <Globe className="h-4 w-4" />
                  <span>Website</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {business.description && (
          <div className="prose max-w-none">
            <p className="text-muted-foreground">{business.description}</p>
          </div>
        )}
      </div>
    </div>
  );
}

