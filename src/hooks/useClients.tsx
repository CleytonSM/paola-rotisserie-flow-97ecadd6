import { Client } from "@/components/features/clients/types";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getClientsList, getClientById, createClient, updateClient, deleteClient } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { maskCpfCnpj, maskPhone } from "@/components/features/clients/utils";
import { useClientForm } from "./useClientForm";
import { Pencil, Trash2 } from "lucide-react";
import { DataTableAction } from "@/components/ui/data-table-action";
import { ColumnDef } from "@/components/ui/generic-table";
import { PAGE_SIZE } from "@/config/constants";

export const useClients = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState<Client[]>([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(PAGE_SIZE);

    const [totalCount, setTotalCount] = useState(0);

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
    }, [navigate, page, searchTerm]);

    const loadData = async () => {
        setLoading(true);
        const result = await getClientsList(searchTerm, page, pageSize);
        if (result.error) {
            toast.error("Erro ao carregar clientes");
        } else if (result.data) {
            setClients(result.data as Client[]);
            setTotalCount(result.count || 0);
        }
        setLoading(false);
    };

    const handleEditSafe = async (client: Client) => {
        const { data, error } = await getClientById(client.id);

        if (error || !data) {
            toast.error("Erro ao carregar detalhes do cliente");
            return null;
        }

        setEditingId(data.id);
        const formData = {
            name: data.name,
            cpf_cnpj: data.cpf_cnpj ? maskCpfCnpj(data.cpf_cnpj) : "",
            email: data.email || "",
            phone: data.phone ? maskPhone(data.phone) : "",
        };
        setDialogOpen(true);
        return formData;
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

    const handleEditClick = async (client: Client) => {
        const formData = await handleEditSafe(client);
        if (formData) {
            setEditFormData(formData);
        }
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
        clients, // Using server-side filtered clients
        searchTerm,
        setSearchTerm,
        page,
        setPage,
        totalCount,
        pageSize,
        dialogOpen,
        setDialogOpen: handleDialogClose,
        editingId,
        deleteDialogOpen,
        setDeleteDialogOpen,
        handleEdit: handleEditSafe,
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

