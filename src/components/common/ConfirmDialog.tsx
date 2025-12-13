import { GenericAlertDialog } from "@/components/common/GenericAlertDialog";

interface ConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    entityName?: string;
    title?: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
}

export function ConfirmDialog({
    open,
    onOpenChange,
    onConfirm,
    entityName,
    title = "Confirmar exclusão",
    description,
    confirmText = "Excluir",
    cancelText = "Cancelar",
    variant = "destructive",
}: ConfirmDialogProps) {
    const defaultDescription = entityName
        ? `Tem certeza que deseja excluir este ${entityName}? Esta ação não pode ser desfeita.`
        : "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.";

    return (
        <GenericAlertDialog
            open={open}
            onOpenChange={onOpenChange}
            title={title}
            description={description || defaultDescription}
            confirmText={confirmText}
            cancelText={cancelText}
            onConfirm={onConfirm}
            variant={variant}
        />
    );
}
