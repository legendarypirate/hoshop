'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to baraanii-kod settings by default
    router.replace('/settings/baraanii-kod');
  }, [router]);

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ачааллаж байна...</p>
      </div>
    </div>
  );
}

