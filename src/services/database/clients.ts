/**
 * Clients database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export const getClients = async (searchTerm?: string): Promise<DatabaseResult<any[]>> => {
  let query = supabase.from('clients').select('*');

  if (searchTerm) {
    // Sanitize input to prevent SQL injection - escape wildcards and limit length
    const sanitized = searchTerm
      .slice(0, 100) // Max 100 characters
      .replace(/[%_]/g, '\\$&'); // Escape SQL wildcards

    query = query.or(`name.ilike.%${sanitized}%,cpf_cnpj.ilike.%${sanitized}%`);
  }

  const { data, error } = await query.order('name');
  return { data, error };
};

export const createClient = async (client: any): Promise<DatabaseResult<any>> => {
  // Remove formatação do CPF/CNPJ (apenas números)
  const cleanedClient = {
    ...client,
    cpf_cnpj: client.cpf_cnpj ? client.cpf_cnpj.replace(/\D/g, '') : null
  };

  const { data, error } = await supabase
    .from('clients')
    .insert(cleanedClient)
    .select()
    .single();

  return { data, error };
};

export const updateClient = async (
  id: string,
  client: any
): Promise<DatabaseResult<any>> => {
  // Remove formatação do CPF/CNPJ (apenas números)
  const cleanedClient = {
    ...client,
    cpf_cnpj: client.cpf_cnpj ? client.cpf_cnpj.replace(/\D/g, '') : null
  };

  const { data, error } = await supabase
    .from('clients')
    .update(cleanedClient)
    .eq('id', id)
    .select()
    .single();

  return { data, error };
};

export const deleteClient = async (id: string): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  return { data, error };
};

