import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== TEST USER SYNC ENDPOINT ===');

    // 1. Check Clerk auth
    const session = await auth();
    console.log('1. Clerk session:', session);

    if (!session?.userId) {
      return NextResponse.json({
        error: 'Not authenticated',
        message: 'You must be logged in to test user sync'
      }, { status: 401 });
    }

    // 2. Get Clerk user details
    const clerkUser = await currentUser();
    console.log('2. Clerk user:', {
      id: clerkUser?.id,
      email: clerkUser?.emailAddresses[0]?.emailAddress,
      firstName: clerkUser?.firstName,
      lastName: clerkUser?.lastName,
    });

    // 3. Check if user exists in DB
    const existingUser = await prisma.user.findUnique({
      where: { clerkId: session.userId },
    });
    console.log('3. Existing user in DB:', existingUser);

    if (existingUser) {
      return NextResponse.json({
        success: true,
        message: 'User already exists',
        user: existingUser,
      });
    }

    // 4. Create user
    console.log('4. Creating user...');
    const newUser = await prisma.user.create({
      data: {
        clerkId: session.userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser?.firstName || 'Usuario',
        lastName: clerkUser?.lastName || '',
        phone: clerkUser?.phoneNumbers?.[0]?.phoneNumber || null,
        role: 'USER',
      },
    });
    console.log('5. User created:', newUser);

    return NextResponse.json({
      success: true,
      message: 'User created successfully!',
      user: newUser,
    });

  } catch (error: any) {
    console.error('=== ERROR IN TEST ENDPOINT ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);

    return NextResponse.json({
      error: 'Failed to sync user',
      message: error.message,
      code: error.code,
    }, { status: 500 });
  }
}
