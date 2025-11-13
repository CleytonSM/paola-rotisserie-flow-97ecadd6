import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { getCurrentSession } from "@/services/auth";
import { getSuppliers, createSupplier } from "@/services/database";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export default function Suppliers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    contact: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getCurrentSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      
      loadSuppliers();
    };

    checkAuth();
  }, [navigate]);

  const loadSuppliers = async () => {
    setLoading(true);
    const result = await getSuppliers();
    
    if (result.error) {
      toast.error("Erro ao carregar fornecedores");
    } else if (result.data) {
      setSuppliers(result.data);
    }
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }

    const result = await createSupplier(formData);
    
    if (result.error) {
      toast.error("Erro ao criar fornecedor");
    } else {
      toast.success("Fornecedor criado com sucesso");
      setFormData({ name: "", cnpj: "", contact: "" });
      loadSuppliers();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("suppliers")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao deletar fornecedor");
    } else {
      toast.success("Fornecedor deletado");
      loadSuppliers();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground mb-2">
            Fornecedores
          </h1>
          <p className="text-muted-foreground">
            Gerencie seus fornecedores
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Novo Fornecedor</CardTitle>
              <CardDescription>Adicione um novo fornecedor ao sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Nome do fornecedor"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact">Contato</Label>
                  <Input
                    id="contact"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    placeholder="Email ou telefone"
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Fornecedor
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fornecedores Cadastrados</CardTitle>
              <CardDescription>Lista de todos os fornecedores</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted/50 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : suppliers.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum fornecedor cadastrado
                </p>
              ) : (
                <div className="space-y-3">
                  {suppliers.map((supplier) => (
                    <div
                      key={supplier.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground">{supplier.name}</h3>
                        {supplier.cnpj && (
                          <p className="text-sm text-muted-foreground">CNPJ: {supplier.cnpj}</p>
                        )}
                        {supplier.contact && (
                          <p className="text-sm text-muted-foreground">Contato: {supplier.contact}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(supplier.id)}
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
