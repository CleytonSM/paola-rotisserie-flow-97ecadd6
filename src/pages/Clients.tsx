import { ClientFormDialog } from "@/components/ui/clients/ClientFormDialog";
import { DeleteClientDialog } from "@/components/ui/clients/DeleteClientDialog";

import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useClients } from "@/hooks/useClients";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { GenericTable } from "@/components/ui/generic-table";

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
    page,
    setPage,
    pageSize,
    totalCount
  } = useClients();

  return (
    <Scaffolding>
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

      <GenericTable
        columns={columns}
        data={clients}
        isLoading={loading}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Buscar por nome, CPF/CNPJ, email..."
        emptyStateMessage="Nenhum cliente registrado."
        page={page}
        rowsPerPage={pageSize}
        count={totalCount}
        onPageChange={setPage}
      />
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </Scaffolding >
  );
}
