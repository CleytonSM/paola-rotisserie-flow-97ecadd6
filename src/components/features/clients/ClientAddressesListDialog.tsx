import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, MapPin } from "lucide-react";
import { useClientAddresses } from "@/hooks/useClientAddresses";
import { ClientAddressDialog } from "./ClientAddressDialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

interface ClientAddressesListDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    clientId: string | null;
    clientName: string | null;
}

export function ClientAddressesListDialog({
    open,
    onOpenChange,
    clientId,
    clientName
}: ClientAddressesListDialogProps) {
    const { addresses, isLoading, deleteAddress, isDeleting } = useClientAddresses(clientId || undefined);
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<string | null>(null);

    const handleDeleteConfirm = async () => {
        if (addressToDelete) {
            await deleteAddress(addressToDelete);
            setAddressToDelete(null);
        }
    };

    if (!clientId) return null;

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Endereços de {clientName}</DialogTitle>
                        <DialogDescription>
                            Gerencie os endereços de entrega deste cliente.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsAddDialogOpen(true)} size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Endereço
                        </Button>
                    </div>

                    <ScrollArea className="h-[300px] pr-4">
                        {isLoading ? (
                            <div className="flex justify-center p-4">Carregando...</div>
                        ) : addresses.length === 0 ? (
                            <div className="text-center text-muted-foreground p-8 border border-dashed rounded-lg">
                                <MapPin className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>Nenhum endereço cadastrado.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {addresses.map((addr) => (
                                    <div
                                        key={addr.id}
                                        className="flex justify-between items-start p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors"
                                    >
                                        <div className="mr-3">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-sm">
                                                    {addr.street}, {addr.number}
                                                </span>
                                                {addr.is_default && (
                                                    <Badge variant="secondary" className="text-[10px] h-5">Padrão</Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {addr.neighborhood} - {addr.city}/{addr.state}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-0.5">
                                                CEP: {addr.zip_code} {addr.complement && `• ${addr.complement}`}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive shrink-0"
                                            onClick={() => setAddressToDelete(addr.id)}
                                            disabled={isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            <ClientAddressDialog
                open={isAddDialogOpen}
                onOpenChange={setIsAddDialogOpen}
                clientId={clientId}
            />

            <AlertDialog open={!!addressToDelete} onOpenChange={(open) => !open && setAddressToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir endereço?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover este endereço? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
