import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";
import { ReactNode } from "react";
import { UseFormReturn } from "react-hook-form";

interface GenericFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description?: string;
    form?: UseFormReturn<any>; // Optional if not using react-hook-form directly for submission handling here
    onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void> | void;
    isEditing: boolean;
    loading?: boolean;
    children: ReactNode;
    triggerButton?: ReactNode;
    submitText?: string;
    cancelText?: string;
    maxWidth?: string;
    onCancel?: () => void;
}

export function GenericFormDialog({
    open,
    onOpenChange,
    title,
    description,
    onSubmit,
    isEditing,
    loading = false,
    children,
    triggerButton,
    submitText,
    cancelText = "Cancelar",
    maxWidth = "sm:max-w-2xl",
    onCancel,
}: GenericFormDialogProps) {

    const defaultSubmitText = isEditing
        ? (loading ? "Salvando..." : "Salvar Alterações")
        : (loading ? "Adicionando..." : "Adicionar");

    const finalSubmitText = submitText || defaultSubmitText;

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {triggerButton && (
                <DialogTrigger asChild>
                    {triggerButton}
                </DialogTrigger>
            )}
            {!triggerButton && !open && (
                <DialogTrigger asChild>
                    <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
                        <Plus className="mr-2 h-4 w-4" />
                        Adicionar
                    </Button>
                </DialogTrigger>
            )}

            <DialogContent className={maxWidth}>
                <DialogHeader>
                    <DialogTitle className="font-display text-3xl tracking-wide">
                        {title}
                    </DialogTitle>
                    {description && (
                        <DialogDescription>
                            {description}
                        </DialogDescription>
                    )}
                </DialogHeader>

                <form onSubmit={onSubmit} className="mt-6">
                    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                        {children}
                    </div>

                    <DialogFooter className="mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleCancel}
                            disabled={loading}
                        >
                            {cancelText}
                        </Button>
                        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {finalSubmitText}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
