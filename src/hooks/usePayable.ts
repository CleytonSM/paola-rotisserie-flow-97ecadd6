import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { DateRange } from "react-day-picker";
import type { AccountPayable, Supplier, StatusFilter } from "@/components/ui/payable/types";
import {
    getAccountsPayable,
    getAccountsPayableByDateRange,
    createAccountPayable,
    updateAccountPayable,
    deleteAccountPayable,
    getSuppliers,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { payableSchema, type PayableSchema } from "@/schemas/payable.schema";
import { PAGE_SIZE } from "@/config/constants";

export function usePayable() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [accounts, setAccounts] = useState<AccountPayable[]>([]);
    const [suppliers, setSuppliers] = useState<Supplier[]>([]);

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

    const form = useForm<PayableSchema>({
        resolver: zodResolver(payableSchema),
        defaultValues: {
            supplier_id: "",
            value: 0,
            payment_method: "cash",
            notes: "",
            due_date: undefined,
            payment_date: undefined,
            status: "pending",
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
            ? await getAccountsPayableByDateRange({ from: dateRange.from, to: dateRange.to }, page, pageSize)
            : await getAccountsPayable(page, pageSize);

        const suppliersResult = await getSuppliers();

        if (accountsResult.error) {
            toast.error("Erro ao carregar contas");
        } else if (accountsResult.data) {
            setAccounts(accountsResult.data as AccountPayable[]);
            setTotalCount(accountsResult.count || 0);
        }

        if (suppliersResult.error) {
            toast.error("Erro ao carregar fornecedores");
        } else if (suppliersResult.data) {
            setSuppliers(suppliersResult.data as Supplier[]);
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

    const onSubmit = async (data: PayableSchema) => {
        try {
            let paymentDate = data.payment_date;
            if (data.status === "paid" && !paymentDate) {
                paymentDate = new Date();
            }

            const dataToSubmit = {
                ...data,
                due_date: data.due_date ? formatDateToYYYYMMDD(data.due_date) : undefined,
                payment_date: paymentDate ? formatDateToYYYYMMDD(paymentDate) : null,
            };

            const { error } = editingId
                ? await updateAccountPayable(editingId, dataToSubmit)
                : await createAccountPayable(dataToSubmit);

            if (error) {
                toast.error(editingId ? "Erro ao atualizar conta" : "Erro ao criar conta");
                return false;
            }

            toast.success(editingId ? "Conta atualizada com sucesso!" : "Conta criada com sucesso!");
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

    const handleEdit = (account: AccountPayable) => {
        setEditingId(account.id);
        form.reset({
            supplier_id: account.supplier_id || "",
            value: account.value,
            payment_method: account.payment_method,
            notes: account.notes || "",
            due_date: account.due_date ? new Date(account.due_date) : undefined,
            payment_date: account.payment_date ? new Date(account.payment_date) : undefined,
            status: (account.status as "pending" | "paid" | "overdue") || "pending",
        });
        setDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingId(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!deletingId) return;
        const { error } = await deleteAccountPayable(deletingId);
        if (error) {
            toast.error("Erro ao excluir conta");
        } else {
            toast.success("Conta excluída com sucesso!");
            loadData();
        }
        setDeleteDialogOpen(false);
        setDeletingId(null);
    };

    const handleStatusChange = async (id: string, newStatus: "pending" | "paid") => {
        const account = accounts.find((acc) => acc.id === id);
        if (!account || account.status === newStatus) return;

        const updateData: { status: string; payment_date?: string | null } = { status: newStatus };
        if (newStatus === "paid" && !account.payment_date) {
            updateData.payment_date = formatDateToYYYYMMDD(new Date());
        } else if (newStatus === "pending") {
            updateData.payment_date = null;
        }

        const { error } = await updateAccountPayable(id, updateData);
        if (error) {
            toast.error("Erro ao atualizar status");
        } else {
            toast.success("Status atualizado!");
            setAccounts(
                accounts.map((acc) =>
                    acc.id === id
                        ? {
                            ...acc,
                            status: newStatus,
                            payment_date: newStatus === "pending" ? undefined : (updateData.payment_date || acc.payment_date),
                        }
                        : acc
                )
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
        suppliers,
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
