import type { AccountPayable, AccountStatus } from "./types";

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export const formatDate = (date: string | undefined) => {
  if (!date) return "N/A";
  return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" });
};

export const getAccountStatus = (account: AccountPayable): AccountStatus => {
  if (account.status === "paid") return "paid";
  if (
    account.due_date &&
    new Date(account.due_date).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0) &&
    account.status === "pending"
  ) {
    return "overdue";
  }
  return "pending";
};

export const translateStatus = (status: AccountStatus) => {
  const translations = { paid: "Pago", pending: "Pendente", overdue: "Vencido" };
  return translations[status] || status;
};

export const getStatusBadgeClass = (status: AccountStatus) => {
  switch (status) {
    case "paid":
      return "bg-secondary/20 text-secondary";
    case "overdue":
      return "bg-destructive/20 text-destructive";
    case "pending":
    default:
      return "bg-primary/20 text-primary-hover";
  }
};

