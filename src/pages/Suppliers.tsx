import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { getCurrentSession } from "@/services/auth";
import { getSuppliers, createSupplier } from "@/services/database";
import { EntityManager, EntityConfig } from "@/components/EntityManager";
import { toast } from "sonner";

interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
}

export default function Suppliers() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);

  const supplierConfig: EntityConfig<Supplier> = {
    entityName: "Fornecedor",
    entityNamePlural: "Fornecedores",
    tableName: "suppliers",
    formFields: [
      {
        key: "name",
        label: "Nome",
        placeholder: "Nome do fornecedor",
        required: true,
      },
      {
        key: "cnpj",
        label: "CNPJ",
        placeholder: "00.000.000/0000-00",
        documentType: "cnpj",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        placeholder: "fornecedor@email.com",
      },
      {
        key: "phone",
        label: "Telefone",
        placeholder: "(00) 99999-9999",
        phoneType: true,
      },
    ],
    getItems: getSuppliers,
    createItem: createSupplier,
    renderItemDetails: (supplier) => (
      <>
        <h3 className="font-semibold text-foreground">{supplier.name}</h3>
        {supplier.cnpj && (
          <p className="text-sm text-muted-foreground">CNPJ: {supplier.cnpj}</p>
        )}
        {supplier.email && (
          <p className="text-sm text-muted-foreground">Email: {supplier.email}</p>
        )}
        {supplier.phone && (
          <p className="text-sm text-muted-foreground">Tel: {supplier.phone}</p>
        )}
      </>
    ),
    getInitialFormData: () => ({
      name: "",
      cnpj: "",
      email: "",
      phone: "",
    }),
    getEmptyFormData: () => ({
      name: "",
      cnpj: "",
      email: "",
      phone: "",
    }),
    documentField: "cnpj",
    errorMessages: {
      load: "Erro ao carregar fornecedores",
      create: "Erro ao criar fornecedor",
      createSuccess: "Fornecedor criado com sucesso",
      delete: "Erro ao deletar fornecedor",
      deleteSuccess: "Fornecedor deletado",
      nameRequired: "Nome é obrigatório",
      documentIncomplete: "O CNPJ está incompleto. Por favor, complete o documento ou deixe em branco.",
      phoneIncomplete: "O telefone está incompleto. Por favor, complete o telefone ou deixe em branco.",
    },
  };

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    const result = await getSuppliers();
    
    if (result.error) {
      toast.error("Erro ao carregar fornecedores");
    } else if (result.data) {
      setSuppliers(result.data);
    }
    
    setLoading(false);
  }, []);

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
  }, [navigate, loadSuppliers]);

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

        <EntityManager
          config={supplierConfig}
          loading={loading}
          items={suppliers}
          onLoad={loadSuppliers}
        />
      </main>
    </div>
  );
}
