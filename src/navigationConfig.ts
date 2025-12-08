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
    Box,
    Tag,
    ShoppingCart,
} from "lucide-react";
import { NavItem } from "./types";
import { PixIcon } from "./components/icons/PixIcon";

export const navigationGroups = {
    overview: {
        label: "Geral",
        items: [
            {
                title: "Dashboard",
                url: "/",
                icon: LayoutDashboard,
            },
            {
                title: "PDV",
                url: "/pdv",
                icon: ShoppingCart,
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
                title: "Histórico de Vendas",
                url: "/sales",
                icon: BookOpen,
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
                    { title: "Produtos", url: "/products", icon: Package },
                    { title: "Itens", url: "/product-items", icon: Tag },
                ] as NavItem[],
            },
            {
                title: "Configurações",
                icon: Settings,
                items: [
                    { title: "Maquininhas", url: "/machines", icon: CreditCard },
                    { title: "Chaves Pix", url: "/pix-keys", icon: PixIcon },
                ] as NavItem[],
            },
        ],
    },
};
