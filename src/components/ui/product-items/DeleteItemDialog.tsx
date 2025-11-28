import { ConfirmDialog } from "@/components/ConfirmDialog";


interface DeleteItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
}

export function DeleteItemDialog({
    open,
    onOpenChange,
    onConfirm,
}: DeleteItemDialogProps) {
    return (
        <ConfirmDialog
            open={open}
            onOpenChange={onOpenChange}
            onConfirm={onConfirm}
            entityName="item"
        />
    );
}
