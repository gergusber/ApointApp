/**
 * Conflict Detector Service
 * Detects overlapping appointments and scheduling conflicts
 */

import { PrismaClient } from '@prisma/client';
import { AppointmentStatus } from '@prisma/client';

interface DetectConflictsParams {
  serviceId: string;
  date: Date;
  startTime: string; // HH:MM format
  durationMinutes: number;
  professionalId?: string;
  excludeAppointmentId?: string; // For rescheduling - exclude current appointment
  prisma: PrismaClient;
}

interface Conflict {
  appointmentId: string;
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
}

/**
 * Detect conflicts with existing appointments
 * Returns array of conflicting appointments
 */
export async function detectConflicts({
  serviceId,
  date,
  startTime,
  durationMinutes,
  professionalId,
  excludeAppointmentId,
  prisma,
}: DetectConflictsParams): Promise<Conflict[]> {
  // Calculate end time
  const [startHours, startMinutes] = startTime.split(':').map(Number);
  const startDateTime = new Date(date);
  startDateTime.setHours(startHours, startMinutes, 0, 0);

  const endDateTime = new Date(startDateTime);
  endDateTime.setMinutes(endDateTime.getMinutes() + durationMinutes);
  const endTime = `${endDateTime.getHours().toString().padStart(2, '0')}:${endDateTime.getMinutes().toString().padStart(2, '0')}`;

  // Find existing appointments that could conflict
  // Conflicts occur when:
  // 1. Same service (or same professional if specified)
  // 2. Same date
  // 3. Status is CONFIRMED or PAYMENT_PENDING (these block the slot)
  // 4. Time ranges overlap

  const where: any = {
    serviceId,
    appointmentDate: date,
    status: {
      in: ['CONFIRMED', 'PAYMENT_PENDING'], // Only these statuses block slots
    },
    ...(excludeAppointmentId && {
      id: { not: excludeAppointmentId },
    }),
    ...(professionalId && {
      professionalId,
    }),
  };

  const existingAppointments = await prisma.appointment.findMany({
    where,
    select: {
      id: true,
      startTime: true,
      endTime: true,
      status: true,
    },
  });

  const conflicts: Conflict[] = [];

  for (const appointment of existingAppointments) {
    const [aptStartHours, aptStartMinutes] = appointment.startTime.split(':').map(Number);
    const [aptEndHours, aptEndMinutes] = appointment.endTime.split(':').map(Number);

    const aptStart = new Date(date);
    aptStart.setHours(aptStartHours, aptStartMinutes, 0, 0);

    const aptEnd = new Date(date);
    aptEnd.setHours(aptEndHours, aptEndMinutes, 0, 0);

    // Check for overlap
    // Overlap occurs if:
    // - New start is between existing start and end, OR
    // - New end is between existing start and end, OR
    // - New appointment completely contains existing appointment
    const hasOverlap =
      (startDateTime >= aptStart && startDateTime < aptEnd) ||
      (endDateTime > aptStart && endDateTime <= aptEnd) ||
      (startDateTime <= aptStart && endDateTime >= aptEnd);

    if (hasOverlap) {
      conflicts.push({
        appointmentId: appointment.id,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        status: appointment.status as AppointmentStatus,
      });
    }
  }

  return conflicts;
}

