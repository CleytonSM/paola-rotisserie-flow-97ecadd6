/**
 * Suppliers database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export const getSuppliers = async (
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 100
): Promise<DatabaseResult<any[]>> => {
  let query = supabase.from('suppliers').select('*', { count: 'exact' });

  if (searchTerm) {
    const sanitized = searchTerm.slice(0, 100).replace(/[%_]/g, '\\$&');
    query = query.or(`name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('name')
    .range(from, to);

  return { data, error, count };
};

export const createSupplier = async (supplier: any): Promise<DatabaseResult<any>> => {
  // Remove formatação do CNPJ (apenas números)
  // Telefone é mantido formatado para exibição
  const cleanedSupplier = {
    ...supplier,
    cnpj: supplier.cnpj ? supplier.cnpj.replace(/\D/g, '') : null,
    email: supplier.email?.trim() || null
  };

  const { data, error } = await supabase
    .from('suppliers')
    .insert(cleanedSupplier)
    .select()
    .single();

  return { data, error };
};

export const updateSupplier = async (
  id: string,
  supplier: any
): Promise<DatabaseResult<any>> => {
  // Remove formatação do CNPJ (apenas números)
  // Telefone é mantido formatado para exibição
  const cleanedSupplier = {
    ...supplier,
    cnpj: supplier.cnpj ? supplier.cnpj.replace(/\D/g, '') : null,
    email: supplier.email?.trim() || null
  };

  const { data, error } = await supabase
    .from('suppliers')
    .update(cleanedSupplier)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteSupplier = async (id: string): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('suppliers')
    .delete()
    .eq('id', id);

  return { data, error };
};

