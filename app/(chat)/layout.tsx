import { cookies } from 'next/headers';

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AssumptionsPanel } from '@/components/assumptions-panel';
import { DetailsPanel } from '@/components/details-panel';
import { BaselinePanel } from '@/components/baseline-panel';
import { PanelProvider } from '@/components/panel-context';
import { RightPanel } from '@/components/right-panel';

import { auth } from '../(auth)/auth';
import Script from 'next/script';

export const experimental_ppr = true;

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, cookieStore] = await Promise.all([auth(), cookies()]);
  const isCollapsed = cookieStore.get('sidebar:state')?.value !== 'true';

  return (
    <>
      <Script
        src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
        strategy="beforeInteractive"
      />
      <SidebarProvider defaultOpen={!isCollapsed}>
        <PanelProvider>
          <div className="flex size-full">
            <AppSidebar user={session?.user} />
            <div className="flex-1 min-w-0">
              <SidebarInset>
                <div className="flex h-full">
                  <div className="flex-1 min-w-0">
                    {children}
                  </div>
                  <RightPanel>
                    <div className="absolute inset-y-0 flex flex-col">
                      <AssumptionsPanel />
                      <DetailsPanel />
                      <BaselinePanel />
                    </div>
                  </RightPanel>
                </div>
              </SidebarInset>
            </div>
          </div>
        </PanelProvider>
      </SidebarProvider>
    </>
  );
}
