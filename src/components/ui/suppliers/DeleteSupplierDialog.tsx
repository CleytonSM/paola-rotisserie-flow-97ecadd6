import { ConfirmDialog } from "@/components/ConfirmDialog";

interface DeleteSupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteSupplierDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteSupplierDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      entityName="fornecedor"
    />
  );
}

