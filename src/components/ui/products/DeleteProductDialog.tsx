import { ConfirmDialog } from "@/components/ConfirmDialog";

interface DeleteProductDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function DeleteProductDialog({
    open,
    onOpenChange,
    onConfirm,
}: DeleteProductDialogProps) {
    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            entityName="produto"
        />
    );
}
