import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { getCurrentSession } from "@/services/auth";
import { getClients, createClient } from "@/services/database";
import { EntityManager, EntityConfig } from "@/components/EntityManager";
import { toast } from "sonner";

interface Client {
  id: string;
  name: string;
  cpf_cnpj?: string;
  email?: string;
  phone?: string;
}

export default function Clients() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<Client[]>([]);

  const clientConfig: EntityConfig<Client> = {
    entityName: "Cliente",
    entityNamePlural: "Clientes",
    tableName: "clients",
    formFields: [
      {
        key: "name",
        label: "Nome",
        placeholder: "Nome do cliente",
        required: true,
      },
      {
        key: "cpf_cnpj",
        label: "CPF/CNPJ",
        placeholder: "000.000.000-00 ou 00.000.000/0000-00",
        documentType: "cpf_cnpj",
      },
      {
        key: "email",
        label: "Email",
        type: "email",
        placeholder: "cliente@email.com",
      },
      {
        key: "phone",
        label: "Telefone",
        placeholder: "(00) 99999-9999",
        phoneType: true,
      },
    ],
    getItems: getClients,
    createItem: createClient,
    renderItemDetails: (client) => (
      <>
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
      </>
    ),
    getInitialFormData: () => ({
      name: "",
      cpf_cnpj: "",
      email: "",
      phone: "",
    }),
    getEmptyFormData: () => ({
      name: "",
      cpf_cnpj: "",
      email: "",
      phone: "",
    }),
    documentField: "cpf_cnpj",
    errorMessages: {
      load: "Erro ao carregar clientes",
      create: "Erro ao criar cliente",
      createSuccess: "Cliente criado com sucesso",
      delete: "Erro ao deletar cliente",
      deleteSuccess: "Cliente deletado",
      nameRequired: "Nome é obrigatório",
      documentIncomplete: "O CPF/CNPJ está incompleto. Por favor, complete o documento ou deixe em branco.",
      phoneIncomplete: "O telefone está incompleto. Por favor, complete o telefone ou deixe em branco.",
    },
  };

  const loadClients = useCallback(async () => {
    setLoading(true);
    const result = await getClients();
    
    if (result.error) {
      toast.error("Erro ao carregar clientes");
    } else if (result.data) {
      setClients(result.data);
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
      
      loadClients();
    };

    checkAuth();
  }, [navigate, loadClients]);

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

        <EntityManager
          config={clientConfig}
          loading={loading}
          items={clients}
          onLoad={loadClients}
        />
      </main>
    </div>
  );
}
