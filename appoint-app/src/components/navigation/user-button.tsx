'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function UserNavButton() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/sign-in">
          <Button variant="ghost">Iniciar Sesión</Button>
        </Link>
        <Link href="/sign-up">
          <Button>Registrarse</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: 'h-10 w-10',
          },
        }}
        userProfileMode="navigation"
        userProfileUrl="/panel/perfil"
      />
    </div>
  );
}

