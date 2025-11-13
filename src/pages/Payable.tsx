import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Check } from "lucide-react";
import { getAccountsPayable, createAccountPayable, getSuppliers, updateAccountPayableStatus } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";

const payableSchema = z.object({
  supplier_id: z.string().min(1, "Selecione um fornecedor"),
  value: z.number().positive("Valor deve ser positivo"),
  payment_method: z.string(),
  notes: z.string().optional(),
});

export default function Payable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    supplier_id: "",
    value: "",
    payment_method: "cash",
    notes: "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = payableSchema.parse({
        ...formData,
        value: parseFloat(formData.value),
      });

      const { error } = await createAccountPayable({
        ...validated,
        status: "paid",
      });

      if (error) {
        toast.error("Erro ao criar conta");
      } else {
        toast.success("Conta criada com sucesso!");
        setDialogOpen(false);
        setFormData({ supplier_id: "", value: "", payment_method: "cash", notes: "" });
        loadData();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      }
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    const { error } = await updateAccountPayableStatus(id, "paid");
    if (error) {
      toast.error("Erro ao atualizar status");
    } else {
      toast.success("Marcado como pago!");
      loadData();
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
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
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nova Conta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Conta a Pagar</DialogTitle>
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
                <Button type="submit" className="w-full bg-primary hover:bg-primary-hover">
                  Adicionar
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
                    <div>
                      <CardTitle className="text-lg">
                        {account.supplier?.name || "Sem fornecedor"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(account.payment_date)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-destructive">
                        {formatCurrency(account.value)}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        account.status === 'paid' 
                          ? 'bg-secondary/20 text-secondary' 
                          : 'bg-primary/20 text-primary-foreground'
                      }`}>
                        {account.status === 'paid' ? 'Pago' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">
                        Método: <span className="font-medium text-foreground">{account.payment_method}</span>
                      </p>
                      {account.notes && (
                        <p className="text-sm text-muted-foreground">
                          {account.notes}
                        </p>
                      )}
                    </div>
                    {account.status === 'pending' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkAsPaid(account.id)}
                        className="border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Marcar como Pago
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}