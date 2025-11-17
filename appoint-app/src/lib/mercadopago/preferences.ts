/**
 * MercadoPago Preferences
 * Creates payment preferences for appointments
 */

import { mercadoPagoClient } from './client';
import { PreferenceCreateRequest } from 'mercadopago/dist/clients/preference/create/types';

interface CreatePreferenceParams {
  appointmentId: string;
  title: string;
  description: string;
  amount: number;
  payerEmail: string;
  payerName: string;
  successUrl: string;
  failureUrl: string;
  pendingUrl: string;
}

/**
 * Create a payment preference for an appointment
 */
export async function createAppointmentPreference({
  appointmentId,
  title,
  description,
  amount,
  payerEmail,
  payerName,
  successUrl,
  failureUrl,
  pendingUrl,
}: CreatePreferenceParams) {
  const preferenceRequest: PreferenceCreateRequest = {
    body: {
      items: [
        {
          id: appointmentId,
          title,
          description,
          quantity: 1,
          unit_price: amount,
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: payerEmail,
        name: payerName,
      },
      back_urls: {
        success: successUrl,
        failure: failureUrl,
        pending: pendingUrl,
      },
      auto_return: 'approved',
      external_reference: appointmentId,
      notification_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/mercadopago`,
      statement_descriptor: 'CITA',
      metadata: {
        appointment_id: appointmentId,
      },
    },
  };

  const preference = await mercadoPagoClient.create(preferenceRequest);

  return preference;
}

