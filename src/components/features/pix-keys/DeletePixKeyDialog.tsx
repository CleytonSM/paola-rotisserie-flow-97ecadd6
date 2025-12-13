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
import type { PixKey } from "@/services/database/pix_keys";

interface DeletePixKeyDialogProps {
    pixKey: PixKey | null;
    onClose: (close: boolean) => void;
    onConfirm: () => void;
}

export function DeletePixKeyDialog({ pixKey, onClose, onConfirm }: DeletePixKeyDialogProps) {
    return (
        <AlertDialog open={!!pixKey} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Chave Pix?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir a chave "{pixKey?.key_value}"?
                        Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        className="bg-destructive hover:bg-destructive/90"
                    >
                        Excluir
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
