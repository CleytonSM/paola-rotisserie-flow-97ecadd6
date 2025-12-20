import { useState, useRef, useEffect } from "react";
import { Search, X, User, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";
import { useClients } from "@/hooks/useClients";
import { Client } from "@/components/features/clients/types";
import { maskCpfCnpj } from "@/components/features/clients/utils";
import { ClientFormDialog } from "@/components/features/clients/ClientFormDialog";
import { useClientForm } from "@/hooks/useClientForm";
import { createClient } from "@/services/database/clients";
import { createClientAddress } from "@/services/database/addresses";
import { toast } from "sonner";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientSearchProps {
    selectedClient: Client | null;
    onSelectClient: (client: Client | null) => void;
}

export function ClientSearch({ selectedClient, onSelectClient }: ClientSearchProps) {
    const { clients } = useClients({ fetchAll: true });
    const [searchQuery, setSearchQuery] = useState("");
    const [showPreview, setShowPreview] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Filter clients based on search query
    const filteredClients = clients.filter(client => {
        if (!searchQuery) return false;
        const query = searchQuery.toLowerCase();
        return (
            client.name.toLowerCase().includes(query) ||
            (client.cpf_cnpj && client.cpf_cnpj.includes(query)) ||
            (client.email && client.email.toLowerCase().includes(query))
        );
    });

    // Close preview when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowPreview(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (client: Client) => {
        onSelectClient(client);
        setSearchQuery("");
        setShowPreview(false);
    };

    const handleClear = () => {
        onSelectClient(null);
        setSearchQuery("");
    };

    const handleCreate = async (data: any) => {
        // Extract address data
        const {
            address_zip_code,
            address_street,
            address_number,
            address_neighborhood,
            address_city,
            address_state,
            address_complement,
            ...clientData
        } = data;

        const { data: newClient, error } = await createClient(clientData);
        if (error || !newClient) {
            toast.error("Erro ao criar cliente");
            return false;
        }

        // If there is address data, create the address
        if (address_zip_code && address_street && address_number) {
            await createClientAddress({
                client_id: newClient.id,
                zip_code: address_zip_code,
                street: address_street,
                number: address_number,
                neighborhood: address_neighborhood || "",
                city: address_city || "",
                state: address_state || "",
                complement: address_complement || "",
                is_default: true // First address is default
            });
        }

        toast.success("Cliente criado com sucesso!");
        onSelectClient(newClient);
        setIsDialogOpen(false);
        return true;
    };

    const { form, onSubmit } = useClientForm({
        editingId: null,
        onSuccess: handleCreate,
    });

    if (selectedClient) {
        return (
            <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-medium text-foreground">{selectedClient.name}</p>
                        {selectedClient.cpf_cnpj && (
                            <p className="text-sm text-muted-foreground">{maskCpfCnpj(selectedClient.cpf_cnpj)}</p>
                        )}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleClear}
                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                >
                    <X className="h-5 w-5" />
                </Button>
            </div>
        );
    }

    return (
        <div className="relative" ref={containerRef}>
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        className="pl-12 h-14 text-base shadow-sm border-border focus:border-primary focus:ring-primary/20 rounded-xl bg-card"
                        placeholder="Buscar cliente por nome ou CPF/CNPJ..."
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setShowPreview(true);
                        }}
                        onFocus={() => setShowPreview(true)}
                    />
                </div>
                <TooltipProvider delayDuration={100}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                className="h-14 w-14 rounded-xl shrink-0 shadow-md transition-transform duration-300 ease-out hover:scale-105"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                <Plus className="h-6 w-6" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Cadastrar Cliente</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <AnimatePresence>
                {showPreview && searchQuery && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: "easeOut" }}
                        className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border max-h-60 overflow-y-auto z-50 overflow-hidden"
                    >
                        {filteredClients.length > 0 ? (
                            filteredClients.map((client) => (
                                <div
                                    key={client.id}
                                    className="flex items-center justify-between p-3 hover:bg-accent cursor-pointer transition-colors border-b border-border last:border-0"
                                    onClick={() => handleSelect(client)}
                                >
                                    <div className="flex flex-col">
                                        <span className="font-medium text-gray-800">{client.name}</span>
                                        {client.cpf_cnpj && (
                                            <span className="text-xs text-muted-foreground">
                                                {maskCpfCnpj(client.cpf_cnpj)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                                Nenhum cliente encontrado.
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            <ClientFormDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                form={form}
                onSubmit={onSubmit}
                editingId={null}
                showTrigger={false}
            />
        </div>
    );
}

