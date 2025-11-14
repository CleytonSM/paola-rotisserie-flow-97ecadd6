import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header"; // Importação real
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  getClients,
  createClient,
  updateClient, // Assumindo que exista
  deleteClient, // Assumindo que exista
} from "@/services/database"; // Importações reais
import { getCurrentSession } from "@/services/auth"; // Importação real
import { toast } from "sonner";
import { z } from "zod";
import { ColumnDef, DataTable } from "@/components/ui/data-table"; // Importando o novo componente

// --- Schema e Tipos ---

const validateCpfCnpj = (doc: string) => {
  if (doc === "") return true; // Opcional
  const cleanDoc = doc.replace(/\D/g, '');
  return cleanDoc.length === 11 || cleanDoc.length === 14;
};

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf_cnpj: z.string().optional().refine(validateCpfCnpj, {
    message: "CPF/CNPJ inválido"
  }),
  email: z.string().email("Email inválido").optional().or(z.literal('')),
  phone: z.string().optional(),
});

type Client = {
  id: string;
  name: string;
  cpf_cnpj?: string;
  email?: string;
  phone?: string;
};

// --- Funções de Máscara ---

const maskCpfCnpj = (value: string | undefined) => {
  if (!value) return "N/A";
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length === 11) {
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  if (cleanValue.length === 14) {
     return cleanValue.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  return value; // Retorna o valor parcial se não estiver completo
};

const maskPhone = (value: string | undefined) => {
  if (!value) return "N/A";
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue.length <= 10) {
    return cleanValue
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  }
  return cleanValue
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

// --- Componente Principal ---

export default function Clients() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);

  // Controles da Tabela
  const [searchTerm, setSearchTerm] = useState("");

  // Controles de Modais
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    cpf_cnpj: "",
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
    const result = await getClients();
    if (result.error) {
      toast.error("Erro ao carregar clientes");
    } else if (result.data) {
      setClients(result.data as Client[]);
    }
    setLoading(false);
  };

  // --- Handlers de Ações (CRUD) ---

  const handleEdit = (client: Client) => {
    setEditingId(client.id);
    setFormData({
      name: client.name,
      cpf_cnpj: client.cpf_cnpj ? (client.cpf_cnpj.length === 11 ? maskCpfCnpj(client.cpf_cnpj) : maskCpfCnpj(client.cpf_cnpj)) : "",
      email: client.email || "",
      phone: client.phone ? maskPhone(client.phone) : "",
    });
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingId) return;
    const { error } = await deleteClient(deletingId);
    if (error) {
      toast.error("Erro ao excluir cliente");
    } else {
      toast.success("Cliente excluído com sucesso!");
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
        cpf_cnpj: formData.cpf_cnpj ? formData.cpf_cnpj.replace(/\D/g, '') : '', // Limpa máscara
        phone: formData.phone ? formData.phone.replace(/\D/g, '') : '', // Limpa máscara
      };
      const validated = clientSchema.parse(dataToValidate);
      
      const apiData = {
        ...validated,
        cpf_cnpj: validated.cpf_cnpj ? validated.cpf_cnpj : undefined,
        phone: validated.phone ? validated.phone : undefined,
      };

      const { error } = editingId
        ? await updateClient(editingId, apiData)
        : await createClient(apiData);

      if (error) {
        toast.error(editingId ? "Erro ao atualizar cliente" : "Erro ao criar cliente");
      } else {
        toast.success(editingId ? "Cliente atualizado com sucesso!" : "Cliente criado com sucesso!");
        setDialogOpen(false);
        setEditingId(null);
        resetFormData();
        loadData();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      } else {
        toast.error("Erro inesperado ao processar formulário");
      }
    }
  };

  const resetFormData = () => {
    setFormData({ name: "", cpf_cnpj: "", email: "", phone: "" });
  };
  
  // --- Manipuladores de Input com Máscara ---
  
  const handleMaskedInputChange = (e: React.ChangeEvent<HTMLInputElement>, mask: (value: string) => string) => {
    const { name, value } = e.target;
    // Determina o tamanho máximo baseado na máscara (CPF ou CNPJ)
    let maxLength = name === 'cpf_cnpj' ? 18 : 15; // 18 para CNPJ, 15 para Telefone
    if (name === 'cpf_cnpj' && value.replace(/\D/g, '').length <= 11) {
      maxLength = 14; // Limite de CPF
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: mask(value)
    }));
  };
  
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    const cleanValue = value.replace(/\D/g, '');
    let maskedValue = value;

    if (cleanValue.length <= 11) {
      // Aplica máscara de CPF
      maskedValue = cleanValue
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    } else {
      // Aplica máscara de CNPJ
      maskedValue = cleanValue
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{2})\d+?$/, '$1');
    }
    
    setFormData(prev => ({ ...prev, cpf_cnpj: maskedValue }));
  };

  // --- Filtragem da Tabela ---

  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const searchLower = searchTerm.toLowerCase();
      return (
        client.name.toLowerCase().includes(searchLower) ||
        (client.cpf_cnpj && client.cpf_cnpj.includes(searchLower)) ||
        (client.email && client.email.toLowerCase().includes(searchLower)) ||
        (client.phone && client.phone.includes(searchLower))
      );
    });
  }, [clients, searchTerm]);

  // --- Definições das Colunas da Tabela ---

  const columns: ColumnDef<Client>[] = [
    {
      header: "Cliente",
      cell: (client) => (
        <div>
          <div className="font-medium text-foreground">{client.name}</div>
          <div className="text-sm text-muted-foreground">{client.email || "Sem email"}</div>
        </div>
      )
    },
    {
      header: "Documento",
      cell: (client) => (
        <span className="font-sans tabular-nums text-muted-foreground">
          {maskCpfCnpj(client.cpf_cnpj)}
        </span>
      )
    },
    {
      header: "Telefone",
      cell: (client) => (
         <span className="font-sans tabular-nums text-muted-foreground">
          {maskPhone(client.phone)}
        </span>
      )
    },
    {
      header: "Ações",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (client) => (
        <>
          <Button size="icon" variant="ghost" onClick={() => handleEdit(client)} className="h-8 w-8 text-muted-foreground hover:text-primary">
            <Pencil className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => handleDeleteClick(client.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )
    }
  ];

  // --- Renderização ---

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        {/* Cabeçalho da Página */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
              Clientes
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Gerencie seus clientes.
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
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-3xl tracking-wide">
                  {editingId ? "Editar Cliente" : "Adicionar Cliente"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Nome do cliente" required />
                </div>
                <div className="space-y-2">
                  <Label>CPF/CNPJ</Label>
                  <Input 
                    name="cpf_cnpj"
                    value={formData.cpf_cnpj} 
                    onChange={handleCpfCnpjChange} 
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    maxLength={18}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input 
                    name="phone"
                    value={formData.phone} 
                    onChange={(e) => handleMaskedInputChange(e, (v) => maskPhone(v))} 
                    placeholder="(00) 90000-0000"
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="contato@cliente.com" />
                </div>
                <Button type="submit" className="w-full sm:col-span-2">{editingId ? "Salvar Alterações" : "Adicionar Cliente"}</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Card da Tabela */}
        <DataTable
          columns={columns}
          data={filteredClients}
          isLoading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Buscar por nome, CPF/CNPJ, email..."
          emptyStateMessage="Nenhum cliente registrado."
        />
      </main>

      {/* Modal de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-2xl tracking-wide">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-base text-muted-foreground">
              Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.
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