
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  ChartNoAxesCombined,
  Settings,
  LogOut,
  ChevronUp,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "People",
    url: "/people",
    icon: Users,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: ChartNoAxesCombined,
  },
];

const bottomItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-white"
    >
      {/* ───────────────── Header ───────────────── */}
      <SidebarHeader className="border-b border-slate-100">
  <div className="relative flex h-16 items-center gap-3 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">

    <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
      <Image
        src="/assets/logo.png"
        alt="Aasha Logo"
        width={40}
        height={40}
        className="h-full w-full object-cover"
        priority
      />
    </div>

    <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
      <span className="truncate text-base font-bold tracking-tight text-slate-900">
        Aasha
      </span>
      <span className="truncate text-xs text-slate-500">
        Management Portal
      </span>
    </div>
  </div>
</SidebarHeader>

 
      {/* ───────────────── Content ───────────────── */}
      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Main Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {menuItems.map((item) => {
                const isActive =
                  pathname === item.url ||
                  pathname.startsWith(`${item.url}/`);

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      render={<Link href={item.url} />}
                      tooltip={item.title}
                      isActive={isActive}
                      className={`
                        h-11 rounded-xl px-3 transition-all duration-200
                        ${
                          isActive
                            ? "bg-slate-900 text-white shadow-sm hover:bg-slate-800 hover:text-white"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                        }
                      `}
                    >
                      <item.icon className="h-[18px] w-[18px]" />
                      <span className="font-medium">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Settings */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            System
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1">
              {bottomItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    render={<Link href={item.url} />}
                    tooltip={item.title}
                    className="h-11 rounded-xl px-3 text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    <span className="font-medium">
                      {item.title}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ───────────────── Footer ───────────────── */}
      <SidebarFooter className="border-t border-slate-100 p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="h-14 rounded-xl hover:bg-slate-100"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                S
              </div>

              <div className="flex flex-1 flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-semibold text-slate-900">
                  Suraj
                </span>

                <span className="truncate text-xs text-slate-500">
                  Administrator
                </span>
              </div>

              <ChevronUp className="ml-auto h-4 w-4 text-slate-400" />
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/logout" />}
              className="h-10 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-[18px] w-[18px]" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

