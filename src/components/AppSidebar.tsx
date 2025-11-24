import { Sidebar, SidebarContent, useSidebar } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import { SidebarHeader } from "./sidebar/SidebarHeader";
import { ToggleButton } from "./sidebar/ToggleButton";
import { NavigationSections } from "./sidebar/NavigationSections";
import { SidebarFooter } from "./sidebar/SidebarFooter";

export function AppSidebar() {
    const location = useLocation();
    const { state, toggleSidebar } = useSidebar();

    const isActive = (path: string) => location.pathname === path;
    const isExpanded = state === "expanded";

    return (
        <Sidebar collapsible="icon" variant="floating" className="border-r-0 bg-background">
            <SidebarHeader isExpanded={isExpanded} />

            <SidebarContent className="gap-0">
                {/* <ToggleButton isExpanded={isExpanded} onToggle={toggleSidebar} /> */}
                <NavigationSections isActive={isActive} />
            </SidebarContent>

            <SidebarFooter />
        </Sidebar>
    );
}