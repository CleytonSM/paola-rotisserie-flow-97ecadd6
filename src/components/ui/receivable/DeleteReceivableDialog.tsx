import { ConfirmDialog } from "@/components/ConfirmDialog";

interface DeleteReceivableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteReceivableDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteReceivableDialogProps) {
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      entityName="entrada"
    />
  );
}

