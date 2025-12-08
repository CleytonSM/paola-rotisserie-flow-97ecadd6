import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { AppSidebar } from "./AppSidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
    return (
        <SidebarProvider>
            <div className="flex h-screen w-full overflow-hidden bg-background">
                <AppSidebar />
                <main className="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
                    <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background px-4 backdrop-blur-md md:hidden transition-[width,height] ease-linear">
                        <SidebarTrigger className="-ml-1 h-10 w-10" />
                        <Separator orientation="vertical" className="mr-2 h-6 bg-border/60" />
                        <img
                            src="/pg-rotisserie-banner.png"
                            alt="Paola Gonçalves"
                            className="h-10 w-auto object-contain rounded-lg"
                        />
                    </header>

                    {/* Page Content */}
                    <div className="flex-1 overflow-y-auto p-0">
                        <Outlet />
                    </div>
                </main>
            </div>
        </SidebarProvider>
    );
}