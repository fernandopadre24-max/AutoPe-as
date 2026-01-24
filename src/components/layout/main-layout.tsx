'use client';

import type { ReactNode } from 'react';
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import { useSidebar } from '@/components/ui/sidebar';

function MainLayoutContent({ children }: { children: ReactNode }) {
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <>
      <Sidebar>
        <AppSidebar />
      </Sidebar>
      <SidebarInset className="p-4 pt-16 md:p-6 md:pt-20 lg:p-8 lg:pt-24">
        {!isMobile && (
          <div 
            className="fixed top-4 z-50 transition-all duration-200 ease-linear group-data-[collapsible=offcanvas]:left-0 group-data-[state=expanded]:left-[16rem] group-data-[state=collapsed]:left-[3rem]"
          >
            <SidebarTrigger className="md:flex" />
          </div>
        )}
        {children}
      </SidebarInset>
    </>
  );
}

export function MainLayout({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  return (
    <SidebarProvider
      defaultOpen={!isMobile}
      open={isMobile ? false : undefined}
    >
      <MainLayoutContent>{children}</MainLayoutContent>
    </SidebarProvider>
  );
}
