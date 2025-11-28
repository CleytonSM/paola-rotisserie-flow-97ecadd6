import { ConfirmDialog } from "@/components/ConfirmDialog";


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
        <ConfirmDialog
            open={!!machine}
            onOpenChange={onClose}
            onConfirm={onConfirm}
            title="Excluir Maquininha?"
            description={`Tem certeza que deseja excluir a maquininha "${machine?.name}"? Esta ação não pode ser desfeita e removerá todas as taxas configuradas.`}
        />
    );
}