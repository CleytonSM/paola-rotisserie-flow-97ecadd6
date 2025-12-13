import { GenericAlertDialog } from "@/components/common/GenericAlertDialog";
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

interface DeleteClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteClientDialog({
  open,
  onOpenChange,
  onConfirm,
}: DeleteClientDialogProps) {
  return (
    <GenericAlertDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Confirmar exclusão"
      description="Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita."
      confirmText="Excluir"
      onConfirm={onConfirm}
      variant="destructive"
    />
  );
}

