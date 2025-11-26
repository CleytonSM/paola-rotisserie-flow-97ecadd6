import { useMemo } from "react";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { DataTableAction } from "@/components/ui/data-table-action";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import type { ProductItem, ProductItemStatus } from "@/components/ui/product-items/types";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    onStatusChange: (id: string, status: ProductItemStatus) => void;
}

export function ItemsTable({
    items,
    loading,
    searchTerm,
    onSearchChange,
    onEdit,
    onDelete,
    onMarkAsSold,
    onStatusChange,
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
            cell: (item) => {
                const hasDiscount = item.item_discount && item.item_discount > 0;
                const finalPrice = hasDiscount
                    ? item.sale_price * (1 - item.item_discount!)
                    : item.sale_price;

                return (
                    <div className="flex flex-col">
                        {hasDiscount && (
                            <span className="text-xs text-muted-foreground line-through">
                                {formatPrice(item.sale_price)}
                            </span>
                        )}
                        <span className="font-medium text-foreground">
                            {formatPrice(finalPrice)}
                        </span>
                    </div>
                );
            },
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
                <Select
                    value={item.status}
                    onValueChange={(value) => onStatusChange(item.id, value as ProductItemStatus)}
                >
                    <SelectTrigger className="h-auto w-auto min-w-[100px] border-0 bg-transparent p-0 focus:ring-0">
                        <SelectValue asChild>
                            <Badge variant={getStatusVariant(item.status)} className="cursor-pointer hover:opacity-80">
                                {getStatusLabel(item.status)}
                            </Badge>
                        </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="available">Disponível</SelectItem>
                        <SelectItem value="sold">Vendido</SelectItem>
                        <SelectItem value="reserved">Reservado</SelectItem>
                        <SelectItem value="expired">Vencido</SelectItem>
                        <SelectItem value="discarded">Descartado</SelectItem>
                    </SelectContent>
                </Select>
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