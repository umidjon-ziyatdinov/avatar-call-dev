// app/layout.tsx
import { cookies } from 'next/headers';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '../(auth)/auth';
import Script from 'next/script';
import { ChatHeaderServer } from '@/components/chat-header-server';

import { SplashWrapper } from '@/components/SplashScreenWrapper';
import { AdminSidebar } from '@/components/admin-sidebar';

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
      <SplashWrapper>
        <SidebarProvider defaultOpen={!isCollapsed}>
          <AdminSidebar user={session?.user} />
          <SidebarInset className='w-full h-svh'>
            <ChatHeaderServer />
            <main className="flex px-4 bg-background pb-4 md:pb-6 gap-2  size-full max-w-full">
              {children}
            </main>
          </SidebarInset>
        </SidebarProvider>
      </SplashWrapper>
    </>
  );
}