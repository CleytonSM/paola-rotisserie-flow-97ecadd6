import { MachineFormDialog } from "@/components/features/machines/MachineFormDialog";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useMachines } from "@/hooks/useMachines";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MachinesGrid } from "@/components/features/machines/MachinesGrid";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { Scaffolding } from "@/components/ui/Scaffolding";

export default function Machines() {
    const {
        machines,
        isLoading,
        isFormOpen,
        setIsFormOpen,
        editingMachine,
        deletingMachine,
        setDeletingMachine,
        handleCreate,
        handleEdit,
        handleDelete,
        handleFormSuccess,
        handleDeleteDialogClose,
    } = useMachines();

    if (isLoading) {
        return <LoadingSpinner />;
    }

    return (
        <Scaffolding>
            <PageHeader
                title="Maquininhas"
                subtitle="Gerencie suas maquininhas de cartão."
                action={
                    <MachineFormDialog
                        open={isFormOpen}
                        onOpenChange={setIsFormOpen}
                        machine={editingMachine}
                        onSuccess={handleFormSuccess}
                    />
                }
                children={<AppBreadcrumb />}
            />

            <MachinesGrid
                machines={machines}
                onEdit={handleEdit}
                onDelete={setDeletingMachine}
                onCreate={handleCreate}
            />

            <ConfirmDialog
                open={!!deletingMachine}
                onOpenChange={handleDeleteDialogClose}
                onConfirm={handleDelete}
                title="Excluir Maquininha?"
                description={`Tem certeza que deseja excluir a maquininha "${deletingMachine?.name}"? Esta ação não pode ser desfeita.`}
            />
        </Scaffolding>
    );
}
