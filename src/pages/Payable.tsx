import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Check, Pencil, Trash2 } from "lucide-react";
import { getAccountsPayable, createAccountPayable, updateAccountPayable, deleteAccountPayable, getSuppliers, updateAccountPayableStatus } from "@/services/database";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";

const payableSchema = z.object({
  supplier_id: z.string().min(1, "Selecione um fornecedor"),
  value: z.number().positive("Valor deve ser positivo"),
  payment_method: z.string(),
  notes: z.string().optional(),
  due_date: z.string().optional(),
});

export default function Payable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    supplier_id: "",
    value: "",
    payment_method: "cash",
    notes: "",
    due_date: "",
  });

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
      setAccounts(accountsResult.data);
    }

    if (suppliersResult.error) {
      toast.error("Erro ao carregar fornecedores");
    } else if (suppliersResult.data) {
      setSuppliers(suppliersResult.data);
    }

    setLoading(false);
  };

  const handleEdit = (account: any) => {
    setEditingId(account.id);
    setFormData({
      supplier_id: account.supplier_id || "",
      value: account.value.toString(),
      payment_method: account.payment_method,
      notes: account.notes || "",
      due_date: account.due_date ? new Date(account.due_date).toISOString().split('T')[0] : "",
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
      const validated = payableSchema.parse({
        ...formData,
        value: parseFloat(formData.value),
      });

      const accountData = editingId 
        ? validated 
        : { ...validated, status: "pending" };

      const { error } = editingId
        ? await updateAccountPayable(editingId, accountData)
        : await createAccountPayable(accountData);

      if (error) {
        toast.error(editingId ? "Erro ao atualizar conta" : "Erro ao criar conta");
      } else {
        toast.success(editingId ? "Conta atualizada com sucesso!" : "Conta criada com sucesso!");
        setDialogOpen(false);
        setEditingId(null);
        setFormData({ supplier_id: "", value: "", payment_method: "cash", notes: "", due_date: "" });
        loadData();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      }
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const { error } = await updateAccountPayableStatus(id, newStatus);
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Status atualizado!");
      loadData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const translatePaymentMethod = (method: string) => {
    const translations: Record<string, string> = {
      'cash': 'Dinheiro',
      'card': 'Cartão',
      'pix': 'PIX',
      'boleto': 'Boleto'
    };
    return translations[method] || method;
  };

  const getAccountStatus = (account: any) => {
    if (account.status === 'paid') return 'paid';
    if (account.due_date && new Date(account.due_date) < new Date()) return 'overdue';
    return 'pending';
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      'paid': 'Pago',
      'pending': 'Pendente',
      'overdue': 'Vencido'
    };
    return translations[status] || status;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Contas a Pagar</h1>
            <p className="text-muted-foreground">Gerencie seus pagamentos</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) {
              setEditingId(null);
              setFormData({ supplier_id: "", value: "", payment_method: "cash", notes: "", due_date: "" });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Conta a Pagar" : "Adicionar Conta a Pagar"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Fornecedor</Label>
                  <Select value={formData.supplier_id} onValueChange={(v) => setFormData({ ...formData, supplier_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
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
                  <Label>Método de Pagamento</Label>
                  <Select value={formData.payment_method} onValueChange={(v) => setFormData({ ...formData, payment_method: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Dinheiro</SelectItem>
                      <SelectItem value="boleto">Boleto</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Ex: Compra semanal"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Vencimento</Label>
                  <Input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full bg-primary hover:bg-primary-hover">
                  {editingId ? "Salvar" : "Adicionar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma conta a pagar registrada</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeira conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <Card key={account.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        {account.supplier?.name || "Sem fornecedor"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pagamento: {formatDate(account.payment_date)}
                      </p>
                      {account.due_date && (
                        <p className="text-sm text-muted-foreground">
                          Vencimento: {formatDate(account.due_date)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-start gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(account)}
                        className="h-8 w-8 text-muted-foreground hover:text-primary"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteClick(account.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-destructive">
                          {formatCurrency(account.value)}
                        </p>
                        <Select 
                          value={getAccountStatus(account)} 
                          onValueChange={(value) => handleStatusChange(account.id, value)}
                        >
                          <SelectTrigger className="w-[120px] h-8">
                            <SelectValue>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                getAccountStatus(account) === 'paid' 
                                  ? 'bg-secondary/20 text-secondary' 
                                  : getAccountStatus(account) === 'overdue'
                                  ? 'bg-destructive/20 text-destructive'
                                  : 'bg-primary/20 text-primary-foreground'
                              }`}>
                                {translateStatus(getAccountStatus(account))}
                              </span>
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pending">Pendente</SelectItem>
                            <SelectItem value="paid">Pago</SelectItem>
                            <SelectItem value="overdue">Vencido</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Método: <span className="font-medium text-foreground">{translatePaymentMethod(account.payment_method)}</span>
                      </p>
                      {account.notes && (
                        <p className="text-sm text-muted-foreground">
                          {account.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}