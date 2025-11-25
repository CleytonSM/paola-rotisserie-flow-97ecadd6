import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

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

import { getMachines, deleteMachine, CardMachine } from "@/services/database";
import { MachineCard } from "./components/MachineCard";
import { MachineFormDialog } from "./components/MachineFormDialog";

export default function Machines() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingMachine, setEditingMachine] = useState<CardMachine | null>(null);
    const [deletingMachine, setDeletingMachine] = useState<CardMachine | null>(null);

    const { data: machines, isLoading } = useQuery({
        queryKey: ["machines"],
        queryFn: async () => {
            const { data, error } = await getMachines();
            if (error) throw error;
            return data;
        },
    });

    const handleCreate = () => {
        setEditingMachine(null);
        setIsFormOpen(true);
    };

    const handleEdit = (machine: CardMachine) => {
        setEditingMachine(machine);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingMachine) return;

        try {
            const { error } = await deleteMachine(deletingMachine.id);
            if (error) throw error;

            toast.success("Maquininha excluída com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["machines"] });
        } catch (error) {
            console.error(error);
            toast.error("Erro ao excluir maquininha");
        } finally {
            setDeletingMachine(null);
        }
    };

    const handleFormSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["machines"] });
    };

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
                <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
                            Maquininhas
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Gerencie suas maquininhas de cartão.
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Maquininha
                    </Button>
                </div>

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

                <MachineFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    machine={editingMachine}
                    onSuccess={handleFormSuccess}
                />

                <AlertDialog open={!!deletingMachine} onOpenChange={(open) => !open && setDeletingMachine(null)}>
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
