import type { AccountReceivable, AccountStatus, Client } from "./types";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const formatDate = (date: string | undefined) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

export const maskCpfCnpj = (value: string | undefined) => {
  if (!value) return "";
  if (value.length === 11) {
    return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return value.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

export const getAccountStatus = (account: AccountReceivable): AccountStatus => {
  if (account.status === "received") return "received";
  // Removida lógica de vencimento baseada em due_date
  return "pending";
};

export const translateStatus = (status: AccountStatus) => {
  const translations = { received: "Recebido", pending: "Pendente", overdue: "Vencido" };
  return translations[status] || status;
};

export const getStatusBadgeClass = (status: AccountStatus) => {
  switch (status) {
    case "received":
      return "bg-secondary/20 text-secondary";
    case "overdue":
      return "bg-destructive/20 text-destructive";
    case "pending":
    default:
      return "bg-primary/20 text-primary-hover";
  }
};

