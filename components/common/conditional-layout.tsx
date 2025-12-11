"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";
import { ModeToggle } from "@/components/common/mode-tooggler";
import { AppUserButton } from "@/components/common/user-button";

export function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSignInPage = pathname?.startsWith("/sign-in");

  if (isSignInPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="w-full">
        <div className="flex items-center dark:bg-slate-900/80 justify-between h-[60px] border-b">
          <SidebarTrigger />
          <nav className="flex items-center gap-3 px-4 text-white">
            <ModeToggle />
            <AppUserButton />
          </nav>
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}

