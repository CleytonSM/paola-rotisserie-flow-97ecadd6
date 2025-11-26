import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ItemFormDialog } from "@/components/ui/product-items/ItemFormDialog";
import { DeleteItemDialog } from "@/components/ui/product-items/DeleteItemDialog";
import type { ProductItem, FormData, ProductItemStatus } from "@/components/ui/product-items/types";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import {
    getProductItems,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    markItemAsSold
} from "@/services/database";
import { getProductCatalog, type ProductCatalog } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, Trash2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    formatWeight,
    formatPrice,
    formatDateTime,
    formatExpiration,
    getExpirationVariant,
    getStatusLabel,
    percentToDecimal,
    decimalToPercent,
    getDaysUntilExpiration
} from "@/components/ui/product-items/utils";
import { getStatusVariant } from "@/utils/status";

// --- Validation Schema ---

const itemSchema = z.object({
    catalog_id: z.string().min(1, "Produto do catálogo é obrigatório"),
    scale_barcode: z.number().positive("Código de barras deve ser um número positivo"),
    weight_kg: z.number().positive("Peso deve ser maior que zero"),
    sale_price: z.number().positive("Preço de venda deve ser maior que zero"),
    item_discount: z.number().min(0).max(1).optional(),
    produced_at: z.string().optional(),
    status: z.enum(['available', 'sold', 'reserved', 'expired', 'discarded']).optional(),
});

// --- Main Component ---

export default function ItemProducts() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<ProductItem[]>([]);
    const [catalogProducts, setCatalogProducts] = useState<ProductCatalog[]>([]);

    // Table Controls
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<ProductItemStatus | "all">("available");

    // Modal Controls
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        catalog_id: "",
        scale_barcode: "",
        weight_kg: "",
        sale_price: "",
        item_discount: "0",
        produced_at: new Date().toISOString().slice(0, 16),
        status: "available",
    });

    // --- Data Loading ---

    useEffect(() => {
        const checkAuth = async () => {
            const { session } = await getCurrentSession();
            if (!session) {
                navigate("/auth");
                return;
            }
            loadData();
            loadCatalog();
        };
        checkAuth();
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        const filters = statusFilter !== "all" ? { status: statusFilter } : undefined;
        const result = await getProductItems(filters);
        if (result.error) {
            toast.error("Erro ao carregar itens");
        } else if (result.data) {
            setItems(result.data as ProductItem[]);
        }
        setLoading(false);
    };

    const loadCatalog = async () => {
        const result = await getProductCatalog(true);
        if (result.data) {
            setCatalogProducts(result.data as ProductCatalog[]);
        }
    };

    // Reload when status filter changes
    useEffect(() => {
        if (catalogProducts.length > 0) {
            loadData();
        }
    }, [statusFilter]);

    // --- CRUD Handlers ---

    const handleEdit = (item: ProductItem) => {
        setEditingId(item.id);
        setFormData({
            catalog_id: item.catalog_id,
            scale_barcode: item.scale_barcode.toString(),
            weight_kg: item.weight_kg.toString(),
            sale_price: item.sale_price.toString(),
            item_discount: decimalToPercent(item.item_discount),
            produced_at: new Date(item.produced_at).toISOString().slice(0, 16),
            status: item.status,
        });
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const { error } = await deleteProductItem(deletingId);
        if (error) {
            toast.error("Erro ao excluir item");
        } else {
            toast.success("Item excluído com sucesso!");
            loadData();
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleMarkAsSold = async (id: string) => {
        const { error } = await markItemAsSold(id);
        if (error) {
            toast.error("Erro ao marcar item como vendido");
        } else {
            toast.success("Item marcado como vendido!");
            loadData();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const dataToValidate = {
                catalog_id: formData.catalog_id,
                scale_barcode: parseInt(formData.scale_barcode),
                weight_kg: parseFloat(formData.weight_kg),
                sale_price: parseFloat(formData.sale_price),
                item_discount: formData.item_discount ? percentToDecimal(formData.item_discount) : undefined,
                produced_at: formData.produced_at || undefined,
                status: formData.status,
            };

            const validated = itemSchema.parse(dataToValidate);

            const { error } = editingId
                ? await updateProductItem(editingId, validated)
                : await createProductItem(validated);

            if (error) {
                toast.error(editingId ? "Erro ao atualizar item" : "Erro ao criar item");
            } else {
                toast.success(
                    editingId ? "Item atualizado com sucesso!" : "Item criado com sucesso!"
                );
                setDialogOpen(false);
                setEditingId(null);
                resetFormData();
                loadData();
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                toast.error(err.issues[0].message);
            } else {
                toast.error("Erro inesperado ao processar formulário");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const resetFormData = () => {
        setFormData({
            catalog_id: "",
            scale_barcode: "",
            weight_kg: "",
            sale_price: "",
            item_discount: "0",
            produced_at: new Date().toISOString().slice(0, 16),
            status: "available",
        });
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setEditingId(null);
            resetFormData();
        }
    };

    // --- Table Filtering ---

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

    // --- Table Column Definitions ---

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
                const daysRemaining = getDaysUntilExpiration(item.expires_at);
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
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleMarkAsSold(item.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-green-600"
                            title="Marcar como vendido"
                        >
                            <CheckCircle className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                        <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(item.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
                            Itens de Produtos
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Gerencie os itens pesados individuais.
                        </p>
                    </div>
                    <ItemFormDialog
                        open={dialogOpen}
                        onOpenChange={handleDialogClose}
                        formData={formData}
                        setFormData={setFormData}
                        editingId={editingId}
                        onSubmit={handleSubmit}
                        onReset={resetFormData}
                        loading={submitting}
                        catalogProducts={catalogProducts}
                    />
                </div>

                {/* Items Table */}
                <DataTable
                    columns={columns}
                    data={filteredItems}
                    isLoading={loading}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    searchPlaceholder="Buscar por produto, código de barras..."
                    emptyStateMessage="Nenhum item encontrado."
                />
            </main>

            {/* Delete Confirmation Dialog */}
            <DeleteItemDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
