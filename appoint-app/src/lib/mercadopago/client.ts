/**
 * MercadoPago Client
 * Handles MercadoPago SDK initialization and configuration
 */

import { MercadoPagoConfig, Preference } from 'mercadopago';

// In development, allow running without MercadoPago credentials
const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || 'TEST_TOKEN_PLACEHOLDER';

if (!process.env.MERCADOPAGO_ACCESS_TOKEN && process.env.NODE_ENV === 'production') {
  throw new Error('MERCADOPAGO_ACCESS_TOKEN is required in production');
}

if (!process.env.MERCADOPAGO_ACCESS_TOKEN) {
  console.warn('⚠️  MERCADOPAGO_ACCESS_TOKEN is not set. Payment features will not work.');
}

const client = new MercadoPagoConfig({
  accessToken,
  options: {
    timeout: 5000,
    idempotencyKey: 'appointments-platform',
  },
});

export const mercadoPagoClient = new Preference(client);

export { Preference } from 'mercadopago';

