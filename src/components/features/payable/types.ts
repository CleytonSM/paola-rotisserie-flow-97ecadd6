/**
 * Payable types - re-exported from central types
 */
export type { Supplier, AccountPayable } from '@/types/entities';
export type { StatusFilter, AccountStatus } from '@/types/filters';

export type PayableFormData = {
  supplier_id: string;
  value: string;
  payment_method: string;
  notes: string;
  due_date: Date | undefined;
  payment_date: Date | undefined;
  status: string;
};
