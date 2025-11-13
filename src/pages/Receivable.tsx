import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { getAccountsReceivable, createAccountReceivable, getClients } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";

const receivableSchema = z.object({
  client_id: z.string().optional(),
  gross_value: z.number().positive("Valor deve ser positivo"),
  payment_method: z.string(),
  card_brand: z.string().optional(),
  tax_rate: z.number().min(0).max(100).optional(),
});

export default function Receivable() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    client_id: "",
    gross_value: "",
    payment_method: "cash",
    card_brand: "",
    tax_rate: "",
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
    const [accountsResult, clientsResult] = await Promise.all([
      getAccountsReceivable(),
      getClients(),
    ]);

    if (accountsResult.error) {
      toast.error("Erro ao carregar contas");
    } else if (accountsResult.data) {
      setAccounts(accountsResult.data);
    }

    if (clientsResult.error) {
      toast.error("Erro ao carregar clientes");
    } else if (clientsResult.data) {
      setClients(clientsResult.data);
    }

    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    const { data, error } = await getClients(searchTerm);
    if (error) {
      toast.error("Erro na busca");
    } else if (data) {
      setClients(data);
    }
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
      });

      const { error } = await createAccountReceivable(validated);

      if (error) {
        toast.error("Erro ao criar entrada");
      } else {
        toast.success("Entrada criada com sucesso!");
        setDialogOpen(false);
        setFormData({ client_id: "", gross_value: "", payment_method: "cash", card_brand: "", tax_rate: "" });
        loadData();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      }
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  const maskCpfCnpj = (value: string) => {
    if (!value) return "";
    if (value.length === 11) {
      return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Contas a Receber</h1>
            <p className="text-muted-foreground">Gerencie seus recebimentos</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-secondary hover:bg-secondary-hover text-secondary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nova Entrada
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Adicionar Entrada</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Cliente (Opcional)</Label>
                  <Select value={formData.client_id} onValueChange={(v) => setFormData({ ...formData, client_id: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sem cliente" />
                    </SelectTrigger>
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
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.gross_value}
                    onChange={(e) => setFormData({ ...formData, gross_value: e.target.value })}
                    required
                  />
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
                      <SelectItem value="card">Cartão</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formData.payment_method === "card" && (
                  <>
                    <div className="space-y-2">
                      <Label>Bandeira do Cartão</Label>
                      <Input
                        value={formData.card_brand}
                        onChange={(e) => setFormData({ ...formData, card_brand: e.target.value })}
                        placeholder="Ex: Visa, Master"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Taxa (%)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.tax_rate}
                        onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                        placeholder="Ex: 2.5"
                      />
                    </div>
                  </>
                )}
                <Button type="submit" className="w-full bg-secondary hover:bg-secondary-hover">
                  Adicionar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Busca de Clientes */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                placeholder="Buscar por nome ou CPF/CNPJ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">Nenhuma entrada registrada</p>
              <Button onClick={() => setDialogOpen(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar primeira entrada
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <Card key={account.id} className="border-secondary/20">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {account.client?.name || "Venda avulsa"}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(account.receipt_date)}
                        {account.client?.cpf_cnpj && ` • ${maskCpfCnpj(account.client.cpf_cnpj)}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-secondary">
                        {formatCurrency(account.net_value)}
                      </p>
                      {account.gross_value !== account.net_value && (
                        <p className="text-xs text-muted-foreground line-through">
                          {formatCurrency(account.gross_value)}
                        </p>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Método: <span className="font-medium text-foreground">{account.payment_method}</span>
                      {account.card_brand && ` • ${account.card_brand}`}
                    </p>
                    {account.tax_rate && (
                      <p className="text-xs text-muted-foreground">
                        Taxa: {account.tax_rate}%
                      </p>
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