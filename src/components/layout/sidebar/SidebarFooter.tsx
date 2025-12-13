import {
    SidebarFooter as SidebarFooterUI,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { signOut } from "@/services/auth";

export function SidebarFooter() {
    const navigate = useNavigate();

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast.error("Erro ao sair");
        } else {
            toast.success("Logout realizado");
            navigate("/auth");
        }
    };

    return (
        <SidebarFooterUI className="border-t border-border/40 p-2">
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton
                        onClick={handleSignOut}
                        tooltip="Sair"
                        className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group-data-[collapsible=icon]:justify-center"
                    >
                        <LogOut />
                        <span className="group-data-[collapsible=icon]:hidden">Sair do Sistema</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarFooterUI>
    );
}