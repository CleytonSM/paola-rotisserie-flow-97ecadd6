import {
    SidebarGroup,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { Minimize2, Maximize2 } from "lucide-react";
interface ToggleButtonProps {
    isExpanded: boolean;
    onToggle: () => void;
}
export function ToggleButton({ isExpanded, onToggle }: ToggleButtonProps) {
    return (
        <SidebarGroup className="py-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={onToggle}
                        tooltip={isExpanded ? "Recolher Menu" : "Expandir Menu"}
                        size="lg"
                        className="rounded-xl text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground transition-colors group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:!p-2"
                    >
                        {isExpanded ? (
                            <Minimize2 />
                        ) : (
                            <Maximize2 />
                        )}
                        <span className="group-data-[collapsible=icon]:hidden">Recolher Menu</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarGroup>
    );
}