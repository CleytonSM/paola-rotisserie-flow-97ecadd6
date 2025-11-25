import { useMemo, useState } from "react";
import { ProductFormDialog } from "@/components/ui/products/ProductFormDialog";
import { DeleteProductDialog } from "@/components/ui/products/DeleteProductDialog";
import type { ProductCatalog } from "@/components/ui/products/types";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { ChevronDown, Loader2, Package, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    formatBasePrice,
    formatDiscount,
    formatShelfLife,
} from "@/components/ui/products/utils";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { useProductForm } from "@/hooks/useProductForm";
import { useProductStock } from "@/hooks/useProductStock";

// --- Main Component ---

export const Products = () => {
    // Custom Hooks
    const { products, loading, createProduct, updateProduct, deleteProduct } = useProductCatalog();

    const {
        form,
        dialogOpen,
        setDialogOpen,
        editingId,
        handleEdit,
        handleSubmit,
        resetForm,
        submitting
    } = useProductForm({
        onSuccess: async (id, data) => {
            if (id) {
                return await updateProduct(id, data);
            } else {
                return await createProduct(data);
            }
        },
    });

    // Extract catalog IDs for batch stock loading
    const catalogIds = useMemo(() => products.map(p => p.id), [products]);

    // Load all stock summaries automatically
    const { stockSummaries, loadingStock, isLoadingAll, loadStockSummary } = useProductStock({
        catalogIds,
        autoLoad: true,
    });

    // Table Controls
    const [searchTerm, setSearchTerm] = useState("");

    // Delete Dialog Controls
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // --- Delete Handlers ---

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        await deleteProduct(deletingId);
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    // --- Table Filtering ---

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

    // --- Table Column Definitions ---

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
                    {formatBasePrice(product.base_price)}
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
                <Badge variant={product.is_active ? "default" : "secondary"}>
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
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(product)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(product.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        disabled={!product.is_active}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </>
            ),
        },
    ];

    // --- Render ---

    return (
        <div className="flex min-h-screen flex-col">
            <main className="container flex-1 py-8 md:py-12">
                {/* Page Header */}
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
                            Catálogo de Produtos
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Gerencie os produtos mestres do catálogo.
                        </p>
                    </div>
                    <ProductFormDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        form={form}
                        editingId={editingId}
                        onSubmit={handleSubmit}
                        onReset={resetForm}
                        loading={submitting}
                    />
                </div>

                {/* Products Table */}
                <DataTable
                    columns={columns}
                    data={filteredProducts}
                    isLoading={loading}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Buscar por nome, código interno, código de barras..."
                    emptyStateMessage="Nenhum produto cadastrado no catálogo."
                />
            </main>

            {/* Delete Confirmation Dialog */}
            <DeleteProductDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
};