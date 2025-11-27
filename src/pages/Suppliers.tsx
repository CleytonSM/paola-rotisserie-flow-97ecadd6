import { SupplierFormDialog } from "@/components/ui/suppliers/SupplierFormDialog";
import { SupplierTable } from "@/components/ui/suppliers/SupplierTable";
import { DeleteSupplierDialog } from "@/components/ui/suppliers/DeleteSupplierDialog";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useSuppliers } from "@/hooks/useSuppliers";

export default function Suppliers() {
  const {
    loading,
    suppliers,
    searchTerm,
    setSearchTerm,
    dialogOpen,
    setDialogOpen,
    editingId,
    deleteDialogOpen,
    setDeleteDialogOpen,
    form,
    onSubmit,
    handleEdit,
    handleDeleteClick,
    handleDeleteConfirm,
  } = useSuppliers();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="container flex-1 py-8 md:py-12">
        <PageHeader
          title="Fornecedores"
          subtitle="Gerencie seus fornecedores."
          action={
            <SupplierFormDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              form={form}
              editingId={editingId}
              onSubmit={onSubmit}
            />
          }
          children={<AppBreadcrumb />}
        />

        <SupplierTable
          suppliers={suppliers}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </main>

      <DeleteSupplierDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
