'use client';

import { MainLayout } from '@/components/layout/main-layout';
import { Toaster } from '@/components/ui/toaster';
import { DataProvider, useData } from '@/lib/data';
import { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { useRouter, usePathname } from 'next/navigation';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { APIErrorHandler } from '@/lib/error-handler';

function AppDynamicTitle() {
  const { config } = useData();

  useEffect(() => {
    if (config.storeName) {
      document.title = config.storeName;
    } else {
      document.title = 'Fashion Store';
    }
  }, [config.storeName]);

  return null;
}

function PDVLayout({ children }: { children: React.ReactNode }) {
    const { authenticatedEmployee } = useData();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if(pathname === '/pdv' && !authenticatedEmployee) {
            // router.push('/');
        }
    }, [authenticatedEmployee, router, pathname]);

    return <>{children}</>;
}

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  const pathname = usePathname();
  const isPdvPage = pathname === '/pdv';
  const LayoutComponent = isPdvPage ? PDVLayout : MainLayout;

  return (
    <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
    >
      <ErrorBoundary
        onError={(error, errorInfo) => {
          // Log to error reporting service in production
          console.error('Application Error:', error, errorInfo);
        }}
      >
        <DataProvider>
          <APIErrorHandler />
          <AppDynamicTitle />
          <LayoutComponent>{children}</LayoutComponent>
        </DataProvider>
      </ErrorBoundary>
      <Toaster />
    </ThemeProvider>
  );
}