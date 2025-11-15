/**
 * Suppliers database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export const getSuppliers = async (): Promise<DatabaseResult<any[]>> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');

  return { data, error };
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

