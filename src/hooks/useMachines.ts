import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getMachines, deleteMachine, CardMachine } from "@/services/database";

export function useMachines() {
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

    const handleDialogClose = (open: boolean) => {
        setIsFormOpen(open);
        if (!open) {
            setEditingMachine(null);
        }
    };

    const handleDeleteDialogClose = (open: boolean) => {
        if (!open) {
            setDeletingMachine(null);
        }
    };

    return {
        machines,
        isLoading,
        isFormOpen,
        setIsFormOpen: handleDialogClose,
        editingMachine,
        deletingMachine,
        setDeletingMachine,
        handleCreate,
        handleEdit,
        handleDelete,
        handleFormSuccess,
        handleDeleteDialogClose,
    };
}
