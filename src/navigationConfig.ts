// navigationConfig.ts
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
    Database,
    Scale,
    BookOpen,
} from "lucide-react";
import { NavItem } from "./types";

export const navigationGroups = {
    overview: {
        label: "Visão Geral",
        items: [
            {
                title: "Dashboard",
                url: "/",
                icon: LayoutDashboard,
            },
        ],
    },
    financial: {
        label: "Financeiro",
        items: [
            {
                title: "Contas a Receber",
                url: "/receivable",
                icon: ArrowUpCircle,
            },
            {
                title: "Contas a Pagar",
                url: "/payable",
                icon: ArrowDownCircle,
            },
            {
                title: "Relatórios",
                url: "/reports",
                icon: BarChart3,
            },
        ],
    },
    management: {
        label: "Gerenciamento",
        groups: [
            {
                title: "Cadastros",
                icon: Database,
                items: [
                    { title: "Clientes", url: "/clients", icon: Users },
                    { title: "Fornecedores", url: "/suppliers", icon: Truck },
                    { title: "Catálogo", url: "/products", icon: BookOpen },
                    { title: "Itens", url: "/product-items", icon: Scale },
                ] as NavItem[],
            },
            {
                title: "Configurações",
                icon: Settings,
                items: [
                    { title: "Maquininhas", url: "/machines", icon: CreditCard },
                    { title: "Geral (Em breve)", url: "#", icon: Settings, disabled: true },
                ] as NavItem[],
            },
        ],
    },
};