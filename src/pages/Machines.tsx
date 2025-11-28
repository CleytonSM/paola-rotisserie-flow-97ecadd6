import { MachineFormDialog } from "../components/ui/machines/MachineFormDialog";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useMachines } from "@/hooks/useMachines";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { MachinesGrid } from "@/components/ui/machines/MachinesGrid";
import { DeleteMachineDialog } from "@/components/ui/machines/DeleteMachineDialog";
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

            <DeleteMachineDialog
                machine={deletingMachine}
                onClose={handleDeleteDialogClose}
                onConfirm={handleDelete}
            />
        </Scaffolding>
    );
}