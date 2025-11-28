import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";


import { PixKeyCard } from "../components/ui/pixkeys/PixKeyCard";
import { PixKeyFormDialog } from "../components/ui/pixkeys/PixKeyFormDialog";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { usePixKeys } from "@/hooks/usePixKeys";
import { GenericAlertDialog } from "@/components/GenericAlertDialog";

export default function PixKeys() {
    const {
        pixKeys,
        isLoading,
        isFormOpen,
        setIsFormOpen,
        editingKey,
        deletingKey,
        setDeletingKey,
        handleCreate,
        handleEdit,
        handleDelete,
        handleFormSuccess,
        handleDeleteDialogClose,
        handleToggleStatus,
    } = usePixKeys();

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
                    title="Chaves Pix"
                    subtitle="Gerencie suas chaves Pix para recebimentos."
                    action={
                        <PixKeyFormDialog
                            open={isFormOpen}
                            onOpenChange={setIsFormOpen}
                            pixKey={editingKey}
                            onSuccess={handleFormSuccess}
                        />
                    }
                    children={<AppBreadcrumb />}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {pixKeys?.map((pixKey) => (
                        <PixKeyCard
                            key={pixKey.id}
                            pixKey={pixKey}
                            onEdit={handleEdit}
                            onDelete={setDeletingKey}
                            onToggleStatus={handleToggleStatus}
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
                <GenericAlertDialog
                    open={!!deletingKey}
                    onOpenChange={handleDeleteDialogClose}
                    title="Excluir Chave Pix?"
                    description={`Tem certeza que deseja excluir a chave "${deletingKey?.key_value}"? Esta ação não pode ser desfeita.`}
                    confirmText="Excluir"
                    onConfirm={handleDelete}
                    variant="destructive"
                />
            </main>
        </div>
    );
}
