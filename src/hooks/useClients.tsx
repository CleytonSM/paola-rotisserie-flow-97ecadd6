import { Client } from "@/components/ui/clients/types";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getClients, createClient, updateClient, deleteClient } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { maskCpfCnpj, maskPhone } from "@/components/ui/clients/utils";
import { useClientForm } from "./useClientForm";
import { Pencil, Trash2 } from "lucide-react";
import { DataTableAction } from "@/components/ui/data-table-action";
import { ColumnDef } from "@/components/ui/data-table";

export const useClients = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            const { session } = await getCurrentSession();
            if (!session) {
                navigate("/auth");
                return;
            }
            loadData();
        };
        checkAuth();
    }, [navigate]);

    const loadData = async () => {
        setLoading(true);
        const result = await getClients();
        if (result.error) {
            toast.error("Erro ao carregar clientes");
        } else if (result.data) {
            setClients(result.data as Client[]);
        }
        setLoading(false);
    };

    const handleEdit = (client: Client) => {
        setEditingId(client.id);
        setDialogOpen(true);
        return {
            name: client.name,
            cpf_cnpj: client.cpf_cnpj ? maskCpfCnpj(client.cpf_cnpj) : "",
            email: client.email || "",
            phone: client.phone ? maskPhone(client.phone) : "",
        };
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const { error } = await deleteClient(deletingId);
        if (error) {
            toast.error("Erro ao excluir cliente");
        } else {
            toast.success("Cliente excluído com sucesso!");
            loadData();
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleCreate = async (data: any) => {
        const { error } = await createClient(data);
        if (error) {
            toast.error("Erro ao criar cliente");
            return false;
        }
        toast.success("Cliente criado com sucesso!");
        loadData();
        return true;
    };

    const handleUpdate = async (id: string, data: any) => {
        const { error } = await updateClient(id, data);
        if (error) {
            toast.error("Erro ao atualizar cliente");
            return false;
        }
        toast.success("Cliente atualizado com sucesso!");
        loadData();
        return true;
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setEditingId(null);
        }
    };

    const filteredClients = useMemo(() => {
        return clients.filter((client) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                client.name.toLowerCase().includes(searchLower) ||
                (client.cpf_cnpj && client.cpf_cnpj.includes(searchLower)) ||
                (client.email && client.email.toLowerCase().includes(searchLower)) ||
                (client.phone && client.phone.includes(searchLower))
            );
        });
    }, [clients, searchTerm]);

    const [editFormData, setEditFormData] = useState<any>(null);

    const { form, onSubmit } = useClientForm({
        editingId,
        defaultValues: editFormData,
        onSuccess: async (data) => {
            const success = editingId
                ? await handleUpdate(editingId, data)
                : await handleCreate(data);

        if (success) {
            setDialogOpen(false);
            setEditFormData(null);
        }

        return success;
        },
    });

    const handleEditClick = (client: Client) => {
        const formData = handleEdit(client);
        setEditFormData(formData);
    };

    const handleDialogOpenChange = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
        setEditFormData(null);
        }
    };

    const columns: ColumnDef<Client>[] = [
        {
        header: "Cliente",
        cell: (client) => (
            <div>
            <div className="font-medium text-foreground">{client.name}</div>
            <div className="text-sm text-muted-foreground">{client.email || "Sem email"}</div>
            </div>
        ),
        },
        {
        header: "Documento",
        cell: (client) => (
            <span className="font-sans tabular-nums text-muted-foreground">
            {maskCpfCnpj(client.cpf_cnpj)}
            </span>
        ),
        },
        {
        header: "Telefone",
        cell: (client) => (
            <span className="font-sans tabular-nums text-muted-foreground">
            {maskPhone(client.phone)}
            </span>
        ),
        },
        {
        header: "Ações",
        headerClassName: "text-right",
        cellClassName: "text-right",
        cell: (client) => (
            <>
            <DataTableAction
                tooltip="Editar cliente"
                onClick={() => handleEditClick(client)}
                className="hover:text-primary"
                icon={Pencil}
            />
            <DataTableAction
                tooltip="Excluir cliente"
                onClick={() => handleDeleteClick(client.id)}
                className="hover:text-destructive"
                icon={Trash2}
            />
            </>
        ),
        },
    ];
    
    return {
        loading,
        clients: filteredClients,
        searchTerm,
        setSearchTerm,
        dialogOpen,
        setDialogOpen: handleDialogClose,
        editingId,
        deleteDialogOpen,
        setDeleteDialogOpen,
        handleEdit,
        handleDeleteClick,
        handleDeleteConfirm,
        handleCreate,
        handleUpdate,
        form,
        onSubmit,
        columns,
        handleDialogOpenChange,
    };
};

