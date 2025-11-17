/**
 * User Sync Service
 * Ensures users exist in our database when they authenticate
 * This is a fallback if webhooks fail or for first-time logins
 */

import { currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';

/**
 * Get or create user from Clerk session
 * This ensures users exist in our DB even if webhook didn't fire
 */
export async function getOrCreateUser(clerkId: string) {
  console.log(`[User Sync] Attempting to sync user: ${clerkId}`);
  
  // Try to find existing user
  let user = await prisma.user.findUnique({
    where: { clerkId },
  });

  if (user) {
    console.log(`[User Sync] User already exists: ${user.id}`);
    return user;
  }

  console.log(`[User Sync] User not found, fetching from Clerk...`);
  
  // User doesn't exist, get from Clerk currentUser (more reliable than API call)
  const clerkUser = await currentUser();

  if (!clerkUser) {
    console.error(`[User Sync] Failed to fetch user from Clerk for ID: ${clerkId}`);
    throw new Error('Failed to fetch user from Clerk');
  }

  if (clerkUser.id !== clerkId) {
    console.error(`[User Sync] User ID mismatch. Expected: ${clerkId}, Got: ${clerkUser.id}`);
    throw new Error('User ID mismatch');
  }

  console.log(`[User Sync] Creating user in database: ${clerkUser.emailAddresses[0]?.emailAddress}`);

  try {
    // Create user in our database
    user = await prisma.user.create({
      data: {
        clerkId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || 'Usuario',
        lastName: clerkUser.lastName || '',
        phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
        role: 'USER',
      },
    });

    console.log(`[User Sync] User created successfully: ${user.id}`);
    return user;
  } catch (error: any) {
    // Handle race condition - user might have been created by webhook between check and create
    if (error.code === 'P2002') {
      console.log(`[User Sync] User was created concurrently, fetching...`);
      user = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (user) {
        return user;
      }
    }
    console.error(`[User Sync] Error creating user:`, error);
    throw error;
  }
}

/**
 * Sync user on login (updates lastLogin timestamp)
 */
export async function syncUserOnLogin(clerkId: string) {
  const user = await getOrCreateUser(clerkId);

  // Update last login timestamp
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLogin: new Date(),
    },
  });

  return user;
}

