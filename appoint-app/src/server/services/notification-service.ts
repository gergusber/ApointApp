/**
 * Notification Service
 * Handles sending notifications (email, in-app, etc.)
 */

import { sendEmail } from '@/lib/email/sender';
import { appointmentRequestEmail } from '@/lib/email/templates/appointment-request';
import { appointmentApprovedEmail } from '@/lib/email/templates/appointment-approved';
import { appointmentRejectedEmail } from '@/lib/email/templates/appointment-rejected';
import { PrismaClient } from '@prisma/client';
import { NotificationType } from '@prisma/client';

interface SendAppointmentNotificationParams {
  appointmentId: string;
  type: 'REQUEST' | 'APPROVED' | 'REJECTED' | 'PAYMENT_CONFIRMED' | 'CANCELLED';
  prisma: PrismaClient;
}

/**
 * Send appointment notification
 */
export async function sendAppointmentNotification({
  appointmentId,
  type,
  prisma,
}: SendAppointmentNotificationParams): Promise<void> {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      user: true,
      business: true,
      service: {
        include: {
          location: true,
        },
      },
    },
  });

  if (!appointment) {
    throw new Error('Appointment not found');
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Create in-app notification
  let notificationType: NotificationType;
  let title: string;
  let message: string;
  let link: string;

  switch (type) {
    case 'REQUEST':
      notificationType = 'APPOINTMENT_REQUEST';
      title = 'Nueva Solicitud de Cita';
      message = `${appointment.user.firstName} ${appointment.user.lastName} solicitó una cita para ${appointment.service.name}`;
      link = `/negocio/${appointment.businessId}/citas`;
      
      // Send email to business
      await sendEmail({
        to: appointment.business.email,
        subject: 'Nueva Solicitud de Cita',
        html: appointmentRequestEmail({
          businessName: appointment.business.name,
          customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
          serviceName: appointment.service.name,
          appointmentDate: appointment.appointmentDate.toLocaleDateString('es-AR'),
          appointmentTime: appointment.startTime,
          customerNotes: appointment.customerNotes || undefined,
          approvalLink: `${baseUrl}/negocio/${appointment.businessId}/citas`,
        }),
      });
      break;

    case 'APPROVED':
      notificationType = 'APPOINTMENT_APPROVED';
      title = 'Cita Aprobada';
      message = `Tu cita en ${appointment.business.name} fue aprobada`;
      link = `/panel/citas/${appointment.id}`;
      
      // Send email to customer
      await sendEmail({
        to: appointment.user.email,
        subject: 'Cita Aprobada',
        html: appointmentApprovedEmail({
          customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
          businessName: appointment.business.name,
          serviceName: appointment.service.name,
          appointmentDate: appointment.appointmentDate.toLocaleDateString('es-AR'),
          appointmentTime: appointment.startTime,
          paymentLink: `${baseUrl}/panel/citas/${appointment.id}`,
          totalAmount: appointment.totalAmount,
        }),
      });
      break;

    case 'REJECTED':
      notificationType = 'APPOINTMENT_REJECTED';
      title = 'Cita Rechazada';
      message = `Tu cita en ${appointment.business.name} fue rechazada`;
      link = `/panel/citas/${appointment.id}`;
      
      // Send email to customer
      await sendEmail({
        to: appointment.user.email,
        subject: 'Cita Rechazada',
        html: appointmentRejectedEmail({
          customerName: `${appointment.user.firstName} ${appointment.user.lastName}`,
          businessName: appointment.business.name,
          serviceName: appointment.service.name,
          appointmentDate: appointment.appointmentDate.toLocaleDateString('es-AR'),
          appointmentTime: appointment.startTime,
          reason: appointment.rejectionReason || undefined,
        }),
      });
      break;

    case 'PAYMENT_CONFIRMED':
      notificationType = 'PAYMENT_CONFIRMED';
      title = 'Pago Confirmado';
      message = `El pago de tu cita en ${appointment.business.name} fue confirmado`;
      link = `/panel/citas/${appointment.id}`;
      break;

    case 'CANCELLED':
      notificationType = 'APPOINTMENT_CANCELLED';
      title = 'Cita Cancelada';
      message = `Tu cita en ${appointment.business.name} fue cancelada`;
      link = `/panel/citas/${appointment.id}`;
      break;
  }

  // Create in-app notification for user
  await prisma.userNotification.create({
    data: {
      userId: appointment.userId,
      type: notificationType,
      title,
      message,
      link,
    },
  });

  // For business notifications (REQUEST), also notify business owner
  if (type === 'REQUEST') {
    const businessOwner = await prisma.user.findUnique({
      where: { id: appointment.business.ownerId },
    });

    if (businessOwner) {
      await prisma.userNotification.create({
        data: {
          userId: businessOwner.id,
          type: notificationType,
          title,
          message,
          link,
        },
      });
    }
  }
}

