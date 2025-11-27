import { ClientFormDialog } from "@/components/ui/clients/ClientFormDialog";
import { DeleteClientDialog } from "@/components/ui/clients/DeleteClientDialog";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useClients } from "@/hooks/useClients";

export default function Clients() {
  const {
    loading,
    clients,
    searchTerm,
    setSearchTerm,
    dialogOpen,
    editingId,
    deleteDialogOpen,
    setDeleteDialogOpen,
    handleDeleteConfirm,
    form,
    onSubmit,
    columns,
    handleDialogOpenChange,
  } = useClients();

  return (
    <div className="flex min-h-screen flex-col">
      <main className="container flex-1 py-8 md:py-12">
        <PageHeader
          title="Clientes"
          subtitle="Gerencie seus clientes."
          action={
            <ClientFormDialog
              open={dialogOpen}
              onOpenChange={handleDialogOpenChange}
              form={form}
              onSubmit={onSubmit}
              editingId={editingId}
              loading={form.formState.isSubmitting}
            />
          }
          children={<AppBreadcrumb />}
        />

        <DataTable
          columns={columns}
          data={clients}
          isLoading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nome, CPF/CNPJ, email..."
          emptyStateMessage="Nenhum cliente registrado."
        />
      </main>

      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
