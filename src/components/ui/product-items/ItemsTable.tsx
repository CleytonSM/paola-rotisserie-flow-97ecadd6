import { useMemo } from "react";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { DataTableAction } from "@/components/ui/data-table-action";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import type { ProductItem } from "@/components/ui/product-items/types";
import {
    formatWeight,
    formatPrice,
    formatDateTime,
    formatExpiration,
    getExpirationVariant,
    getStatusLabel,
    getDaysUntilExpiration
} from "@/components/ui/product-items/utils";
import { getStatusVariant } from "@/utils/status";

interface ItemsTableProps {
    items: ProductItem[];
    loading: boolean;
    searchTerm: string;
    onSearchChange: (term: string) => void;
    onEdit: (item: ProductItem) => void;
    onDelete: (id: string) => void;
    onMarkAsSold: (id: string) => void;
}

export function ItemsTable({
    items,
    loading,
    searchTerm,
    onSearchChange,
    onEdit,
    onDelete,
    onMarkAsSold,
}: ItemsTableProps) {
    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                item.product_catalog?.name.toLowerCase().includes(searchLower) ||
                item.scale_barcode.toString().includes(searchLower) ||
                item.product_catalog?.internal_code?.toLowerCase().includes(searchLower)
            );
        });
    }, [items, searchTerm]);

    const columns: ColumnDef<ProductItem>[] = [
        {
            header: "Produto",
            cell: (item) => (
                <div>
                    <div className="font-medium text-foreground">
                        {item.product_catalog?.name || "Produto não encontrado"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        Código: {item.scale_barcode}
                    </div>
                </div>
            ),
        },
        {
            header: "Peso",
            cell: (item) => (
                <span className="font-sans tabular-nums text-foreground">
                    {formatWeight(item.weight_kg)}
                </span>
            ),
        },
        {
            header: "Preço",
            cell: (item) => (
                <span className="font-medium text-foreground">
                    {formatPrice(item.sale_price)}
                </span>
            ),
        },
        {
            header: "Produzido",
            cell: (item) => (
                <span className="text-sm text-muted-foreground">
                    {formatDateTime(item.produced_at)}
                </span>
            ),
        },
        {
            header: "Validade",
            cell: (item) => {
                getDaysUntilExpiration(item.expires_at);
                return (
                    <Badge variant={getExpirationVariant(item.expires_at)}>
                        {formatExpiration(item.expires_at)}
                    </Badge>
                );
            },
        },
        {
            header: "Status",
            cell: (item) => (
                <Badge variant={getStatusVariant(item.status)}>
                    {getStatusLabel(item.status)}
                </Badge>
            ),
        },
        {
            header: "Ações",
            headerClassName: "text-right",
            cellClassName: "text-right",
            cell: (item) => (
                <>
                    {item.status === "available" && (
                        <DataTableAction
                            tooltip="Marcar como vendido"
                            onClick={() => onMarkAsSold(item.id)}
                            className="hover:text-green-600"
                            icon={CheckCircle}
                        />
                    )}
                    <DataTableAction
                        tooltip="Editar item"
                        onClick={() => onEdit(item)}
                        className="hover:text-primary"
                        icon={Pencil}
                    />
                    <DataTableAction
                        tooltip="Excluir item"
                        onClick={() => onDelete(item.id)}
                        className="hover:text-destructive"
                        icon={Trash2}
                    />
                </>
            ),
        },
    ];

    return (
        <DataTable
            columns={columns}
            data={filteredItems}
            isLoading={loading}
            searchTerm={searchTerm}
            onSearchChange={onSearchChange}
            searchPlaceholder="Buscar por produto, código de barras..."
            emptyStateMessage="Nenhum item encontrado."
        />
    );
}