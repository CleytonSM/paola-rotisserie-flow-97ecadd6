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
  payment_date?: string;
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


export interface ClientAddress {
  id: string;
  client_id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip_code: string;
  is_default: boolean;
}

export interface AppSettings {
  id: string;
  store_cnpj?: string;
  store_name?: string;
  store_address_street?: string;
  store_address_number?: string;
  store_address_complement?: string;
  store_address_neighborhood?: string;
  store_address_city?: string;
  store_address_state?: string;
  store_address_zip_code?: string;
  store_whatsapp?: string;
  fixed_delivery_fee: number;
  sound_enabled?: boolean;
}

export interface StoreHour {
  id: string;
  day_of_week: number;
  is_open: boolean;
  open_time: string;
  close_time: string;
}

export type OrderStatus = 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';


