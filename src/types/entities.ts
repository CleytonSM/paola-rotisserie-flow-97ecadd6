/**
 * Core entity types used across the application
 */

export interface Client {
  id: string;
  name: string;
  cpf_cnpj?: string;
  email?: string;
  phone?: string;
}

export interface Supplier {
  id: string;
  name: string;
  cnpj?: string;
  email?: string;
  phone?: string;
}

export interface AccountReceivable {
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
}

export interface AccountPayable {
  id: string;
  supplier_id: string;
  value: number;
  payment_method: string;
  notes?: string;
  due_date?: string;
  payment_date?: string;
  status: "pending" | "paid" | "overdue";
  supplier?: Supplier;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';


