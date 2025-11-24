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
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
    LayoutDashboard,
    ArrowDownCircle,
    ArrowUpCircle,
    BarChart3,
    Users,
    Truck,
    Package,
    Settings,
    CreditCard,
    LogOut
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { signOut } from "@/services/auth";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

export function AppSidebar() {
    const location = useLocation();

    const handleSignOut = async () => {
        const { error } = await signOut();
        if (error) {
            toast.error("Erro ao sair");
        } else {
            window.location.href = "/auth";
        }
    };

    const isActive = (path: string) => location.pathname === path;

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="h-16 flex items-center justify-center border-b border-border/50">
                {/* You might need a smaller version of your logo for the collapsed state */}
                <div className="flex items-center gap-2 px-2 font-display font-bold text-xl text-primary overflow-hidden">
                    <span className="truncate">Paola G.</span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                {/* Dashboard */}
                <SidebarGroup>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/")} tooltip="Dashboard">
                                <Link to="/">
                                    <LayoutDashboard />
                                    <span>Dashboard</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Financeiro */}
                <SidebarGroup>
                    <SidebarGroupLabel>Financeiro</SidebarGroupLabel>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/receivable")} tooltip="Entradas">
                                <Link to="/receivable">
                                    <ArrowUpCircle className="text-secondary" />
                                    <span>Contas a Receber</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/payable")} tooltip="Saídas">
                                <Link to="/payable">
                                    <ArrowDownCircle className="text-destructive" />
                                    <span>Contas a Pagar</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                        <SidebarMenuItem>
                            <SidebarMenuButton asChild isActive={isActive("/reports")} tooltip="Relatórios">
                                <Link to="/reports">
                                    <BarChart3 />
                                    <span>Relatórios</span>
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarGroup>

                {/* Cadastros (Collapsible Group) */}
                <Collapsible asChild defaultOpen className="group/collapsible">
                    <SidebarMenuItem>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center transition-all [&[data-state=open]>svg]:rotate-90">
                                Cadastros
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive("/clients")}>
                                        <Link to="/clients">
                                            <Users className="h-4 w-4 mr-2" />
                                            <span>Clientes</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton asChild isActive={isActive("/suppliers")}>
                                        <Link to="/suppliers">
                                            <Truck className="h-4 w-4 mr-2" />
                                            <span>Fornecedores</span>
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                {/* Future Items */}
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton className="opacity-50 cursor-not-allowed">
                                        <Package className="h-4 w-4 mr-2" />
                                        <span>Produtos (Em breve)</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>

                {/* Configurações (Collapsible Group) */}
                <Collapsible asChild className="group/collapsible">
                    <SidebarMenuItem>
                        <SidebarGroupLabel asChild>
                            <CollapsibleTrigger className="flex w-full items-center transition-all [&[data-state=open]>svg]:rotate-90">
                                Configurações
                                <ChevronRight className="ml-auto h-4 w-4 transition-transform" />
                            </CollapsibleTrigger>
                        </SidebarGroupLabel>
                        <CollapsibleContent>
                            <SidebarMenuSub>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton className="opacity-50 cursor-not-allowed">
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        <span>Maquininhas (Em breve)</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                                <SidebarMenuSubItem>
                                    <SidebarMenuSubButton className="opacity-50 cursor-not-allowed">
                                        <Settings className="h-4 w-4 mr-2" />
                                        <span>Geral (Em breve)</span>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            </SidebarMenuSub>
                        </CollapsibleContent>
                    </SidebarMenuItem>
                </Collapsible>
            </SidebarContent>

            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleSignOut} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                            <LogOut />
                            <span>Sair</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}