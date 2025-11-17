# Debug User Sync Issue

## Current Setup ✅

Your user sync has **3 ways** to create users:

1. **Clerk Webhook** → Creates user when Clerk fires `user.created` event
2. **tRPC Context** → Creates user automatically on first API call (`getOrCreateUser`)
3. **User Sync Hook** → Client-side hook that calls `users.sync` mutation

## Let's Debug Step-by-Step

### Step 1: Check if Clerk keys are set ✅

Your `.env` file shows:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

✅ Keys are present

### Step 2: Test the Database Connection

Run this command to check if users table exists and is accessible:

```bash
npm run db:studio
```

This will open Prisma Studio at http://localhost:5555

Check if:
- The `users` table exists
- The table is empty

### Step 3: Check Browser Console Logs

When you log in with Clerk, open browser console (F12) and look for:

```
[User Sync Hook] Triggering sync for user: user_xxxxx
[User Sync Hook] User synced successfully: xxx xxx@email.com
```

Or errors like:
```
[User Sync Hook] Error syncing user: ...
```

### Step 4: Check Server Console Logs

In your terminal where `npm run dev` is running, look for:

```
[tRPC Context] User not found, fetching from Clerk...
[tRPC Context] Creating user in database: email@example.com
[tRPC Context] User created successfully: cuid...
```

Or:
```
[User Sync] Attempting to sync user: user_xxxxx
[User Sync] User created successfully: xxx
```

### Step 5: Manual Test via tRPC

Let's create a test page to manually trigger user sync.

## Quick Fix - Test User Creation Manually

Run this in your dev console (browser):

```javascript
// Check if you're logged in
console.log('Clerk user:', window.Clerk.user);

// Try to fetch your profile (will trigger sync)
fetch('/api/trpc/v1.users.getMe', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
}).then(r => r.json()).then(data => console.log('User sync result:', data));
```

---

## Most Likely Issues & Solutions

### Issue 1: tRPC Context Sync Failing

**Check:** Look for errors in server console when you navigate to any page after login.

**Fix:** The `getOrCreateUser` function in tRPC context should automatically create the user.

Let's verify the tRPC context is being called. Add this to any protected page to force a tRPC call.

### Issue 2: Hook Not Running

**Check:** Browser console should show `[User Sync Hook] Triggering sync for user: ...`

**Fix:** Make sure you're on a page that's inside the `UserSyncProvider` (which should be all pages).

### Issue 3: Clerk User Object Missing Data

**Check:** In browser console:
```javascript
console.log(window.Clerk.user)
```

Look for:
- `emailAddresses[0].emailAddress`
- `firstName`
- `lastName`

**Fix:** If these are missing, the user sync might fail. Check Clerk dashboard settings.

---

## Immediate Debug Actions

### 1. Add Logging to Check if Hook Runs

Open browser after login and check console. You should see:
```
[User Sync Hook] Triggering sync for user: user_2...
```

If you DON'T see this, the hook isn't running.

### 2. Check Database

```bash
npm run db:studio
```

Navigate to `users` table. Check if it's empty.

### 3. Test Direct Database Insert

Let's create a test user directly to verify database works:

```bash
# Open Node REPL
node

# Then paste:
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.user.create({
  data: {
    clerkId: 'test_user_123',
    email: 'test@test.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'USER'
  }
}).then(user => {
  console.log('Test user created:', user);
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
```

If this works, database connection is fine.

---

## Quick Diagnostic Script

Create this file to test everything:

**File: `scripts/test-user-sync.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

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
    });
  }

  // 4. Test Clerk connection
  console.log('\n3️⃣ Testing Clerk connection...');
  try {
    const clerkUsers = await (await clerkClient()).users.getUserList({ limit: 5 });
    console.log(`   ✅ Clerk connected - ${clerkUsers.totalCount} users in Clerk`);

    if (clerkUsers.data.length > 0) {
      console.log('\n   Clerk users:');
      clerkUsers.data.forEach(user => {
        console.log(`   - ${user.emailAddresses[0]?.emailAddress} - ID: ${user.id}`);
      });
    }
  } catch (error: any) {
    console.error('   ❌ Clerk connection failed:', error.message);
  }

  await prisma.$disconnect();
}

testUserSync();
```

Run it with:
```bash
npx tsx scripts/test-user-sync.ts
```

---

## What to Check Next

1. **Browser console** - Any errors when logging in?
2. **Server console** - Any errors in `npm run dev` terminal?
3. **Network tab** - Check if `/api/trpc/v1.users.sync` is being called
4. **Prisma Studio** - Is users table empty?

Let me know what you find, and I'll help fix it! 🚀
