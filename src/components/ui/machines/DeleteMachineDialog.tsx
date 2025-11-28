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

interface Machine {
    id: string;
    name: string;
}

interface DeleteMachineDialogProps {
    machine: Machine | null;
    onClose: (open: boolean) => void;
    onConfirm: () => void;
}

export function DeleteMachineDialog({ machine, onClose, onConfirm }: DeleteMachineDialogProps) {
    return (
        <AlertDialog open={!!machine} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Maquininha?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tem certeza que deseja excluir a maquininha "{machine?.name}"?
                        Esta ação não pode ser desfeita e removerá todas as taxas configuradas.
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