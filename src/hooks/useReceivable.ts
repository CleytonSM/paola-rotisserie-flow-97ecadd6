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
    getReceivablePayments,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { receivableSchema, type ReceivableSchema } from "@/schemas/receivable.schema";
import { getAccountStatus } from "@/components/ui/receivable/utils";
import { PAGE_SIZE } from "@/config/constants";
import type { PaymentEntry } from "@/components/ui/partial-payment/PartialPaymentBuilder";

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

    // Partial Payment State
    const [isPartialPayment, setIsPartialPayment] = useState(false);
    const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);

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
            // Validate partial payment if enabled
            if (isPartialPayment && !editingId) {
                if (paymentEntries.length === 0) {
                    toast.error("Adicione pelo menos um método de pagamento");
                    return false;
                }
                
                const totalAllocated = paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
                if (Math.abs(totalAllocated - data.gross_value) > 0.01) {
                    toast.error("O valor alocado deve ser igual ao valor bruto");
                    return false;
                }
            }

            const dataToSubmit = {
                ...data,
                client_id: data.client_id || null, // Convert empty string to null
                entry_date: data.entry_date ? formatDateToYYYYMMDD(data.entry_date) : "",
            };

            if (editingId) {
                // Edit mode
                if (isPartialPayment && paymentEntries.length > 0) {
                    // Update with payment breakdown
                    const payments = paymentEntries.map(entry => ({
                        amount: entry.amount,
                        payment_method: entry.method,
                        card_brand: entry.details?.cardBrand,
                        pix_key_id: entry.details?.pixKeyId,
                        tax_rate: 0
                    }));

                    const { error } = await updateAccountReceivable(editingId, dataToSubmit, payments);
                    if (error) {
                        toast.error("Erro ao atualizar entrada");
                        return false;
                    }
                } else {
                    // Regular update without payment changes
                    const { error } = await updateAccountReceivable(editingId, dataToSubmit);
                    if (error) {
                        toast.error("Erro ao atualizar entrada");
                        return false;
                    }
                }
            } else {
                // Create mode
                if (isPartialPayment) {
                    // Convert payment entries to ReceivablePayment format
                    const payments = paymentEntries.map(entry => ({
                        amount: entry.amount,
                        payment_method: entry.method,
                        card_brand: entry.details?.cardBrand,
                        pix_key_id: entry.details?.pixKeyId,
                        tax_rate: 0 // You can calculate based on card brand if needed
                    }));

                    const { error } = await createAccountReceivable(dataToSubmit, payments);
                    if (error) {
                        toast.error("Erro ao criar entrada");
                        return false;
                    }
                } else {
                    // Single payment mode
                    const { error } = await createAccountReceivable(dataToSubmit);
                    if (error) {
                        toast.error("Erro ao criar entrada");
                        return false;
                    }
                }
            }

            toast.success(editingId ? "Entrada atualizada com sucesso!" : "Entrada criada com sucesso!");
            setDialogOpen(false);
            setEditingId(null);
            form.reset();
            setPaymentEntries([]);
            setIsPartialPayment(false);
            loadData();
            return true;
        } catch (err) {
            toast.error("Erro inesperado ao processar formulário");
            return false;
        }
    };

    const handleEdit = async (account: AccountReceivable) => {
        setEditingId(account.id);
        form.reset({
            client_id: account.client_id || "",
            gross_value: account.gross_value,
            payment_method: account.payment_method,
            card_brand: account.card_brand || "",
            tax_rate: account.tax_rate || 0,
            entry_date: account.entry_date ? new Date(account.entry_date) : new Date(),
        });

        // Load existing payments if any
        const { data: payments, error } = await getReceivablePayments(account.id);
        if (!error && payments && payments.length > 0) {
            // Convert to PaymentEntry format for display
            const entries: PaymentEntry[] = payments.map((payment: any, index) => ({
                id: `existing-${index}`,
                method: payment.payment_method,
                amount: payment.amount,
                details: (payment.card_brand || payment.pix_key_id) ? {
                    cardBrand: payment.card_brand,
                    pixKeyId: payment.pix_key_id
                } : undefined
            }));
            setPaymentEntries(entries);
            setIsPartialPayment(true); // Mark as partial payment for display
        } else {
            setPaymentEntries([]);
            setIsPartialPayment(false);
        }

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
            // Reset partial payment state
            setPaymentEntries([]);
            setIsPartialPayment(false);
        }
    };

    const getTotalAllocated = () => {
        return paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
    };

    const getRemainingBalance = () => {
        const grossValue = form.watch("gross_value") || 0;
        return grossValue - getTotalAllocated();
    };

    const addPaymentEntry = (entry: PaymentEntry) => {
        setPaymentEntries([...paymentEntries, entry]);
    };

    const removePaymentEntry = (id: string) => {
        setPaymentEntries(paymentEntries.filter(entry => entry.id !== id));
    };

    const updatePaymentEntry = (id: string, amount: number) => {
        setPaymentEntries(paymentEntries.map(entry => 
            entry.id === id ? { ...entry, amount } : entry
        ));
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
        totalCount,
        // Partial payment exports
        isPartialPayment,
        setIsPartialPayment,
        paymentEntries,
        addPaymentEntry,
        removePaymentEntry,
        updatePaymentEntry,
        getTotalAllocated,
        getRemainingBalance
    };
}
