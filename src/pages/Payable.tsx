import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PayableFormDialog } from "@/components/ui/payable/PayableFormDialog";
import { PayableTable } from "@/components/ui/payable/PayableTable";
import { DeletePayableDialog } from "@/components/ui/payable/DeletePayableDialog";
import type {
  AccountPayable,
  Supplier,
  FormData,
  StatusFilter,
} from "@/components/ui/payable/types";
import {
  getAccountsPayable,
  getAccountsPayableByDateRange,
  createAccountPayable,
  updateAccountPayable,
  deleteAccountPayable,
  getSuppliers,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";
import type { DateRange } from "react-day-picker";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

// --- Schema de Validação ---

const payableSchema = z.object({
  supplier_id: z.string().min(1, "Selecione um fornecedor"),
  value: z.number().positive("Valor deve ser positivo"),
  payment_method: z.string(),
  notes: z.string().optional(),
  due_date: z.date().optional(),
  payment_date: z.date().optional(),
  status: z.string().optional(),
});

// --- Componente Principal ---

export default function Payable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    supplier_id: "",
    value: "",
    payment_method: "cash",
    notes: "",
    due_date: undefined,
    payment_date: undefined,
    status: "pending",
  });

  // --- Carregamento de Dados ---

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

  // Reload data when dateRange changes to apply date filter in API
  useEffect(() => {
    const checkAndLoad = async () => {
      const { session } = await getCurrentSession();
      if (session) {
        loadData();
      }
    };
    checkAndLoad();
  }, [dateRange]);

  const loadData = async () => {
    setLoading(true);

    // Use date range method if dateRange is set, otherwise use regular method
    const accountsResult = dateRange?.from
      ? await getAccountsPayableByDateRange({ from: dateRange.from, to: dateRange.to })
      : await getAccountsPayable();

    const suppliersResult = await getSuppliers();

    if (accountsResult.error) {
      toast.error("Erro ao carregar contas");
    } else if (accountsResult.data) {
      setAccounts(accountsResult.data as AccountPayable[]);
    }

    if (suppliersResult.error) {
      toast.error("Erro ao carregar fornecedores");
    } else if (suppliersResult.data) {
      setSuppliers(suppliersResult.data as Supplier[]);
    }

    setLoading(false);
  };

  // --- Handlers de Ações (CRUD) ---

  const handleEdit = (account: AccountPayable) => {
    setEditingId(account.id);
    setFormData({
      supplier_id: account.supplier_id || "",
      value: account.value.toString(),
      payment_method: account.payment_method,
      notes: account.notes || "",
      due_date: account.due_date ? new Date(account.due_date) : undefined,
      payment_date: account.payment_date ? new Date(account.payment_date) : undefined,
      status: account.status || "pending",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Se status for "paid" e payment_date não estiver definido, define como hoje
      let paymentDate = formData.payment_date;
      if (formData.status === "paid" && !paymentDate) {
        paymentDate = new Date();
      }

      // Converte o valor para float e as datas (se existirem)
      const dataToValidate = {
        ...formData,
        value: parseFloat(formData.value),
        due_date: formData.due_date,
        payment_date: paymentDate,
      };

      const validated = payableSchema.parse(dataToValidate);

      // Converte as datas para formato YYYY-MM-DD (sem hora) para o Supabase
      const formatDateToYYYYMMDD = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const dataToSubmit = {
        ...validated,
        due_date: validated.due_date ? formatDateToYYYYMMDD(validated.due_date) : undefined,
        payment_date: validated.payment_date ? formatDateToYYYYMMDD(validated.payment_date) : null,
      };

      const { error } = editingId
        ? await updateAccountPayable(editingId, dataToSubmit)
        : await createAccountPayable(dataToSubmit);

      if (error) {
        toast.error(editingId ? "Erro ao atualizar conta" : "Erro ao criar conta");
      } else {
        toast.success(editingId ? "Conta atualizada com sucesso!" : "Conta criada com sucesso!");
        setDialogOpen(false);
        setEditingId(null);
        resetFormData();
        loadData();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: "pending" | "paid") => {
    const account = accounts.find((acc) => acc.id === id);
    if (!account || account.status === newStatus) return;

    // Se mudando para "paid" e não tem payment_date, define como hoje
    // Se mudando para "pending", remove payment_date
    const formatDateToYYYYMMDD = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

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
              payment_date: newStatus === "pending" ? undefined : (updateData.payment_date || acc.payment_date)
            }
            : acc
        )
      );
    }
  };

  const resetFormData = () => {
    setFormData({
      supplier_id: "",
      value: "",
      payment_method: "cash",
      notes: "",
      due_date: undefined,
      payment_date: undefined,
      status: "pending",
    });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingId(null);
      resetFormData();
    }
  };

  // --- Filtragem da Tabela ---

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      const status = account.status;
      const searchLower = searchTerm.toLowerCase();

      // Filtro de Status
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "pending" && status === "pending") ||
        (statusFilter === "paid" && status === "paid") ||
        (statusFilter === "overdue" && status === "overdue");

      // Filtro de Busca
      const searchMatch =
        account.supplier?.name.toLowerCase().includes(searchLower) ||
        (account.notes && account.notes.toLowerCase().includes(searchLower)) ||
        account.value.toString().includes(searchLower);

      // Date filtering is now done in the API via getAccountsPayableByDateRange
      return statusMatch && searchMatch;
    });
  }, [accounts, searchTerm, statusFilter]);

  // --- Renderização ---

  return (
    <div className="flex min-h-screen flex-col">

      <main className="container flex-1 py-8 md:py-12">
        {/* Cabeçalho da Página */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
              Contas a Pagar
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Gerencie seus pagamentos e despesas.
            </p>
            <AppBreadcrumb />
          </div>
          <PayableFormDialog
            open={dialogOpen}
            onOpenChange={handleDialogClose}
            formData={formData}
            setFormData={setFormData}
            suppliers={suppliers}
            editingId={editingId}
            onSubmit={handleSubmit}
            onReset={resetFormData}
            loading={submitting}
          />
        </div>

        {/* Tabela de Contas */}
        <PayableTable
          accounts={filteredAccounts}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
        />
      </main>

      {/* Modal de Exclusão */}
      <DeletePayableDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
