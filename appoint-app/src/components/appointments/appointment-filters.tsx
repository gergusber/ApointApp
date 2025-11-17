'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AppointmentFiltersProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function AppointmentFilters({ activeTab, onTabChange }: AppointmentFiltersProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      <TabsList>
        <TabsTrigger value="all">Todas</TabsTrigger>
        <TabsTrigger value="PENDING">Pendientes</TabsTrigger>
        <TabsTrigger value="CONFIRMED">Confirmadas</TabsTrigger>
        <TabsTrigger value="PAYMENT_PENDING">Pago Pendiente</TabsTrigger>
        <TabsTrigger value="CANCELLED">Canceladas</TabsTrigger>
        <TabsTrigger value="COMPLETED">Completadas</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

