import { useLocation, Link } from "react-router-dom";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Fragment } from "react";

const routeNameMap: Record<string, string> = {
    "": "Home",
    "admin": "Dashboard",
    "dashboard": "Dashboard",
    "orders": "Pedidos",
    "pdv": "PDV",
    "payment": "Pagamento",
    "success": "Sucesso",
    "payable": "Contas a Pagar",
    "sales": "Histórico de Vendas",
    "receivable": "Contas a Receber",
    "reports": "Relatórios",
    "suppliers": "Fornecedores",
    "products": "Produtos",
    "product-items": "Itens",
    "clients": "Clientes",
    "machines": "Maquininhas",
    "pix-keys": "Chaves Pix",
    "auth": "Autenticação",
    "settings": "Configurações",
    "daily": "Diário",
    "payments": "Pagamentos",
    "types": "Tipos",
};

export function AppBreadcrumb() {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith("/admin");
    const pathnames = location.pathname.split("/").filter((x) => x && x !== "admin");

    return (
        <Breadcrumb className="mt-4">
            <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                        <Link to={isAdmin ? "/admin" : "/"}>{isAdmin ? "Dashboard" : "Home"}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
                {pathnames.map((value, index) => {
                    const to = `${isAdmin ? "/admin" : ""}/${pathnames.slice(0, index + 1).join("/")}`;
                    const isLast = index === pathnames.length - 1;
                    const name = routeNameMap[value] || value;

                    return (
                        <Fragment key={to}>
                            <BreadcrumbSeparator />
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage>{name}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link to={to}>{name}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
