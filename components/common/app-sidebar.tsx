"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DashboardIcon,
  BuildingIcon,
  PackageIcon,
  UsersIcon,
  BriefcaseIcon,
} from "@/components/icons/folder-icons";

import { useSession } from "next-auth/react";

const sidebarLinks = [
  { id: "dashboard", title: "Dashboard", href: "/", icon: DashboardIcon },
  {
    id: "suppliers",
    title: "Suppliers",
    href: "/suppliers",
    icon: BuildingIcon,
  },
  {
    id: "products",
    title: "Product Types",
    href: "/products",
    icon: PackageIcon,
  },
  { id: "managers", title: "Managers", href: "/managers", icon: UsersIcon },
  { id: "jobs", title: "Jobs", href: "/jobs", icon: BriefcaseIcon },
];

export function AppSidebar() {
  const pathname = usePathname();

  const { data: session } = useSession();

  const links = [
    ...sidebarLinks,
    // Only show Users link for superadmin
    ...(session?.user && (session.user as any).role === "superadmin"
      ? [{ id: "users", title: "Users", href: "/users", icon: UsersIcon }]
      : []),
  ];

  return (
    <Sidebar className="border-r border-gray-800">
      <SidebarHeader className="border-b border-gray-800 px-6 h-[60px] flex justify-center">
        <h2 className="text-lg font-semibold uppercase flex items-center gap-2 text-primary italic">
          <Image src="/logo.svg" alt="logo" width={38} height={20} />
          BOQ Guard
        </h2>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <SidebarMenuItem key={link.id}>
                  <SidebarMenuButton
                    asChild
                    className={`w-full group relative h-10 px-4 rounded transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-white"
                        : "hover:bg-gray-800/50 text-gray-300"
                    }`}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-4 w-full"
                    >
                      <div className="shrink-0">
                        <Icon />
                      </div>
                      <span
                        className={`text-base font-medium ${
                          isActive ? "text-white" : "group-hover:text-white"
                        }`}
                      >
                        {link.title}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-gray-800 p-3">
        <div className="flex items-center gap-3 px-4 py-3 rounded bg-gray-800/50 hover:bg-gray-800 transition-colors cursor-pointer">
          <div className="flex-1 min-w-0 flex items-center gap-3">
            <p className="text-sm font-medium text-white truncate">
              Created by
            </p>
            <p className="text-xs text-gray-400 truncate">Cautious N.</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
