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
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { DateRange } from "react-day-picker";
import { Scaffolding } from "@/components/ui/Scaffolding";

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
        form,
        editingId,
        markAsSold,
        updateItemStatus,
        dialogOpen,
        setDialogOpen,
        deleteDialogOpen,
        setDeleteDialogOpen,
        handleEditClick,
        handleDeleteClick,
        handleDeleteConfirm,
        handleFormSubmit,
    } = useProductItems();

    const catalogProducts = useProductCatalog();

    // Table state
    const [searchTerm, setSearchTerm] = useState("");
    const [productionDate, setProductionDate] = useState<DateRange | undefined>();
    const [expirationPreset, setExpirationPreset] = useState<string>("all");

    return (
        <Scaffolding>
            <PageHeader
                title="Itens de Produtos"
                subtitle="Gerencie os itens pesados individuais."
                action={
                    <ItemFormDialog
                        open={dialogOpen}
                        onOpenChange={setDialogOpen}
                        form={form}
                        editingId={editingId}
                        onSubmit={handleFormSubmit}
                        catalogProducts={catalogProducts.products}
                    />
                }
                children={<AppBreadcrumb />}
            >
            </PageHeader>

            <ItemsTable
                items={items}
                loading={loading}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                onEdit={handleEditClick}
                onDelete={handleDeleteClick}
                onMarkAsSold={markAsSold}
                onStatusChange={updateItemStatus}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                productionDate={productionDate}
                onProductionDateChange={setProductionDate}
                expirationPreset={expirationPreset}
                onExpirationPresetChange={setExpirationPreset}
            />

            <DeleteItemDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                onConfirm={handleDeleteConfirm}
            />
        </Scaffolding>
    );
}