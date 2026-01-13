'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from '@/components/sidebar';

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    checkAuth();
  }, [pathname]);

  const checkAuth = async () => {
    // Don't check auth on login page
    if (pathname === '/login') {
      setIsAuthenticated(true);
      return;
    }

    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      
      if (data.authenticated) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        router.push('/login');
      }
    } catch (error) {
      setIsAuthenticated(false);
      router.push('/login');
    }
  };

  // Show nothing while checking auth (except on login page)
  if (isAuthenticated === null && pathname !== '/login') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Ачааллаж байна...</div>
      </div>
    );
  }

  // Show login page without sidebar
  if (pathname === '/login') {
    return <>{children}</>;
  }

  // Show admin interface with sidebar
  if (isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    );
  }

  return null;
}

