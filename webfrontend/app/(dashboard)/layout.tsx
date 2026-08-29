import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/app/components/app-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1 w-full relative">
        <div className="absolute top-4 left-4 z-50">
          <SidebarTrigger />
        </div>
        {children}
      </main>
    </SidebarProvider>
  );
}
