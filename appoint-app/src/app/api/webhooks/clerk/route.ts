import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { WebhookEvent } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  // Get the Svix headers for verification
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.warn('[Webhook] CLERK_WEBHOOK_SECRET not set, webhook will not work');
    // In development, allow webhook to proceed without secret (for testing)
    if (process.env.NODE_ENV === 'production') {
      return new Response('Webhook secret not configured', { status: 500 });
    }
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  let evt: WebhookEvent;

  // Verify the payload with the headers (if secret is configured)
  if (WEBHOOK_SECRET && svix_id && svix_timestamp && svix_signature) {
    try {
      const wh = new Webhook(WEBHOOK_SECRET);
      evt = wh.verify(body, {
        'svix-id': svix_id,
        'svix-timestamp': svix_timestamp,
        'svix-signature': svix_signature,
      }) as WebhookEvent;
    } catch (err) {
      console.error('[Webhook] Error verifying webhook:', err);
      return new Response('Error occurred', {
        status: 400,
      });
    }
  } else {
    // In development, use payload directly (not secure, but allows testing)
    console.warn('[Webhook] Running without verification (development mode)');
    evt = payload as WebhookEvent;
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === 'user.created') {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data;

    console.log(`[Webhook] User created event received: ${id}`);

    try {
      // Create user in our database
      const user = await prisma.user.create({
        data: {
          clerkId: id,
          email: email_addresses[0]?.email_address || '',
          firstName: first_name || 'Usuario',
          lastName: last_name || '',
          phone: phone_numbers?.[0]?.phone_number || null,
          role: 'USER', // Default role
        },
      });

      console.log(`[Webhook] User created successfully: ${user.id} - ${user.email}`);
    } catch (error: any) {
      // Handle duplicate user (might already exist from business creation or concurrent sync)
      if (error.code === 'P2002') {
        console.log(`[Webhook] User already exists (duplicate): ${id}`);
        // This is fine - user was created by another process
      } else {
        console.error('[Webhook] Error creating user:', error);
        // Don't return error - let the sync service handle it
      }
    }
  }

  if (eventType === 'user.updated') {
    const { id, email_addresses, first_name, last_name, phone_numbers } = evt.data;

    try {
      // Update user in our database
      await prisma.user.update({
        where: { clerkId: id },
        data: {
          email: email_addresses[0]?.email_address || '',
          firstName: first_name || 'Usuario',
          lastName: last_name || '',
          phone: phone_numbers?.[0]?.phone_number || null,
        },
      });

      console.log(`User updated: ${id}`);
    } catch (error) {
      console.error('Error updating user:', error);
      // Don't fail if user doesn't exist yet (might be created later)
    }
  }

  if (eventType === 'user.deleted') {
    const { id } = evt.data;

    try {
      // Delete user from our database
      await prisma.user.delete({
        where: { clerkId: id },
      });

      console.log(`User deleted: ${id}`);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  }

  return new Response('Webhook processed', { status: 200 });
}

