'use client';

import { useUserSync } from '@/hooks/use-user-sync';

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  // This hook ensures user is synced to database after sign-up/sign-in
  useUserSync();
  
  return <>{children}</>;
}

