/**
 * Client types - re-exported from central types
 */
export type { Client } from '@/types/entities';

export type ClientFormData = {
  name: string;
  cpf_cnpj: string;
  email: string;
  phone: string;
};
