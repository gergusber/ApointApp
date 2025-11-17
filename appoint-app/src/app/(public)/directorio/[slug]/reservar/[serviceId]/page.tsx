'use client';

import { useState } from 'react';
import { use } from 'react';
import { useAppointments } from '@/hooks/use-appointments';
import { useServices } from '@/hooks/use-services';
import { MainNav } from '@/components/navigation/main-nav';
import { BookingCalendar } from '@/components/booking/booking-calendar';
import { TimeSlotPicker } from '@/components/booking/time-slot-picker';
import { BookingForm } from '@/components/booking/booking-form';
import { BookingSummary } from '@/components/booking/booking-summary';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface BookingPageProps {
  params: Promise<{
    slug: string;
    serviceId: string;
  }>;
}

export default function BookingPage({ params }: BookingPageProps) {
  const { slug, serviceId } = use(params);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>();

  const { useService } = useServices();
  const { useAvailability, useCreateAppointment } = useAppointments();

  const { data: service, isLoading: loadingService } = useService(serviceId);
  const { data: availability, isLoading: loadingAvailability } = useAvailability(
    serviceId,
    selectedDate!
  );
  const createMutation = useCreateAppointment();

  const handleSubmit = (formData: { customerNotes?: string }) => {
    if (!selectedDate || !selectedTime) return;

    createMutation.mutate({
      serviceId,
      appointmentDate: selectedDate,
      startTime: selectedTime,
      customerNotes: formData.customerNotes,
    });
  };

  if (loadingService) {
    return (
      <div className="container py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Cargando información del servicio...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Servicio no encontrado</AlertDescription>
        </Alert>
      </div>
    );
  }

  const platformFee = service.price * 0.01;

  return (
    <div className="flex flex-col min-h-screen">
      <MainNav />
      <div className="container py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Reservar Cita</h1>
        <p className="text-muted-foreground">
          {service.name} - {service.location.business.name}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Booking Steps */}
        <div className="space-y-6">
          {/* Step 1: Select Date */}
          <BookingCalendar
            selectedDate={selectedDate}
            onDateSelect={(date) => {
              setSelectedDate(date);
              setSelectedTime(undefined); // Reset time when date changes
            }}
          />

          {/* Step 2: Select Time */}
          {selectedDate && (
            <TimeSlotPicker
              slots={availability?.slots || []}
              selectedSlot={selectedTime}
              onSelectSlot={setSelectedTime}
              isLoading={loadingAvailability}
            />
          )}

          {/* Step 3: Add Notes */}
          {selectedTime && (
            <BookingForm onSubmit={handleSubmit} isLoading={createMutation.isLoading} />
          )}
        </div>

        {/* Right Column - Summary */}
        <div className="lg:sticky lg:top-8 h-fit">
          {selectedDate && selectedTime && service && (
            <BookingSummary
              service={{
                name: service.name,
                durationMinutes: service.durationMinutes,
                price: service.price,
                location: {
                  name: service.location.name,
                  address: service.location.address,
                  city: service.location.city,
                  province: service.location.province,
                },
              }}
              date={selectedDate}
              time={selectedTime}
              platformFee={platformFee}
            />
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

