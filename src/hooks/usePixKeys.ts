import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getPixKeys, deletePixKey, PixKey } from "@/services/database";

export function usePixKeys() {
    const queryClient = useQueryClient();
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<PixKey | null>(null);
    const [deletingKey, setDeletingKey] = useState<PixKey | null>(null);

    const { data: pixKeys, isLoading } = useQuery({
        queryKey: ["pixKeys"],
        queryFn: async () => {
            const { data, error } = await getPixKeys();
            if (error) throw error;
            return data;
        },
    });

    const handleCreate = () => {
        setEditingKey(null);
        setIsFormOpen(true);
    };

    const handleEdit = (pixKey: PixKey) => {
        setEditingKey(pixKey);
        setIsFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deletingKey) return;

        try {
            const { error } = await deletePixKey(deletingKey.id);
            if (error) throw error;

            toast.success("Chave Pix excluída com sucesso!");
            queryClient.invalidateQueries({ queryKey: ["pixKeys"] });
        } catch (error) {
            toast.error("Erro ao excluir chave Pix");
        } finally {
            setDeletingKey(null);
        }
    };

    const handleFormSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["pixKeys"] });
    };

    const handleDialogClose = (open: boolean) => {
        setIsFormOpen(open);
        if (!open) {
            setEditingKey(null);
        }
    };

    const handleDeleteDialogClose = (open: boolean) => {
        if (!open) {
            setDeletingKey(null);
        }
    };

    const handleToggleStatus = () => {
        queryClient.invalidateQueries({ queryKey: ["pixKeys"] });
    };

    return {
        pixKeys,
        isLoading,
        isFormOpen,
        setIsFormOpen: handleDialogClose,
        editingKey,
        deletingKey,
        setDeletingKey,
        handleCreate,
        handleEdit,
        handleDelete,
        handleFormSuccess,
        handleDeleteDialogClose,
        handleToggleStatus,
    };
}
