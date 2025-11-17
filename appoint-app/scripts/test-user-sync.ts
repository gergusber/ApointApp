import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testUserSync() {
  console.log('🔍 Testing User Sync System...\n');

  // 1. Test database connection
  console.log('1️⃣ Testing database connection...');
  try {
    await prisma.$connect();
    console.log('   ✅ Database connected');
  } catch (error) {
    console.error('   ❌ Database connection failed:', error);
    return;
  }

  // 2. Check users table
  console.log('\n2️⃣ Checking users table...');
  const userCount = await prisma.user.count();
  console.log(`   📊 Users in database: ${userCount}`);

  // 3. List all users
  if (userCount > 0) {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        clerkId: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });
    console.log('\n   Users:');
    users.forEach(user => {
      console.log(`   - ${user.email} (${user.role}) - Clerk ID: ${user.clerkId}`);
      console.log(`     Created: ${user.createdAt}`);
    });
  } else {
    console.log('   ⚠️  No users found in database');
    console.log('   This means user sync is not working');
  }

  // 4. Check if Clerk env vars are set
  console.log('\n3️⃣ Checking environment variables...');
  const clerkPublicKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;

  if (clerkPublicKey && clerkPublicKey.startsWith('pk_')) {
    console.log('   ✅ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is set');
  } else {
    console.log('   ❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing or invalid');
  }

  if (clerkSecretKey && clerkSecretKey.startsWith('sk_')) {
    console.log('   ✅ CLERK_SECRET_KEY is set');
  } else {
    console.log('   ❌ CLERK_SECRET_KEY is missing or invalid');
  }

  // 5. Test creating a dummy user
  console.log('\n4️⃣ Testing user creation...');
  try {
    const testUser = await prisma.user.create({
      data: {
        clerkId: `test_${Date.now()}`,
        email: `test+${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        role: 'USER',
      },
    });
    console.log('   ✅ Test user created successfully:', testUser.email);

    // Clean up
    await prisma.user.delete({
      where: { id: testUser.id },
    });
    console.log('   ✅ Test user deleted (cleanup)');
  } catch (error: any) {
    console.error('   ❌ Error creating test user:', error.message);
  }

  console.log('\n✅ Diagnostics complete!');
  console.log('\nNext steps:');
  console.log('1. Start your dev server: npm run dev');
  console.log('2. Open browser console (F12)');
  console.log('3. Sign in with Clerk');
  console.log('4. Look for "[User Sync Hook]" messages in console');
  console.log('5. Check server terminal for "[User Sync]" messages');

  await prisma.$disconnect();
}

testUserSync().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
