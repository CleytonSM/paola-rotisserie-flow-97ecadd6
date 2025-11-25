import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SupplierFormDialog } from "@/components/ui/suppliers/SupplierFormDialog";
import { SupplierTable } from "@/components/ui/suppliers/SupplierTable";
import { DeleteSupplierDialog } from "@/components/ui/suppliers/DeleteSupplierDialog";
import type { Supplier, FormData } from "@/components/ui/suppliers/types";
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { z } from "zod";
import { validateCnpj, maskCnpj, maskPhone } from "@/components/ui/suppliers/utils";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

// --- Schema de Validação ---

const supplierSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  cnpj: z.string().optional().refine(validateCnpj, {
    message: "CNPJ inválido",
  }),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  phone: z.string().optional(),
});

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
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState<FormData>({
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
    setSubmitting(true);
    try {
      const dataToValidate = {
        ...formData,
        cnpj: formData.cnpj.replace(/\D/g, ""), // Limpa máscara para validação
      };
      const validated = supplierSchema.parse(dataToValidate);

      // Re-formata o CNPJ limpo se existir
      const apiData = {
        ...validated,
        cnpj: validated.cnpj ? validated.cnpj : undefined,
      };

      const { error } = editingId
        ? await updateSupplier(editingId, apiData)
        : await createSupplier(apiData);

      if (error) {
        toast.error(editingId ? "Erro ao atualizar fornecedor" : "Erro ao criar fornecedor");
      } else {
        toast.success(
          editingId ? "Fornecedor atualizado com sucesso!" : "Fornecedor criado com sucesso!"
        );
        setDialogOpen(false);
        setEditingId(null);
        resetFormData();
        loadData();
      }
    } catch (err) {
      if (err instanceof z.ZodError) {
        toast.error(err.issues[0].message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const resetFormData = () => {
    setFormData({ name: "", cnpj: "", email: "", phone: "" });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      setEditingId(null);
      resetFormData();
    }
  };

  // --- Filtragem da Tabela ---

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((supplier) => {
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
            <AppBreadcrumb />
          </div>
          <SupplierFormDialog
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

        {/* Tabela de Fornecedores */}
        <SupplierTable
          suppliers={filteredSuppliers}
          loading={loading}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      </main>

      {/* Modal de Exclusão */}
      <DeleteSupplierDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
