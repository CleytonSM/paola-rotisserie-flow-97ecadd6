import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ReceivableFormDialog } from "@/components/ui/receivable/ReceivableFormDialog";
import { ReceivableTable } from "@/components/ui/receivable/ReceivableTable";
import { DeleteReceivableDialog } from "@/components/ui/receivable/DeleteReceivableDialog";
import type {
  AccountReceivable,
  Client,
  FormData,
  StatusFilter,
} from "@/components/ui/receivable/types";
import {
  getAccountsReceivable,
  createAccountReceivable,
  updateAccountReceivable,
  deleteAccountReceivable,
  getClients,
  updateAccountReceivableStatus,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";
import { getAccountStatus } from "@/components/ui/receivable/utils";

// --- Schema de Validação ---

const receivableSchema = z.object({
  client_id: z.string().optional(),
  gross_value: z.number().positive("Valor deve ser positivo"),
  payment_method: z.string(),
  card_brand: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  entry_date: z.string().min(1, "Data de entrada é obrigatória"),
});

// --- Componente Principal ---

export default function Receivable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountReceivable[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Controles da Tabela
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Controles de Modais
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    client_id: "",
    gross_value: "",
    payment_method: "cash",
    card_brand: "",
    tax_rate: "",
    entry_date: undefined,
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

  const loadData = async () => {
    setLoading(true);
    const [accountsResult, clientsResult] = await Promise.all([
      getAccountsReceivable(),
      getClients(),
    ]);

    if (accountsResult.error) {
      toast.error("Erro ao carregar contas");
    } else if (accountsResult.data) {
      setAccounts(accountsResult.data as AccountReceivable[]);
    }

    if (clientsResult.error) {
      toast.error("Erro ao carregar clientes");
    } else if (clientsResult.data) {
      setClients(clientsResult.data as Client[]);
    }

    setLoading(false);
  };

  // --- Handlers de Ações (CRUD) ---

  const handleEdit = (account: AccountReceivable) => {
    setEditingId(account.id);
    setFormData({
      client_id: account.client_id || "",
      gross_value: account.gross_value.toString(),
      payment_method: account.payment_method,
      card_brand: account.card_brand || "",
      tax_rate: account.tax_rate?.toString() || "",
      entry_date: account.entry_date ? new Date(account.entry_date) : undefined,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const validated = receivableSchema.parse({
        client_id: formData.client_id || undefined,
        gross_value: parseFloat(formData.gross_value),
        payment_method: formData.payment_method,
        card_brand: formData.card_brand || undefined,
        tax_rate: formData.tax_rate ? parseFloat(formData.tax_rate) : undefined,
        entry_date: formData.entry_date ? formData.entry_date.toISOString().split("T")[0] : "",
      });

      const { error } = editingId
        ? await updateAccountReceivable(editingId, validated)
        : await createAccountReceivable(validated);

      if (error) {
        toast.error(editingId ? "Erro ao atualizar entrada" : "Erro ao criar entrada");
      } else {
        toast.success(editingId ? "Entrada atualizada com sucesso!" : "Entrada criada com sucesso!");
        setDialogOpen(false);
        setEditingId(null);
        resetFormData();
        loadData();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: "pending" | "received") => {
    const account = accounts.find((acc) => acc.id === id);
    if (getAccountStatus(account!) === newStatus) return;

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

  const resetFormData = () => {
    setFormData({
      client_id: "",
      gross_value: "",
      payment_method: "cash",
      card_brand: "",
      tax_rate: "",
      entry_date: undefined,
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
      const status = getAccountStatus(account);
      const searchLower = searchTerm.toLowerCase();

      // Filtro de Status
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "pending" && status === "pending") ||
        (statusFilter === "received" && status === "received") ||
        (statusFilter === "overdue" && status === "overdue");

      // Filtro de Busca
      const searchMatch =
        account.client?.name.toLowerCase().includes(searchLower) ||
        (account.client?.cpf_cnpj && account.client.cpf_cnpj.includes(searchLower)) ||
        (!account.client && "venda avulsa".includes(searchLower)) ||
        account.net_value.toString().includes(searchLower) ||
        account.gross_value.toString().includes(searchLower);

      return statusMatch && searchMatch;
    });
  }, [accounts, searchTerm, statusFilter]);

  // --- Renderização ---

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        {/* Cabeçalho da Página */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
              Contas a Receber
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Gerencie suas entradas e recebimentos.
            </p>
          </div>
          <ReceivableFormDialog
            open={dialogOpen}
            onOpenChange={handleDialogClose}
            formData={formData}
            setFormData={setFormData}
            clients={clients}
            editingId={editingId}
            onSubmit={handleSubmit}
            onReset={resetFormData}
          />
        </div>

        {/* Tabela de Contas */}
        <ReceivableTable
          accounts={filteredAccounts}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          onStatusChange={handleStatusChange}
        />
      </main>

      {/* Modal de Exclusão */}
      <DeleteReceivableDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
