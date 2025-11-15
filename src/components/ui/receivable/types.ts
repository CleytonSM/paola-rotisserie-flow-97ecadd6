export type Client = {
  id: string;
  name: string;
  cpf_cnpj?: string;
};

export type AccountReceivable = {
  id: string;
  client_id?: string;
  gross_value: number;
  net_value: number;
  payment_method: string;
  card_brand?: string;
  tax_rate?: number;
  entry_date: string;
  status: "pending" | "received";
  client?: Client;
};

export type FormData = {
  client_id: string;
  gross_value: string;
  payment_method: string;
  card_brand: string;
  tax_rate: string;
  entry_date: Date | undefined;
};

export type StatusFilter = "all" | "pending" | "received" | "overdue";

export type AccountStatus = "received" | "pending" | "overdue";

