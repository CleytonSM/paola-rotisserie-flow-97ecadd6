import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export const getClients = async (
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 100
): Promise<DatabaseResult<any[]>> => {
  let query = supabase.from('clients').select('*', { count: 'exact' });

  if (searchTerm) {
    // Sanitize input to prevent SQL injection - escape wildcards and limit length
    const sanitized = searchTerm
      .slice(0, 100) // Max 100 characters
      .replace(/[%_]/g, '\\$&'); // Escape SQL wildcards

    query = query.or(`name.ilike.%${sanitized}%,cpf_cnpj.ilike.%${sanitized}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('name')
    .range(from, to);

  return { data, error, count };
};

export const getClientsList = async (
  searchTerm?: string,
  page: number = 1,
  pageSize: number = 100
): Promise<DatabaseResult<any[]>> => {
  let query = supabase.from('clients').select('id, name, cpf_cnpj, email, phone', { count: 'exact' });

  if (searchTerm) {
    // Sanitize input to prevent SQL injection - escape wildcards and limit length
    const sanitized = searchTerm
      .slice(0, 100) // Max 100 characters
      .replace(/[%_]/g, '\\$&'); // Escape SQL wildcards

    query = query.or(`name.ilike.%${sanitized}%,cpf_cnpj.ilike.%${sanitized}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('name')
    .range(from, to);

  return { data, error, count };
};

export const getClientById = async (id: string): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single();

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


export const checkClientExists = async (cpfCnpj: string, excludeId?: string): Promise<boolean> => {
  const cleanedCpfCnpj = cpfCnpj.replace(/\D/g, '');
  
  let query = supabase
    .from('clients')
    .select('id')
    .eq('cpf_cnpj', cleanedCpfCnpj);

  if (excludeId) {
    query = query.neq('id', excludeId);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') {
    return false;
  }

  return !!data;
};
