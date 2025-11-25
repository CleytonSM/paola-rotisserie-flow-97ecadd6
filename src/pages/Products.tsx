import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProductFormDialog } from "@/components/ui/products/ProductFormDialog";
import { DeleteProductDialog } from "@/components/ui/products/DeleteProductDialog";
import type { Product, FormData } from "@/components/ui/products/types";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { getProducts, createProduct, updateProduct, deleteProduct } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, formatDiscount, formatShelfLife, percentToDecimal, decimalToPercent } from "@/components/ui/products/utils";

// --- Validation Schema ---

const productSchema = z.object({
    name: z.string().min(1, "Nome é obrigatório").max(35, "Nome deve ter no máximo 35 caracteres"),
    shelf_life_days: z.number().positive("Tempo de validade deve ser maior que zero").optional(),
    barcode: z.number().optional(),
    price: z.number().positive("Preço deve ser maior que zero"),
    code: z.string().max(50, "Código deve ter no máximo 50 caracteres").optional(),
    discount: z.number().min(0, "Desconto não pode ser negativo").max(1, "Desconto não pode ser maior que 100%").optional(),
});

// --- Main Component ---

export const Products = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<Product[]>([]);

    // Table Controls
    const [searchTerm, setSearchTerm] = useState("");

    // Modal Controls
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        name: "",
        shelf_life_days: "",
        barcode: "",
        price: "",
        code: "",
        discount: "0",
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
        };
        checkAuth();
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        const result = await getProducts();
        if (result.error) {
            toast.error("Erro ao carregar produtos");
        } else if (result.data) {
            setProducts(result.data as Product[]);
        }
        setLoading(false);
    };

    // --- CRUD Handlers ---

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setFormData({
            name: product.name,
            shelf_life_days: product.shelf_life_days?.toString() || "",
            barcode: product.barcode?.toString() || "",
            price: product.price.toString(),
            code: product.code || "",
            discount: decimalToPercent(product.discount),
        });
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const { error } = await deleteProduct(deletingId);
        if (error) {
            toast.error("Erro ao excluir produto");
        } else {
            toast.success("Produto excluído com sucesso!");
            loadData();
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const dataToValidate = {
                name: formData.name,
                shelf_life_days: formData.shelf_life_days ? parseInt(formData.shelf_life_days) : undefined,
                barcode: formData.barcode ? parseInt(formData.barcode) : undefined,
                price: parseFloat(formData.price),
                code: formData.code || undefined,
                discount: formData.discount ? percentToDecimal(formData.discount) : undefined,
            };

            const validated = productSchema.parse(dataToValidate);

            const { error } = editingId
                ? await updateProduct(editingId, validated)
                : await createProduct(validated);

            if (error) {
                toast.error(editingId ? "Erro ao atualizar produto" : "Erro ao criar produto");
            } else {
                toast.success(
                    editingId ? "Produto atualizado com sucesso!" : "Produto criado com sucesso!"
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
            name: "",
            shelf_life_days: "",
            barcode: "",
            price: "",
            code: "",
            discount: "0",
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

    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                product.name.toLowerCase().includes(searchLower) ||
                (product.code && product.code.toLowerCase().includes(searchLower)) ||
                (product.barcode && product.barcode.toString().includes(searchLower))
            );
        });
    }, [products, searchTerm]);

    // --- Table Column Definitions ---

    const columns: ColumnDef<Product>[] = [
        {
            header: "Produto",
            cell: (product) => (
                <div>
                    <div className="font-medium text-foreground">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                        {product.code || "Sem código"}
                    </div>
                </div>
            ),
        },
        {
            header: "Código de Barras",
            cell: (product) => (
                <span className="font-sans tabular-nums text-muted-foreground">
                    {product.barcode || "-"}
                </span>
            ),
        },
        {
            header: "Preço",
            cell: (product) => (
                <span className="font-medium text-foreground">
                    {formatPrice(product.price)}
                </span>
            ),
        },
        {
            header: "Desconto",
            cell: (product) => (
                <span className="text-muted-foreground">
                    {formatDiscount(product.discount)}
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
                            Produtos
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Gerencie o catálogo de produtos.
                        </p>
                    </div>
                    <ProductFormDialog
                        open={dialogOpen}
                        onOpenChange={handleDialogClose}
                        formData={formData}
                        setFormData={setFormData}
                        editingId={editingId}
                        onSubmit={handleSubmit}
                        onReset={resetFormData}
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
                    searchPlaceholder="Buscar por nome, código, código de barras..."
                    emptyStateMessage="Nenhum produto cadastrado."
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