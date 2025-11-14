import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card"; // Removido CardTitle não usado
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker"; // Importando o novo componente
import { DateRangePicker } from "@/components/ui/date-range-picker"; // ADICIONADO
import type { DateRange } from "react-day-picker"; // ADICIONADO
import { Plus, Search, Pencil, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getAccountsPayable,
  createAccountPayable,
  updateAccountPayable,
  deleteAccountPayable,
  getSuppliers,
  updateAccountPayableStatus,
} from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

// --- Schema e Tipos ---

const payableSchema = z.object({
  supplier_id: z.string().min(1, "Selecione um fornecedor"),
  value: z.number().positive("Valor deve ser positivo"),
  payment_method: z.string(),
  notes: z.string().optional(),
  due_date: z.date().optional(), // Mudado para Date
  status: z.string().optional(),
});

type Supplier = {
  id: string;
  name: string;
};

type AccountPayable = {
  id: string;
  supplier_id: string;
  value: number;
  payment_method: string;
  notes?: string;
  due_date?: string; // Mantém string do DB
  status: "pending" | "paid";
  supplier?: Supplier;
};

// Interface para o estado do formulário
type FormData = {
  supplier_id: string;
  value: string;
  payment_method: string;
  notes: string;
  due_date: Date | undefined; // Mudado para Date
  status: string;
};

type StatusFilter = "all" | "pending" | "paid" | "overdue";

// --- Componente Principal ---

