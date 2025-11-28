import { ConfirmDialog } from "@/components/ConfirmDialog";

interface DeletePayableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeletePayableDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeletePayableDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      entityName="conta"
    />
  );
}

