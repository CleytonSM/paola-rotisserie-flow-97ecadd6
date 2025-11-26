// components/products/ProductsTable.tsx
import { useMemo } from "react";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { ChevronDown, Loader2, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DataTableAction } from "@/components/ui/data-table-action";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import type { ProductCatalog } from "@/components/ui/products/types";
import {
    formatPrice,
    formatShelfLife,
    formatDiscount,
} from "@/components/ui/products/utils";
import { getStatusVariant } from "@/utils/status";
import { StockSummary } from "@/services/database";

interface ProductsTableProps {
    products: ProductCatalog[];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    stockSummaries: Record<string, StockSummary>;
    loadingStock: Record<string, boolean>;
    isLoadingAll: boolean;
    onEdit: (product: ProductCatalog) => void;
    onDelete: (id: string) => void;
}

export function ProductsTable({
    products,
    loading,
    searchTerm,
    onSearchChange,
    stockSummaries,
    loadingStock,
    isLoadingAll,
    onEdit,
    onDelete,
}: ProductsTableProps) {
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                product.name.toLowerCase().includes(searchLower) ||
                (product.internal_code && product.internal_code.toLowerCase().includes(searchLower)) ||
                (product.catalog_barcode && product.catalog_barcode.toString().includes(searchLower))
            );
        });
    }, [products, searchTerm]);

    const columns: ColumnDef<ProductCatalog>[] = [
        {
            header: "Produto",
            cell: (product) => (
                <div>
                    <div className="font-medium text-foreground">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {product.internal_code || "Sem código"}
                    </div>
                </div>
            ),
        },
        {
            header: "Preço Base",
            cell: (product) => (
                <span className="font-medium text-foreground">
                    {formatPrice(product.base_price)} / {product.unit_type}
                </span>
            ),
        },
        {
            header: "Tempo de Validade",
            cell: (product) => (
                <span className="text-muted-foreground">
                    {formatShelfLife(product.shelf_life_days)}
                </span>
            ),
        },
        {
            header: "Desconto Padrão",
            cell: (product) => (
                <span className="text-muted-foreground">
                    {formatDiscount(product.default_discount)}
                </span>
            ),
        },
        {
            header: "Status",
            cell: (product) => (
                <Badge variant={getStatusVariant(product.is_active)}>
                    {product.is_active ? "Ativo" : "Inativo"}
                </Badge>
            ),
        },
        {
            header: "Estoque",
            cell: (product) => {
                const stock = stockSummaries[product.id];
                const isLoading = loadingStock[product.id] || isLoadingAll;

                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 gap-2"
                                disabled={isLoadingAll}
                            >
                                {isLoading ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : stock ? (
                                    <>
                                        <Package className="h-4 w-4" />
                                        <span className="font-medium">{stock.total_items}</span>
                                        <ChevronDown className="h-3 w-3" />
                                    </>
                                ) : (
                                    <>
                                        <Package className="h-4 w-4" />
                                        <span className="text-muted-foreground">-</span>
                                    </>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        {stock && (
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Resumo de Estoque</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="px-2 py-1.5 text-sm">
                                    <div className="flex justify-between py-1">
                                        <span className="text-muted-foreground">Total de Itens:</span>
                                        <span className="font-medium">{stock.total_items}</span>
                                    </div>
                                    <DropdownMenuSeparator className="my-1" />
                                    <div className="flex justify-between py-1">
                                        <span className="text-green-600">Disponíveis (válidos):</span>
                                        <span className="font-medium text-green-600">
                                            {stock.available_valid}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-orange-600">Disponíveis (vencidos):</span>
                                        <span className="font-medium text-orange-600">
                                            {stock.available_expired}
                                        </span>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        )}
                    </DropdownMenu>
                );
            },
        },
        {
            header: "Ações",
            headerClassName: "text-right",
            cellClassName: "text-right",
            cell: (product) => (
                <>
                    <DataTableAction
                        tooltip="Editar produto"
                        onClick={() => onEdit(product)}
                        className="hover:text-primary"
                        icon={Pencil}
                    />
                    <DataTableAction
                        tooltip="Excluir produto"
                        onClick={() => onDelete(product.id)}
                        className="hover:text-destructive"
                        disabled={!product.is_active}
                        icon={Trash2}
                    />
                </>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={filteredProducts}
            isLoading={loading}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            searchPlaceholder="Buscar por nome, código interno, código de barras..."
            emptyStateMessage="Nenhum produto cadastrado no catálogo."
        />
    );
}