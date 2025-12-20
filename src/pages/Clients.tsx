import { ClientAddressesListDialog } from "@/components/features/clients/ClientAddressesListDialog";
import { ClientFormDialog } from "@/components/features/clients/ClientFormDialog";
import { DeleteClientDialog } from "@/components/features/clients/DeleteClientDialog";

import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useClients } from "@/hooks/useClients";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { GenericTable } from "@/components/ui/common/generic-table";

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
    totalCount,
    addressDialogOpen,
    setAddressDialogOpen,
    addressClientId
  } = useClients();

  const addressClientName = clients.find(c => c.id === addressClientId)?.name || null;

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
      <ClientAddressesListDialog
        open={addressDialogOpen}
        onOpenChange={setAddressDialogOpen}
        clientId={addressClientId}
        clientName={addressClientName}
      />
    </Scaffolding >
  );
}
