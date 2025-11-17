/**
 * MercadoPago Webhook Verification
 * Verifies webhook signatures from MercadoPago
 */

import crypto from 'crypto';

/**
 * Verify MercadoPago webhook signature
 */
export function verifyWebhookSignature(
  xSignature: string,
  xRequestId: string,
  dataId: string,
  type: string
): boolean {
  if (!process.env.MERCADOPAGO_WEBHOOK_SECRET) {
    console.warn('MERCADOPAGO_WEBHOOK_SECRET not set, skipping verification');
    return true; // In development, allow without verification
  }

  try {
    const parts = xSignature.split(',');
    const signatureMap: Record<string, string> = {};

    parts.forEach((part) => {
      const [key, value] = part.split('=');
      signatureMap[key.trim()] = value.trim();
    });

    const ts = signatureMap.ts;
    const hash = signatureMap.v1;

    if (!ts || !hash) {
      return false;
    }

    // Create the data string to verify
    const dataString = `id:${dataId};request-id:${xRequestId};ts:${ts};type:${type}`;

    // Create HMAC hash
    const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(dataString);
    const calculatedHash = hmac.digest('hex');

    // Compare hashes
    return calculatedHash === hash;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}

