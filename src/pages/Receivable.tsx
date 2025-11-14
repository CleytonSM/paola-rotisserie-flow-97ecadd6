import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header"; // Importação real
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  getAccountsReceivable,
  createAccountReceivable,
  updateAccountReceivable,
  deleteAccountReceivable,
  getClients,
  updateAccountReceivableStatus,
} from "@/services/database"; // Importações reais
import { getCurrentSession } from "@/services/auth"; // Importação real
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

// --- Schema e Tipos ---

const receivableSchema = z.object({
  client_id: z.string().optional(),
  gross_value: z.number().positive("Valor deve ser positivo"),
  payment_method: z.string(),
  card_brand: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
  due_date: z.string().optional(),
});

type Client = {
  id: string;
  name: string;
  cpf_cnpj?: string;
};

type AccountReceivable = {
  id: string;
  client_id?: string;
  gross_value: number;
  net_value: number;
  payment_method: string;
  card_brand?: string;
  tax_rate?: number;
  due_date?: string;
  status: "pending" | "received";
  client?: Client;
};

type StatusFilter = "all" | "pending" | "received" | "overdue";

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

  const [formData, setFormData] = useState({
    client_id: "",
    gross_value: "",
    payment_method: "cash",
    card_brand: "",
    tax_rate: "",
    due_date: "",
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
      due_date: account.due_date ? new Date(account.due_date).toISOString().split("T")[0] : "",
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
        due_date: formData.due_date || undefined,
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
    const account = accounts.find(acc => acc.id === id);
    if (getAccountStatus(account!) === newStatus) return;

    const { error } = await updateAccountReceivableStatus(id, newStatus);
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
     setFormData({ client_id: "", gross_value: "", payment_method: "cash", card_brand: "", tax_rate: "", due_date: "" });
  };

  // --- Funções Utilitárias e de Formatação ---

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const formatDate = (date: string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
  };

  const maskCpfCnpj = (value: string | undefined) => {
    if (!value) return "";
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  const getAccountStatus = (account: AccountReceivable): "received" | "pending" | "overdue" => {
    if (account.status === "received") return "received";
    if (account.due_date && new Date(account.due_date).setHours(0,0,0,0) < new Date().setHours(0,0,0,0) && account.status !== "received") {
      return "overdue";
    }
    return "pending";
  };

  const translateStatus = (status: "received" | "pending" | "overdue") => {
    const translations = { received: "Recebido", pending: "Pendente", overdue: "Vencido" };
    return translations[status] || status;
  };

  const getStatusBadgeClass = (status: "received" | "pending" | "overdue") => {
    switch (status) {
      case "received": return "bg-secondary/20 text-secondary";
      case "overdue": return "bg-destructive/20 text-destructive";
      case "pending": default: return "bg-primary/20 text-primary-hover";
    }
  };

  // --- Filtragem da Tabela ---

  const filteredAccounts = useMemo(() => {
    // NOTA: A busca é nos *clientes*, não nas contas. A lógica de filtragem da tabela
    // deve ser ajustada se a busca for para as *contas*.
    // Por enquanto, vou filtrar com base no searchTerm nas contas.
    
    return accounts.filter(account => {
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
        (account.client?.name.toLowerCase().includes(searchLower)) ||
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
              Gerencie seus recebimentos e entradas.
            </p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) { setEditingId(null); resetFormData(); }
            }}
          >
            <DialogTrigger asChild>
              <Button className="bg-secondary text-secondary-foreground shadow-md transition-transform duration-300 ease-out hover:scale-105 hover:bg-secondary/90">
                <Plus className="mr-2 h-4 w-4" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl tracking-wide">
                  {editingId ? "Editar Entrada" : "Adicionar Entrada"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Cliente (Opcional)</Label>
                  <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Venda avulsa (sem cliente)" /></SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} {c.cpf_cnpj && `- ${maskCpfCnpj(c.cpf_cnpj)}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Valor Bruto (R$)</Label>
                  <Input type="number" step="0.01" value={formData.gross_value} onChange={(e) => setFormData({ ...formData, gross_value: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento (Opcional)</Label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Método de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.payment_method === "card" && (
                  <>
                    <div className="space-y-2">
                      <Label>Bandeira do Cartão</Label>
                      <Input value={formData.card_brand} onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })} placeholder="Ex: Visa, Master" />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa (%)</Label>
                      <Input type="number" step="0.01" value={formData.tax_rate} onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })} placeholder="Ex: 2.5" />
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full sm:col-span-2 bg-secondary text-secondary-foreground hover:bg-secondary/90">
                  {editingId ? "Salvar Alterações" : "Adicionar Entrada"}
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
                placeholder="Buscar por cliente, CPF/CNPJ, valor..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            {/* Filtros */}
            <div className="flex gap-2">
              <Button variant={statusFilter === 'all' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('all')} className={cn(statusFilter === 'all' && 'border-tertiary text-tertiary')}>Todos</Button>
              <Button variant={statusFilter === 'pending' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('pending')} className={cn(statusFilter === 'pending' && 'border-primary text-primary')}>Pendentes</Button>
              <Button variant={statusFilter === 'overdue' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('overdue')} className={cn(statusFilter === 'overdue' && 'border-destructive text-destructive')}>Vencidos</Button>
              <Button variant={statusFilter === 'received' ? 'outline' : 'ghost'} size="sm" onClick={() => setStatusFilter('received')} className={cn(statusFilter === 'received' && 'border-secondary text-secondary')}>Recebidos</Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Cliente</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Vencimento</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Status</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-right">Valor Líquido</TableHead>
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
                        {statusFilter === 'all' && searchTerm === '' 
                          ? "Nenhuma entrada registrada."
                          : "Nenhuma entrada encontrada com esses filtros."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAccounts.map(account => {
                      const status = getAccountStatus(account);
                      return (
                        <TableRow key={account.id} className="hover:bg-accent/30">
                          <TableCell className="py-4">
                            <div className="font-medium text-foreground">{account.client?.name || "Venda Avulsa"}</div>
                            <div className="hidden text-sm text-muted-foreground md:inline">{maskCpfCnpj(account.client?.cpf_cnpj)}</div>
                          </TableCell>
                          <TableCell className={cn("font-sans", status === 'overdue' && "text-destructive")}>
                            {formatDate(account.due_date)}
                          </TableCell>
                          <TableCell>
                            <Select value={status} onValueChange={(value) => handleStatusChange(account.id, value as "pending" | "received")}>
                              <SelectTrigger className="h-auto w-auto min-w-[110px] border-0 bg-transparent p-0 focus:ring-0">
                                <SelectValue asChild>
                                  <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", getStatusBadgeClass(status))}>
                                    {translateStatus(status)}
                                  </span>
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="received">Recebido</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell className="text-right font-sans text-base font-medium tabular-nums text-secondary">
                            {formatCurrency(account.net_value)}
                            {account.gross_value !== account.net_value && (
                              <p className="text-xs font-normal text-muted-foreground line-through">
                                {formatCurrency(account.gross_value)}
                              </p>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(account)} className="h-8 w-8 text-muted-foreground hover:text-secondary">
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
              Tem certeza que deseja excluir esta entrada? Esta ação não pode ser desfeita.
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