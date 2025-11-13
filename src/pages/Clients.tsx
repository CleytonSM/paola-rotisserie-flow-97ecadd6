import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { getCurrentSession } from "@/services/auth";
import { getClients, createClient } from "@/services/database";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Clients() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    cpf_cnpj: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getCurrentSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      loadClients();
    };

    checkAuth();
  }, [navigate]);

  const loadClients = async () => {
    setLoading(true);
    const result = await getClients();
    
    if (result.error) {
      toast.error("Erro ao carregar clientes");
    } else if (result.data) {
      setClients(result.data);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const result = await createClient(formData);
    
    if (result.error) {
      toast.error("Erro ao criar cliente");
    } else {
      toast.success("Cliente criado com sucesso");
      setFormData({ name: "", cpf_cnpj: "", email: "", phone: "" });
      loadClients();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("clients")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao deletar cliente");
    } else {
      toast.success("Cliente deletado");
      loadClients();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Clientes
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus clientes
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo Cliente</CardTitle>
              <CardDescription>Adicione um novo cliente ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do cliente"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf_cnpj">CPF/CNPJ</Label>
                  <Input
                    id="cpf_cnpj"
                    value={formData.cpf_cnpj}
                    onChange={(e) => setFormData({ ...formData, cpf_cnpj: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="cliente@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Cliente
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Clientes Cadastrados</CardTitle>
              <CardDescription>Lista de todos os clientes</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-24 bg-muted/50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : clients.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum cliente cadastrado
                </p>
              ) : (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{client.name}</h3>
                        {client.cpf_cnpj && (
                          <p className="text-sm text-muted-foreground">CPF/CNPJ: {client.cpf_cnpj}</p>
                        )}
                        {client.email && (
                          <p className="text-sm text-muted-foreground">Email: {client.email}</p>
                        )}
                        {client.phone && (
                          <p className="text-sm text-muted-foreground">Tel: {client.phone}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(client.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
