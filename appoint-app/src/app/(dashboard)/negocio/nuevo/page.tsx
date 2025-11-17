'use client';

import { BusinessForm } from '@/components/forms/business-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function NewBusinessPage() {
  const router = useRouter();

  return (
    <div className="container py-8 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Crear Nuevo Negocio</CardTitle>
          <CardDescription>
            Completa la información para registrar tu negocio en la plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BusinessForm
            onSuccess={(businessId) => {
              router.push(`/negocio/${businessId}`);
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

