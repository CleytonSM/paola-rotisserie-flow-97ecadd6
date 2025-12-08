import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import type { AccountReceivable, Client, StatusFilter } from "@/components/ui/receivable/types";
import {
    getAccountsReceivable,
    getAccountsReceivableByDateRange,
    createAccountReceivable,
    updateAccountReceivable,
    deleteAccountReceivable,
    updateAccountReceivableStatus,
    getClients,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { receivableSchema, type ReceivableSchema } from "@/schemas/receivable.schema";
import { getAccountStatus } from "@/components/ui/receivable/utils";
import { PAGE_SIZE } from "@/config/constants";

export function useReceivable() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
    const [clients, setClients] = useState<Client[]>([]);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
    const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

    // Pagination
    const [page, setPage] = useState(1);
    const [pageSize] = useState(PAGE_SIZE);

    const [totalCount, setTotalCount] = useState(0);

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const form = useForm<ReceivableSchema>({
        resolver: zodResolver(receivableSchema),
        defaultValues: {
            client_id: "",
            gross_value: 0,
            payment_method: "cash",
            card_brand: "",
            tax_rate: 0,
            entry_date: new Date(),
        },
    });

    // --- Data Loading ---

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

    useEffect(() => {
        const checkAndLoad = async () => {
            const { session } = await getCurrentSession();
            if (session) {
                loadData();
            }
        };
        checkAndLoad();
    }, [dateRange, page]);

    const loadData = async () => {
        setLoading(true);

        const accountsResult = dateRange?.from
            ? await getAccountsReceivableByDateRange({ from: dateRange.from, to: dateRange.to }, page, pageSize)
            : await getAccountsReceivable(page, pageSize);

        const clientsResult = await getClients();

        if (accountsResult.error) {
            toast.error("Erro ao carregar contas");
        } else if (accountsResult.data) {
            setAccounts(accountsResult.data as AccountReceivable[]);
            setTotalCount(accountsResult.count || 0);
        }

        if (clientsResult.error) {
            toast.error("Erro ao carregar clientes");
        } else if (clientsResult.data) {
            setClients(clientsResult.data as Client[]);
        }

        setLoading(false);
    };

    // --- CRUD Handlers ---

    const formatDateToYYYYMMDD = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const onSubmit = async (data: ReceivableSchema) => {
        try {
            const dataToSubmit = {
                ...data,
                entry_date: data.entry_date ? formatDateToYYYYMMDD(data.entry_date) : "",
            };

            const { error } = editingId
                ? await updateAccountReceivable(editingId, dataToSubmit)
                : await createAccountReceivable(dataToSubmit);

            if (error) {
                toast.error(editingId ? "Erro ao atualizar entrada" : "Erro ao criar entrada");
                return false;
            }

            toast.success(editingId ? "Entrada atualizada com sucesso!" : "Entrada criada com sucesso!");
            setDialogOpen(false);
            setEditingId(null);
            form.reset();
            loadData();
            return true;
        } catch (err) {
            toast.error("Erro inesperado ao processar formulário");
            return false;
        }
    };

    const handleEdit = (account: AccountReceivable) => {
        setEditingId(account.id);
        form.reset({
            client_id: account.client_id || "",
            gross_value: account.gross_value,
            payment_method: account.payment_method,
            card_brand: account.card_brand || "",
            tax_rate: account.tax_rate || 0,
            entry_date: account.entry_date ? new Date(account.entry_date) : new Date(),
        });
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const { error } = await deleteAccountReceivable(deletingId);
        if (error) {
            toast.error("Erro ao excluir entrada");
        } else {
            toast.success("Entrada excluída com sucesso!");
            loadData();
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleStatusChange = async (id: string, newStatus: "pending" | "received") => {
        const account = accounts.find((acc) => acc.id === id);
        if (!account || getAccountStatus(account) === newStatus) return;

        const { error } = await updateAccountReceivableStatus(id, newStatus);
        if (error) {
            toast.error("Erro ao atualizar status");
        } else {
            toast.success("Status atualizado!");
            setAccounts(
                accounts.map((acc) => (acc.id === id ? { ...acc, status: newStatus } : acc))
            );
        }
    };

    const handleDialogClose = (open: boolean) => {
        setDialogOpen(open);
        if (!open) {
            setEditingId(null);
            form.reset();
        }
    };

    return {
        loading,
        accounts, // Server side filtered
        clients,
        searchTerm,
        setSearchTerm,
        statusFilter,
        setStatusFilter,
        dateRange,
        setDateRange,
        dialogOpen,
        setDialogOpen: handleDialogClose,
        editingId,
        deleteDialogOpen,
        setDeleteDialogOpen,
        deletingId,
        form,
        onSubmit: form.handleSubmit(onSubmit),
        handleEdit,
        handleDeleteClick,
        handleDeleteConfirm,
        handleStatusChange,
        page,
        setPage,
        pageSize,
        totalCount
    };
}
