import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { ClientFormDialog } from "@/components/ui/clients/ClientFormDialog";
import { DeleteClientDialog } from "@/components/ui/clients/DeleteClientDialog";
import type { Client, FormData } from "@/components/ui/clients/types";
import { ColumnDef, DataTable } from "@/components/ui/data-table";
import { getClients, createClient, updateClient, deleteClient } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateCpfCnpj, maskCpfCnpj, maskPhone } from "@/components/ui/clients/utils";

// --- Schema de Validação ---

const clientSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cpf_cnpj: z.string().optional().refine(validateCpfCnpj, {
    message: "CPF/CNPJ inválido",
  }),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
});

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
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
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
      cpf_cnpj: client.cpf_cnpj ? maskCpfCnpj(client.cpf_cnpj) : "",
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
    setSubmitting(true);
    try {
      const dataToValidate = {
        ...formData,
        cpf_cnpj: formData.cpf_cnpj ? formData.cpf_cnpj.replace(/\D/g, "") : "", // Limpa máscara
        phone: formData.phone ? formData.phone.replace(/\D/g, "") : "", // Limpa máscara
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
        toast.success(
          editingId ? "Cliente atualizado com sucesso!" : "Cliente criado com sucesso!"
        );
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
    } finally {
      setSubmitting(false);
    }
  };

  const resetFormData = () => {
    setFormData({ name: "", cpf_cnpj: "", email: "", phone: "" });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingId(null);
      resetFormData();
    }
  };

  // --- Filtragem da Tabela ---

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
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
      ),
    },
    {
      header: "Documento",
      cell: (client) => (
        <span className="font-sans tabular-nums text-muted-foreground">
          {maskCpfCnpj(client.cpf_cnpj)}
        </span>
      ),
    },
    {
      header: "Telefone",
      cell: (client) => (
        <span className="font-sans tabular-nums text-muted-foreground">
          {maskPhone(client.phone)}
        </span>
      ),
    },
    {
      header: "Ações",
      headerClassName: "text-right",
      cellClassName: "text-right",
      cell: (client) => (
        <>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleEdit(client)}
            className="h-8 w-8 text-muted-foreground hover:text-primary"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => handleDeleteClick(client.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      ),
    },
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
            <p className="mt-2 text-lg text-muted-foreground">Gerencie seus clientes.</p>
          </div>
          <ClientFormDialog
            open={dialogOpen}
            onOpenChange={handleDialogClose}
            formData={formData}
            setFormData={setFormData}
            editingId={editingId}
            onSubmit={handleSubmit}
            onReset={resetFormData}
            loading={submitting}
          />
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
      <DeleteClientDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