export default function Payable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountPayable[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined); // ADICIONADO

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    supplier_id: "",
    value: "",
    payment_method: "cash",
    notes: "",
    due_date: undefined, // Valor inicial para Date
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

  const loadData = async () => {
    setLoading(true);
    const [accountsResult, suppliersResult] = await Promise.all([
      getAccountsPayable(),
      getSuppliers(),
    ]);

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
      due_date: account.due_date ? new Date(account.due_date) : undefined, // Converte string para Date
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
    try {
      // Converte o valor para float e a data (se existir)
      const dataToValidate = {
        ...formData,
        value: parseFloat(formData.value),
        due_date: formData.due_date,
      };

      const validated = payableSchema.parse(dataToValidate);

      // Converte a data para string ISO para o Supabase
      const dataToSubmit = {
        ...validated,
        due_date: validated.due_date ? validated.due_date.toISOString() : undefined,
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
    }
  };

  const handleStatusChange = async (id: string, newStatus: "pending" | "paid") => {
    const account = accounts.find((acc) => acc.id === id);
    if (!account || getAccountStatus(account) === newStatus) return;

    const { error } = await updateAccountPayableStatus(id, newStatus);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado!");
      setAccounts(
        accounts.map((acc) => (acc.id === id ? { ...acc, status: newStatus } : acc)),
      );
    }
  };

  const resetFormData = () => {
    setFormData({
      supplier_id: "",
      value: "",
      payment_method: "cash",
      notes: "",
      due_date: undefined, // Reseta para undefined
      status: "pending",
    });
  };

  // --- Funções Utilitárias e de Formatação ---

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const getAccountStatus = (account: AccountPayable): "paid" | "pending" | "overdue" => {
    if (account.status === "paid") return "paid";
    if (
      account.due_date &&
      new Date(account.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
      account.status !== "paid"
    ) {
      return "overdue";
    }
    return "pending";
  };

  const translateStatus = (status: "paid" | "pending" | "overdue") => {
    const translations = { paid: "Pago", pending: "Pendente", overdue: "Vencido" };
    return translations[status] || status;
  };

  const getStatusBadgeClass = (status: "paid" | "pending" | "overdue") => {
    switch (status) {
      case "paid":
        return "bg-secondary/20 text-secondary";
      case "overdue":
        return "bg-destructive/20 text-destructive";
      case "pending":
      default:
        return "bg-primary/20 text-primary-hover";
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
        (statusFilter === "paid" && status === "paid") ||
        (statusFilter === "overdue" && status === "overdue");

      // Filtro de Busca
      const searchMatch =
        account.supplier?.name.toLowerCase().includes(searchLower) ||
        (account.notes && account.notes.toLowerCase().includes(searchLower)) ||
        account.value.toString().includes(searchLower);

      // Filtro de Data (ADICIONADO)
      const dateMatch = (() => {
        if (!dateRange?.from) return true; // Sem filtro de data
        if (!account.due_date) return false; // Conta sem data não pode dar match

        const dueDate = new Date(account.due_date);
        dueDate.setHours(0, 0, 0, 0); // Normalizar

        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        // Se 'to' não estiver definido, é um filtro de dia único
        if (!dateRange.to) {
          return dueDate.getTime() === fromDate.getTime();
        }

        const toDate = new Date(dateRange.to);
        toDate.setHours(0, 0, 0, 0);
        
        return dueDate >= fromDate && dueDate <= toDate;
      })();

      return statusMatch && searchMatch && dateMatch; // ADICIONADO dateMatch
    });
  }, [accounts, searchTerm, statusFilter, dateRange]); // ADICIONADO dateRange

  // --- Renderização ---

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

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
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) {
                setEditingId(null);
                resetFormData();
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl tracking-wide">
                  {editingId ? "Editar Conta" : "Adicionar Conta"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Fornecedor</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  {/* === COMPONENTE APLICADO === */}
                  <DatePicker
                    date={formData.due_date}
                    setDate={(date) => setFormData({ ...formData, due_date: date })}
                  />
                  {/* ============================ */}
                </div>
                <div className="space-y-2">
                  <Label>Método de Pagamento</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(v) => setFormData({ ...formData, payment_method: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="paid">Pago</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Observações</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ex: Compra semanal de material..."
                  />
                </div>
                <Button type="submit" className="w-full sm:col-span-2">
                  {editingId ? "Salvar Alterações" : "Adicionar Conta"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Card da Tabela */}
        <Card className="overflow-hidden shadow-md shadow-[#F0E6D2]/30">
          <CardHeader className="flex flex-col gap-4 border-b bg-accent/30 p-4 md:flex-row md:items-center md:justify-between md:p-6">
            {/* Barra de Busca */}
            <div className="relative w-full md:max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por fornecedor, notas, valor..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filtros */}
            <div className="flex flex-wrap gap-2">
              {/* FILTRO DE PERÍODO (ADICIONADO) */}
              <DateRangePicker
                date={dateRange}
                setDate={setDateRange}
                className="[&_button]:h-9 [&_button]:w-full [&_button]:md:w-[260px]" // Estilo p/ se alinhar
              />
              
              <Button variant={statusFilter === 'all' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')} className={cn(statusFilter === 'all' && 'border-primary text-primary-hover')}>Todos</Button>
              <Button variant={statusFilter === 'pending' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('pending')} className={cn(statusFilter === 'pending' && 'border-primary text-primary-hover')}>Pendentes</Button>
              <Button variant={statusFilter === 'overdue' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('overdue')} className={cn(statusFilter === 'overdue' && 'border-destructive text-destructive')}>Vencidos</Button>
              <Button variant={statusFilter === 'paid' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('paid')} className={cn(statusFilter === 'paid' && 'border-secondary text-secondary')}>Pagos</Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Fornecedor</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Vencimento</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-right">Valor</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredAccounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        {statusFilter === 'all' && searchTerm === '' && !dateRange?.from
                          ? "Nenhuma conta registrada."
                          : "Nenhuma conta encontrada com esses filtros."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map(account => {
                      const status = getAccountStatus(account);
                      return (
                        <TableRow key={account.id} className="hover:bg-accent/30">
                          <TableCell className="py-4">
                            <div className="font-medium text-foreground">{account.supplier?.name || "N/A"}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">{account.notes}</div>
                          </TableCell>
                          <TableCell className={cn("font-sans", status === 'overdue' && "text-destructive")}>
                            {formatDate(account.due_date)}
                          </TableCell>
                          <TableCell>
                            <Select value={status} onValueChange={(value) => handleStatusChange(account.id, value as "pending" | "paid")}>
                              <SelectTrigger className="h-auto w-auto min-w-[110px] border-0 bg-transparent p-0 focus:ring-0">
                                <SelectValue asChild>
                                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getStatusBadgeClass(status))}>
                                    {translateStatus(status)}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-sans text-base font-medium tabular-nums text-destructive">
                            {formatCurrency(account.value)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(account)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(account.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Modal de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl tracking-wide">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}