import { PixKeyFormDialog } from "../components/ui/pix-keys/PixKeyFormDialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { usePixKeys } from "@/hooks/usePixKeys";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { PixKeysGrid } from "@/components/ui/pix-keys/PixKeysGrid";
import { DeletePixKeyDialog } from "@/components/ui/pix-keys/DeletePixKeyDialog";

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
        <div className="flex min-h-screen flex-col">
            <main className="container flex-1 py-8 md:py-12">
                <PageHeader
                    title="Chaves Pix"
                    subtitle="Gerencie suas chaves Pix para recebimentos."
                    action={
                        <>
                            <Button onClick={handleCreate}>
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Chave
                            </Button>
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

                <PixKeysGrid
                    pixKeys={pixKeys}
                    onEdit={handleEdit}
                    onDelete={setDeletingKey}
                    onToggleStatus={handleToggleStatus}
                    onCreate={handleCreate}
                />

                <DeletePixKeyDialog
                    pixKey={deletingKey}
                    onClose={handleDeleteDialogClose}
                    onConfirm={handleDelete}
                />
            </main>
        </div>
    );
}