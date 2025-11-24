import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <main className="flex-1 flex flex-col overflow-hidden">
                    {/* Mobile Trigger */}
                    <div className="p-4 md:hidden border-b flex items-center gap-2">
                        <SidebarTrigger />
                        <span className="font-display font-bold text-lg">Paola Gonçalves</span>
                    </div>

                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}