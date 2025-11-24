import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <SidebarProvider>
            <div className="flex min-h-screen w-full bg-background">
                <AppSidebar />
                <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
                    {/* Mobile Header */}
                    <div className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b border-border bg-background/95 px-6 backdrop-blur-sm md:hidden rounded-xl">
                        <SidebarTrigger />
                        <img
                            src="/pg-rotisserie-banner.png"
                            alt="Paola Gonçalves"
                            className="h-10 w-auto object-contain"
                        />
                    </div>

                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto p-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}