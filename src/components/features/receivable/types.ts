/**
 * Receivable types - re-exported from central types
 */
export type { Client, AccountReceivable } from '@/types/entities';
export type { StatusFilter, AccountStatus } from '@/types/filters';

export type ReceivableFormData = {
  client_id: string;
  gross_value: string;
  payment_method: string;
  card_brand: string;
  tax_rate: string;
  entry_date: Date | undefined;
};
