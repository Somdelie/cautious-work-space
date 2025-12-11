"use client";
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
import Link from "next/link";
import { usePathname } from "next/navigation";

const sidebarLinks = [
  {
    id: "dashboard",
    title: "Dashboard",
    href: "/",
    icon: DashboardIcon,
  },
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
  {
    id: "managers",
    title: "Managers",
    href: "/managers",
    icon: UsersIcon,
  },
  {
    id: "jobs",
    title: "Jobs",
    href: "/jobs",
    icon: BriefcaseIcon,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar className="border-r border-gray-800">
      <SidebarHeader className="border-b border-gray-800 px-6 h-[60px]">
        <h2 className="text-lg font-semibold text-white uppercase">
          BOQ Guard
        </h2>
      </SidebarHeader>

      <SidebarContent className="py-4">
        <SidebarGroup>
          <SidebarMenu className="space-y-1">
            {sidebarLinks?.map((link) => {
              const Icon = link.icon;
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname?.startsWith(link.href));

              return (
                <SidebarMenuItem key={link.id}>
                  <SidebarMenuButton
                    asChild
                    className={`
                      w-full group relative h-10 px-4 rounded transition-all duration-200
                      ${
                        isActive
                          ? "bg-primary text-white"
                          : "hover:bg-gray-800/50 text-gray-300"
                      }
                    `}
                  >
                    <Link
                      href={link.href}
                      className="flex items-center gap-4 w-full"
                    >
                      <div className="shrink-0">
                        <Icon />
                      </div>
                      <span
                        className={`
                        text-base font-medium
                        ${isActive ? "text-white" : "group-hover:text-white"}
                      `}
                      >
                        {link?.title}
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
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
            <span className="text-white font-semibold text-sm">U</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">User Name</p>
            <p className="text-xs text-gray-400 truncate">user@example.com</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
