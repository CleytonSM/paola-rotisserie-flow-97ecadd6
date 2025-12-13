import { Button } from "@/components/ui/button";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { usePixKeys } from "@/hooks/usePixKeys";
import { GenericAlertDialog } from "@/components/common/GenericAlertDialog";
import { PixKeysGrid } from "@/components/ui/pix-keys/PixKeysGrid";
import { Plus } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PixKeyFormDialog } from "@/components/ui/pix-keys/PixKeyFormDialog";
import { PixKeyCard } from "@/components/ui/pix-keys/PixKeyCard";
import { Scaffolding } from "@/components/ui/Scaffolding";

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
        return <LoadingSpinner />;
    }

    return (
        <Scaffolding>
            <PageHeader
                title="Chaves Pix"
                subtitle="Gerencie suas chaves Pix para recebimentos."
                action={
                    <>
                        <PixKeyFormDialog
                            open={isFormOpen}
                            onOpenChange={setIsFormOpen}
                            pixKey={editingKey}
                            onSuccess={handleFormSuccess}
                        />
                    </>
                }
                children={<AppBreadcrumb />}
            />

            <GenericAlertDialog
                open={!!deletingKey}
                onOpenChange={handleDeleteDialogClose}
                title="Excluir Chave Pix?"
                description={`Tem certeza que deseja excluir a chave "${deletingKey?.key_value}"? Esta ação não pode ser desfeita.`}
                confirmText="Excluir"
                onConfirm={handleDelete}
                variant="destructive"
            />
            <PixKeysGrid
                pixKeys={pixKeys}
                onEdit={handleEdit}
                onDelete={setDeletingKey}
                onToggleStatus={handleToggleStatus}
                onCreate={handleCreate}
            />
        </Scaffolding>
    );
}
