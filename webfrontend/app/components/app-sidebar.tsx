"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  LayoutDashboard,
  Users,
  UserPlus,
  ChartNoAxesCombined,
  Bell,
  LogOut,
  ChevronUp,
  AlertTriangle,
  Map,
  Newspaper,
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
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Rescue Team",
    url: "/rescue-team",
    icon: Users,
  },
  {
    title: "Team Registration",
    url: "/team-registration",
    icon: UserPlus,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: ChartNoAxesCombined,
  },
  {
    title: "Broadcast Alerts",
    url: "/notifications",
    icon: Bell,
  },
  {
    title: "Disaster Monitor",
    url: "/disaster",
    icon: AlertTriangle,
  },
  {
    title: "News Feed",
    url: "/news",
    icon: Newspaper,
  },
  {
    title: "Resources Map",
    url: "/resources",
    icon: Map,
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-slate-200 bg-white transition-all duration-300"
    >
      <SidebarHeader className="border-b border-slate-100">
        <div className="relative flex h-16 items-center gap-3 px-4 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 transition-transform duration-300 hover:scale-105 hover:rotate-3 cursor-pointer">
            <Image
              src="/assets/logo.png"
              alt="Aasha Logo"
              width={40}
              height={40}
              className="h-full w-full object-cover"
              priority
            />
          </div>

          <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden transition-all duration-300">
            <span className="truncate text-base font-bold tracking-tight text-slate-900 hover:text-red-650 transition-colors duration-200 cursor-default">
              Aasha
            </span>
            <span className="truncate text-xs text-slate-500 font-semibold cursor-default">
              Management Portal
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 select-none">
            Main Menu
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
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
                        group h-11 rounded-xl px-3 transition-all duration-300 active:scale-[0.98]
                        ${
                          isActive
                            ? "bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:text-white"
                            : "text-slate-650 hover:bg-slate-100 hover:text-slate-900 hover:translate-x-1"
                        }
                      `}
                    >
                      <item.icon 
                        className={`h-[18px] w-[18px] transition-transform duration-300 ease-out 
                          ${isActive ? "scale-105" : "group-hover:scale-110 group-hover:rotate-3"}`} 
                      />
                      <span className="font-semibold text-sm transition-colors duration-200">
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-100 p-2 space-y-1.5">
        <SidebarMenu className="gap-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="group h-14 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all duration-300"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white transition-transform duration-300 group-hover:scale-105 group-hover:rotate-6">
                A
              </div>

              <div className="flex flex-1 flex-col overflow-hidden text-left group-data-[collapsible=icon]:hidden transition-all duration-300">
                <span className="truncate text-sm font-bold text-slate-800 group-hover:text-slate-900">
                  AASHA
                </span>
                <span className="truncate text-xs font-semibold text-slate-400 group-hover:text-slate-500">
                  Administrator
                </span>
              </div>

              <ChevronUp className="ml-auto h-4 w-4 text-slate-400 transition-transform duration-300 group-hover:-translate-y-0.5 group-data-[collapsible=icon]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              render={<Link href="/logout" />}
              className="group h-11 rounded-xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-300 active:scale-[0.98] hover:translate-x-1"
            >
              <LogOut className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-105 group-hover:-translate-x-0.5" />
              <span className="font-semibold text-sm">Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
