import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { MachineCard } from "../components/ui/machines/MachineCard";
import { MachineFormDialog } from "../components/ui/machines/MachineFormDialog";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { useMachines } from "@/hooks/useMachines";

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
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <main className="container flex-1 py-8 md:py-12">
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {machines?.map((machine) => (
                        <MachineCard
                            key={machine.id}
                            machine={machine}
                            onEdit={handleEdit}
                            onDelete={setDeletingMachine}
                        />
                    ))}
                    {machines?.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                            <h3 className="text-lg font-medium text-foreground">
                                Nenhuma maquininha cadastrada
                            </h3>
                            <p className="text-muted-foreground mt-1 mb-4">
                                Cadastre suas maquininhas de cartão para gerenciar taxas e bandeiras.
                            </p>
                            <Button variant="outline" onClick={handleCreate}>
                                Cadastrar Primeira
                            </Button>
                        </div>
                    )}
                </div>

                <AlertDialog open={!!deletingMachine} onOpenChange={handleDeleteDialogClose}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Maquininha?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja excluir a maquininha "{deletingMachine?.name}"?
                                Esta ação não pode ser desfeita e removerá todas as taxas configuradas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDelete}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Excluir
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </main>
        </div>
    );
}
