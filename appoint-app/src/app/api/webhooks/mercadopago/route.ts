import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyWebhookSignature } from '@/lib/mercadopago/webhooks';
import { PaymentStatus, AppointmentStatus } from '@prisma/client';

export async function POST(req: NextRequest) {
  try {
    const xSignature = req.headers.get('x-signature');
    const xRequestId = req.headers.get('x-request-id');

    if (!xSignature || !xRequestId) {
      return NextResponse.json({ error: 'Missing headers' }, { status: 400 });
    }

    const body = await req.json();
    const { data, type } = body;

    if (!data || !data.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      xSignature,
      xRequestId,
      data.id,
      type
    );

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Handle payment notification
    if (type === 'payment') {
      // Fetch payment details from MercadoPago (you would need to implement this)
      // For now, we'll update based on the notification

      const paymentId = data.id;
      const externalReference = body.data?.external_reference; // appointment ID

      if (!externalReference) {
        return NextResponse.json({ error: 'Missing external reference' }, { status: 400 });
      }

      // Find appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: externalReference },
        include: {
          payments: true,
        },
      });

      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      // Determine payment status based on MercadoPago status
      // Note: You should fetch the actual payment status from MercadoPago API
      const paymentStatus = body.data?.status || 'pending';

      let newPaymentStatus: PaymentStatus = 'PENDING';
      let newAppointmentStatus: AppointmentStatus = appointment.status;

      switch (paymentStatus) {
        case 'approved':
          newPaymentStatus = 'PAID';
          if (appointment.status === 'PAYMENT_PENDING') {
            newAppointmentStatus = 'CONFIRMED';
          }
          break;
        case 'rejected':
        case 'cancelled':
          newPaymentStatus = 'FAILED';
          break;
        case 'refunded':
          newPaymentStatus = 'REFUNDED';
          break;
        default:
          newPaymentStatus = 'PENDING';
      }

      // Update or create payment record
      const existingPayment = appointment.payments.find((p) => p.mercadoPagoId === paymentId);

      if (existingPayment) {
        await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            status: newPaymentStatus,
            updatedAt: new Date(),
          },
        });
      } else {
        await prisma.payment.create({
          data: {
            appointmentId: appointment.id,
            amount: appointment.totalAmount,
            status: newPaymentStatus,
            mercadoPagoId: paymentId,
            type: 'FULL_PAYMENT',
            platformFee: appointment.platformFee,
            netAmount: appointment.totalAmount - appointment.platformFee,
          },
        });
      }

      // Update appointment status
      await prisma.appointment.update({
        where: { id: externalReference },
        data: {
          status: newAppointmentStatus,
          paymentStatus: newPaymentStatus,
          totalPaid: newPaymentStatus === 'PAID' ? appointment.totalAmount : appointment.totalPaid,
          confirmedAt: newAppointmentStatus === 'CONFIRMED' ? new Date() : appointment.confirmedAt,
        },
      });

      // TODO: Send notifications when notification service is created
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('MercadoPago webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

