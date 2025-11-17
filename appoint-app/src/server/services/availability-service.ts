/**
 * Availability Service
 * Calculates available time slots for appointments
 */

import { PrismaClient } from '@prisma/client';
import { DayOfWeek } from '@prisma/client';
import { detectConflicts } from './conflict-detector';

interface CalculateAvailabilityParams {
  serviceId: string;
  date: Date;
  professionalId?: string;
  prisma: PrismaClient;
}

interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  reason?: string; // If not available, why?
}

interface AvailabilityResult {
  date: Date;
  slots: TimeSlot[];
  isClosed: boolean;
  closedReason?: string;
}

/**
 * Get day of week name from Date
 */
function getDayOfWeek(date: Date): DayOfWeek {
  const day = date.getDay();
  const days: DayOfWeek[] = [
    'SUNDAY',
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
  ];
  return days[day] as DayOfWeek;
}

/**
 * Generate time slots between start and end time
 */
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number,
  bufferMinutes: number
): string[] {
  const slots: string[] = [];
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const [endHours, endMinutes] = endTime.split(':').map(Number);

  let currentHours = startHours;
  let currentMinutes = startMinutes;

  while (
    currentHours < endHours ||
    (currentHours === endHours && currentMinutes + durationMinutes <= endMinutes)
  ) {
    const slotTime = `${currentHours.toString().padStart(2, '0')}:${currentMinutes.toString().padStart(2, '0')}`;
    slots.push(slotTime);

    // Move to next slot (duration + buffer)
    currentMinutes += durationMinutes + bufferMinutes;
    while (currentMinutes >= 60) {
      currentMinutes -= 60;
      currentHours += 1;
    }
  }

  return slots;
}

/**
 * Check if date is blocked
 */
async function isDateBlocked(
  locationId: string,
  date: Date,
  prisma: PrismaClient
): Promise<{ blocked: boolean; reason?: string }> {
  const blockedDate = await prisma.blockedDate.findFirst({
    where: {
      locationId,
      date: date,
    },
  });

  if (blockedDate) {
    return {
      blocked: true,
      reason: blockedDate.reason || 'Fecha bloqueada',
    };
  }

  return { blocked: false };
}

/**
 * Check minimum advance booking requirement
 */
function checkMinAdvance(
  date: Date,
  startTime: string,
  minAdvanceHours: number
): boolean {
  const appointmentDateTime = new Date(date);
  const [hours, minutes] = startTime.split(':').map(Number);
  appointmentDateTime.setHours(hours, minutes, 0, 0);

  const now = new Date();
  const hoursUntil = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  return hoursUntil >= minAdvanceHours;
}

/**
 * Calculate available time slots for a service on a given date
 */
export async function calculateAvailability({
  serviceId,
  date,
  professionalId,
  prisma,
}: CalculateAvailabilityParams): Promise<AvailabilityResult> {
  // Get service with location and business
  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      location: {
        include: {
          business: true,
          businessHours: true,
          blockedDates: true,
        },
      },
    },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Check if date is blocked
  const blockedCheck = await isDateBlocked(service.locationId, date, prisma);
  if (blockedCheck.blocked) {
    return {
      date,
      slots: [],
      isClosed: true,
      closedReason: blockedCheck.reason,
    };
  }

  // Get business hours for this day
  const dayOfWeek = getDayOfWeek(date);
  const businessHours = service.location.businessHours.find(
    (bh) => bh.dayOfWeek === dayOfWeek
  );

  if (!businessHours || businessHours.isClosed) {
    return {
      date,
      slots: [],
      isClosed: true,
      closedReason: 'Cerrado este día',
    };
  }

  // Generate all possible time slots
  const allSlots = generateTimeSlots(
    businessHours.openTime,
    businessHours.closeTime,
    service.durationMinutes,
    service.bufferMinutes
  );

  // Get existing appointments for this date
  const existingAppointments = await prisma.appointment.findMany({
    where: {
      serviceId,
      appointmentDate: date,
      status: {
        in: ['CONFIRMED', 'PAYMENT_PENDING'], // These block slots
      },
      ...(professionalId && {
        professionalId,
      }),
    },
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
    },
  });

  // Check each slot for conflicts and availability
  const slots: TimeSlot[] = [];
  const minAdvanceHours = service.location.business.minAdvanceHours;

  for (const slotTime of allSlots) {
    // Check minimum advance requirement
    if (!checkMinAdvance(date, slotTime, minAdvanceHours)) {
      slots.push({
        time: slotTime,
        available: false,
        reason: 'No cumple con el tiempo mínimo de anticipación',
      });
      continue;
    }

    // Check for conflicts
    const conflicts = await detectConflicts({
      serviceId,
      date,
      startTime: slotTime,
      durationMinutes: service.durationMinutes,
      professionalId,
      prisma,
    });

    if (conflicts.length > 0) {
      slots.push({
        time: slotTime,
        available: false,
        reason: 'Horario no disponible',
      });
    } else {
      slots.push({
        time: slotTime,
        available: true,
      });
    }
  }

  return {
    date,
    slots,
    isClosed: false,
  };
}

