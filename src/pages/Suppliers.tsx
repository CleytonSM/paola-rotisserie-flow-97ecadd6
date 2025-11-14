import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header"; // Importação real
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  getSuppliers,
  createSupplier,
  updateSupplier, // Assumindo que exista um updateSupplier
  deleteSupplier, // Assumindo que exista um deleteSupplier
} from "@/services/database"; // Importações reais
import { getCurrentSession } from "@/services/auth"; // Importação real
import { toast } from "sonner";
import { z } from "zod";
import { cn } from "@/lib/utils";

// --- Schema e Tipos ---

// Validação de CNPJ (simplificada)
const validateCnpj = (cnpj: string) => {
  if (cnpj === "") return true; // Opcional
  return cnpj.replace(/\D/g, '').length === 14;
};

const supplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional().refine(validateCnpj, {
    message: "CNPJ inválido"
  }),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  phone: z.string().optional(),
});

type Supplier = {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
};

// --- Funções de Máscara ---

const maskCnpj = (value: string) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  if (!value) return "";
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

// --- Componente Principal ---

export default function Suppliers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  // Controles da Tabela
  const [searchTerm, setSearchTerm] = useState("");

  // Controles de Modais
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
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
    const result = await getSuppliers();
    
    if (result.error) {
      toast.error("Erro ao carregar fornecedores");
    } else if (result.data) {
      setSuppliers(result.data as Supplier[]);
    }
    
    setLoading(false);
  };

  // --- Handlers de Ações (CRUD) ---

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name,
      cnpj: supplier.cnpj ? maskCnpj(supplier.cnpj) : "",
      email: supplier.email || "",
      phone: supplier.phone ? maskPhone(supplier.phone) : "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    // Assumindo que deleteSupplier exista
    const { error } = await deleteSupplier(deletingId);
    if (error) {
      toast.error("Erro ao excluir fornecedor");
    } else {
      toast.success("Fornecedor excluído com sucesso!");
      loadData();
    }
    setDeleteDialogOpen(false);
    setDeletingId(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToValidate = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ''), // Limpa máscara para validação
      };
      const validated = supplierSchema.parse(dataToValidate);

      // Re-formata o CNPJ limpo se existir
      const apiData = {
        ...validated,
        cnpj: validated.cnpj ? validated.cnpj : undefined,
      };

      const { error } = editingId
        ? await updateSupplier(editingId, apiData) // Assumindo que updateSupplier exista
        : await createSupplier(apiData);

      if (error) {
        toast.error(editingId ? "Erro ao atualizar fornecedor" : "Erro ao criar fornecedor");
      } else {
        toast.success(editingId ? "Fornecedor atualizado com sucesso!" : "Fornecedor criado com sucesso!");
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

  const resetFormData = () => {
    setFormData({ name: "", cnpj: "", email: "", phone: "" });
  };
  
  // --- Manipuladores de Input com Máscara ---
  
  const handleMaskedInputChange = (e: React.ChangeEvent<HTMLInputElement>, mask: (value: string) => string) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: mask(value)
    }));
  };

  // --- Filtragem da Tabela ---

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(supplier => {
      const searchLower = searchTerm.toLowerCase();
      
      return (
        supplier.name.toLowerCase().includes(searchLower) ||
        (supplier.cnpj && supplier.cnpj.includes(searchLower)) ||
        (supplier.email && supplier.email.toLowerCase().includes(searchLower)) ||
        (supplier.phone && supplier.phone.includes(searchLower))
      );
    });
  }, [suppliers, searchTerm]);

  // --- Renderização ---

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        {/* Cabeçalho da Página */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
              Fornecedores
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Gerencie seus fornecedores.
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
              <Button className="shadow-md transition-transform duration-300 ease-out hover:scale-105">
                <Plus className="mr-2 h-4 w-4" />
                Novo Fornecedor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl tracking-wide">
                  {editingId ? "Editar Fornecedor" : "Adicionar Fornecedor"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome</Label>
                  <Input 
                    value={formData.name} 
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                    placeholder="Nome do fornecedor" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input 
                    name="cnpj"
                    value={formData.cnpj} 
                    onChange={(e) => handleMaskedInputChange(e, maskCnpj)} 
                    placeholder="00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    name="phone"
                    value={formData.phone} 
                    onChange={(e) => handleMaskedInputChange(e, maskPhone)} 
                    placeholder="(00) 90000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Email</Label>
                  <Input 
                    type="email"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    placeholder="contato@fornecedor.com"
                  />
                </div>
                <Button type="submit" className="w-full sm:col-span-2">{editingId ? "Salvar Alterações" : "Adicionar Fornecedor"}</Button>
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
                placeholder="Buscar por nome, CNPJ, email..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Fornecedor</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Documento</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide">Telefone</TableHead>
                    <TableHead className="font-display text-xs uppercase tracking-wide text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Carregando...</TableCell>
                    </TableRow>
                  ) : filteredSuppliers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                        {searchTerm === '' 
                          ? "Nenhum fornecedor registrado."
                          : "Nenhum fornecedor encontrado."
                        }
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSuppliers.map(supplier => (
                      <TableRow key={supplier.id} className="hover:bg-accent/30">
                        <TableCell className="py-4">
                          <div className="font-medium text-foreground">{supplier.name}</div>
                          <div className="text-sm text-muted-foreground">{supplier.email}</div>
                        </TableCell>
                        <TableCell className="font-sans tabular-nums text-muted-foreground">
                          {supplier.cnpj ? maskCnpj(supplier.cnpj) : "N/A"}
                        </TableCell>
                        <TableCell className="font-sans tabular-nums text-muted-foreground">
                          {supplier.phone ? maskPhone(supplier.phone) : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(supplier)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(supplier.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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
              Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita.
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