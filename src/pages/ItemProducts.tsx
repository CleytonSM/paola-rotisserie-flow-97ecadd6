// pages/ItemProducts.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ItemFormDialog } from "@/components/ui/product-items/ItemFormDialog";
import { DeleteItemDialog } from "@/components/ui/product-items/DeleteItemDialog";
import { ItemsTable } from "@/components/ui/product-items/ItemsTable";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useProductItems } from "@/hooks/useProductItems";
import { useProductCatalog } from "@/hooks/useProductCatalog";
import { useAuth } from "@/hooks/useAuth";
import type { ProductItem, FormData } from "@/components/ui/product-items/types";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function ItemProducts() {
    const navigate = useNavigate();

    // Auth check
    useAuth(navigate);

    // Data hooks
    const {
        items,
        loading,
        statusFilter,
        setStatusFilter,
        createItem,
        updateItem,
        deleteItem,
        markAsSold,
        updateItemStatus,
        refreshItems
    } = useProductItems();

    const catalogProducts = useProductCatalog();

    // Table state
    const [searchTerm, setSearchTerm] = useState("");

    // Modal state
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

    // Handlers
    const handleEdit = (item: ProductItem) => {
        setEditingId(item.id);
        setFormData({
            catalog_id: item.catalog_id,
            scale_barcode: item.scale_barcode.toString(),
            weight_kg: item.weight_kg.toString(),
            sale_price: item.sale_price.toString(),
            item_discount: item.item_discount ? (item.item_discount * 100).toString() : "0",
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
        await deleteItem(deletingId);
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        const success = editingId
            ? await updateItem(editingId, formData)
            : await createItem(formData);

        if (success) {
            setDialogOpen(false);
            setEditingId(null);
            resetFormData();
        }
        setSubmitting(false);
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

    return (
        <div className="flex min-h-screen flex-col">
            <main className="container flex-1 py-8 md:py-12">
                <PageHeader
                    title="Itens de Produtos"
                    subtitle="Gerencie os itens pesados individuais."
                    action={
                        <ItemFormDialog
                            open={dialogOpen}
                            onOpenChange={handleDialogClose}
                            formData={formData}
                            setFormData={setFormData}
                            editingId={editingId}
                            onSubmit={handleSubmit}
                            onReset={resetFormData}
                            loading={submitting}
                            catalogProducts={catalogProducts.products}
                        />
                    }
                    children={<AppBreadcrumb />}
                />

                <ItemsTable
                    items={items}
                    loading={loading}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onEdit={handleEdit}
                    onDelete={handleDeleteClick}
                    onMarkAsSold={markAsSold}
                    onStatusChange={updateItemStatus}
                />
            </main>

            <DeleteItemDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}