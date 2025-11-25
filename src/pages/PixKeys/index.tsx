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

import { getPixKeys, deletePixKey, PixKey } from "@/services/database";
import { PixKeyCard } from "./components/PixKeyCard";
import { PixKeyFormDialog } from "./components/PixKeyFormDialog";

export default function PixKeys() {
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
            console.error(error);
            toast.error("Erro ao excluir chave Pix");
        } finally {
            setDeletingKey(null);
        }
    };

    const handleFormSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ["pixKeys"] });
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
                            Chaves Pix
                        </h1>
                        <p className="mt-2 text-lg text-muted-foreground">
                            Gerencie suas chaves Pix para recebimentos.
                        </p>
                    </div>
                    <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Chave
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pixKeys?.map((pixKey) => (
                        <PixKeyCard
                            key={pixKey.id}
                            pixKey={pixKey}
                            onEdit={handleEdit}
                            onDelete={setDeletingKey}
                            onToggleStatus={() => queryClient.invalidateQueries({ queryKey: ["pixKeys"] })}
                        />
                    ))}
                    {pixKeys?.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                            <h3 className="text-lg font-medium text-foreground">
                                Nenhuma chave Pix cadastrada
                            </h3>
                            <p className="text-muted-foreground mt-1 mb-4">
                                Cadastre suas chaves Pix para gerar QR Codes automaticamente.
                            </p>
                            <Button variant="outline" onClick={handleCreate}>
                                Cadastrar Primeira
                            </Button>
                        </div>
                    )}
                </div>

                <PixKeyFormDialog
                    open={isFormOpen}
                    onOpenChange={setIsFormOpen}
                    pixKey={editingKey}
                    onSuccess={handleFormSuccess}
                />

                <AlertDialog open={!!deletingKey} onOpenChange={(open) => !open && setDeletingKey(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Excluir Chave Pix?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Tem certeza que deseja excluir a chave "{deletingKey?.key_value}"?
                                Esta ação não pode ser desfeita.
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
