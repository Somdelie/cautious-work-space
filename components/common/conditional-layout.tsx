"use client";

import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/common/app-sidebar";
import { ModeToggle } from "@/components/common/mode-tooggler";
import { AppUserButton } from "@/components/common/user-button";
import NotificationButton from "./NotificationButton";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isSignInPage = pathname?.startsWith("/sign-in");

  if (isSignInPage) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarMain>{children}</SidebarMain>
    </SidebarProvider>
  );
}

function SidebarMain({ children }: { children: React.ReactNode }) {
  const { open, isMobile } = useSidebar();
  // Sidebar width is 16rem (256px) on desktop, 0 when collapsed, 18rem on mobile
  // We'll use max-w-7xl when sidebar is collapsed or on mobile, otherwise subtract sidebar width
  // You can adjust the value as needed
  let maxWidthClass = "max-w-7xl";
  if (!isMobile && open) {
    maxWidthClass = "max-w-[calc(100vw-16rem)]";
  }
  return (
    <main className="w-full flex flex-col">
      <div className="flex items-center bg-card/90 dark:bg-slate-900/90 justify-between h-[60px] border-b sticky top-0 z-50">
        <SidebarTrigger />
        <nav className="flex items-center pr-3 text-white ">
          <NotificationButton />
          <ModeToggle />
          <AppUserButton />
        </nav>
      </div>
      <div className={`px-3 w-full mx-auto py-2 ${maxWidthClass}`}>
        {children}
      </div>
    </main>
  );
}
