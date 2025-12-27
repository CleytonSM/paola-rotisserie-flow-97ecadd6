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
    Clock,
    SquareMenu,
    Menu,
} from "lucide-react";
import { NavItem } from "./types";
import { PixIcon } from "./components/icons/PixIcon";

export const navigationGroups = {
    overview: {
        label: "Geral",
        items: [
            {
                title: "Dashboard",
                url: "/admin",
                icon: LayoutDashboard,
            },
            {
                title: "Pedidos",
                url: "/admin/orders",
                icon: Clock,
            },
            {
                title: "PDV",
                url: "/admin/pdv",
                icon: ShoppingCart,
            },
        ],
    },
    financial: {
        label: "Financeiro",
        items: [
            {
                title: "Contas a Receber",
                url: "/admin/receivable",
                icon: ArrowUpCircle,
            },
            {
                title: "Histórico de Vendas",
                url: "/admin/sales",
                icon: BookOpen,
            },
            {
                title: "Contas a Pagar",
                url: "/admin/payable",
                icon: ArrowDownCircle,
            },
            {
                title: "Relatórios",
                url: "/admin/reports",
                icon: BarChart3,
                items: [
                    { title: "Geral", url: "/admin/reports" },
                    { title: "Por Produto", url: "/admin/reports/products" },
                    { title: "Por Dia/Hora", url: "/admin/reports/daily" },
                    { title: "Por Pagamento", url: "/admin/reports/payments" },
                    { title: "Por Tipo", url: "/admin/reports/types" },
                ]
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
                    { title: "Clientes", url: "/admin/clients", icon: Users },
                    { title: "Fornecedores", url: "/admin/suppliers", icon: Truck },
                    { title: "Produtos", url: "/admin/products", icon: Package },
                    { title: "Itens", url: "/admin/product-items", icon: Tag },
                ] as NavItem[],
            },
            {
                title: "Configurações",
                icon: Settings,
                items: [
                    { title: "Geral", url: "/admin/settings", icon: Menu },
                    { title: "Maquininhas", url: "/admin/machines", icon: CreditCard },
                    { title: "Chaves Pix", url: "/admin/pix-keys", icon: PixIcon },
                ] as NavItem[],
            },
        ],
    },
};
