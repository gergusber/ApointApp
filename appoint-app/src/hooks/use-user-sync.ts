'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import { trpc } from '@/lib/trpc/client';

/**
 * Hook to ensure user is synced to database after sign-up/sign-in
 * This triggers a tRPC call which will create the user if needed
 */
export function useUserSync() {
  const { isSignedIn, user, isLoaded } = useUser();
  const syncedRef = useRef<string | null>(null);
  const hasSyncedRef = useRef<boolean>(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    // Wait for Clerk to finish loading
    if (!isLoaded) return;

    // Only sync if user is signed in and we haven't synced this user yet
    if (isSignedIn && user && syncedRef.current !== user.id && !hasSyncedRef.current) {
      console.log('[User Sync Hook] Triggering sync for user:', user.id);
      syncedRef.current = user.id;
      hasSyncedRef.current = true;

      // Use the mutation from utils to avoid dependency issues
      utils.client.v1.users.sync.mutate(undefined)
        .then((dbUser) => {
          console.log('[User Sync Hook] User synced successfully:', dbUser.id, dbUser.email);
          // Mark as successfully synced
          hasSyncedRef.current = true;
        })
        .catch((error) => {
          console.error('[User Sync Hook] Error syncing user:', error);
          // Reset flags to allow retry
          syncedRef.current = null;
          hasSyncedRef.current = false;
        });
    } else if (!isSignedIn) {
      // Reset flags when user signs out
      syncedRef.current = null;
      hasSyncedRef.current = false;
    }
    // DO NOT include mutation in dependencies - this prevents infinite loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, user?.id]);
}

