/**
 * Supplier types - re-exported from central types
 */
export type { Supplier } from '@/types/entities';

export type SupplierFormData = {
  name: string;
  cnpj: string;
  email: string;
  phone: string;
};
