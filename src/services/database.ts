/**
 * Camada de abstração para acesso ao banco de dados
 * Esta camada isola a implementação do Supabase, facilitando migração futura
 */

import { supabase } from "@/integrations/supabase/client";

// Tipos genéricos para queries
export type DatabaseQuery<T> = (params?: any) => Promise<DatabaseResult<T>>;
export type DatabaseMutation<T> = (data: any) => Promise<DatabaseResult<T>>;

export interface DatabaseResult<T> {
  data: T | null;
  error: Error | null;
}

// ============= SUPPLIERS =============
export const getSuppliers = async (): Promise<DatabaseResult<any[]>> => {
  const { data, error } = await supabase
    .from('suppliers')
    .select('*')
    .order('name');
  
  return { data, error };
};

export const createSupplier = async (supplier: any): Promise<DatabaseResult<any>> => {
  // Remove formatação do CNPJ (apenas números)
  const cleanedSupplier = {
    ...supplier,
    cnpj: supplier.cnpj ? supplier.cnpj.replace(/\D/g, '') : null
  };
  
  const { data, error } = await supabase
    .from('suppliers')
    .insert(cleanedSupplier)
    .select()
    .single();
  
  return { data, error };
};

// ============= CLIENTS =============
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

// ============= ACCOUNTS PAYABLE =============
export const getAccountsPayable = async (): Promise<DatabaseResult<any[]>> => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .select(`
      *,
      supplier:suppliers(id, name)
    `)
    .order('payment_date', { ascending: false });
  
  return { data, error };
};

export const createAccountPayable = async (account: any): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .insert(account)
    .select()
    .single();
  
  return { data, error };
};

export const updateAccountPayableStatus = async (
  id: string, 
  status: string
): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .update({ status })
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const updateAccountPayable = async (
  id: string,
  account: any
): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .update(account)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const deleteAccountPayable = async (id: string): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_payable')
    .delete()
    .eq('id', id);
  
  return { data, error };
};

// ============= ACCOUNTS RECEIVABLE =============
export const getAccountsReceivable = async (): Promise<DatabaseResult<any[]>> => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .select(`
      *,
      client:clients(id, name, cpf_cnpj)
    `)
    .order('receipt_date', { ascending: false });
  
  return { data, error };
};

export const createAccountReceivable = async (account: any): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .insert(account)
    .select()
    .single();
  
  return { data, error };
};

export const updateAccountReceivable = async (
  id: string,
  account: any
): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update(account)
    .eq('id', id)
    .select()
    .single();
  
  return { data, error };
};

export const deleteAccountReceivable = async (id: string): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .delete()
    .eq('id', id);
  
  return { data, error };
};

// ============= DASHBOARD ANALYTICS =============
export const getWeeklyBalance = async (): Promise<DatabaseResult<any>> => {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  // Buscar entradas
  const { data: receivables, error: recError } = await supabase
    .from('accounts_receivable')
    .select('net_value')
    .gte('receipt_date', weekAgo.toISOString())
    .eq('status', 'received');
  
  if (recError) return { data: null, error: recError };
  
  // Buscar saídas
  const { data: payables, error: payError } = await supabase
    .from('accounts_payable')
    .select('value')
    .gte('payment_date', weekAgo.toISOString())
    .eq('status', 'paid');
  
  if (payError) return { data: null, error: payError };
  
  const totalReceivable = receivables?.reduce((sum, r) => sum + Number(r.net_value), 0) || 0;
  const totalPayable = payables?.reduce((sum, p) => sum + Number(p.value), 0) || 0;
  
  return {
    data: {
      balance: totalReceivable - totalPayable,
      totalReceivable,
      totalPayable,
    },
    error: null,
  };
};

export const getPendingCounts = async (): Promise<DatabaseResult<any>> => {
  const { data: pendingPayables, error: payError } = await supabase
    .from('accounts_payable')
    .select('id', { count: 'exact' })
    .eq('status', 'pending');
  
  if (payError) return { data: null, error: payError };
  
  const { data: pendingReceivables, error: recError } = await supabase
    .from('accounts_receivable')
    .select('id', { count: 'exact' })
    .eq('status', 'pending');
  
  if (recError) return { data: null, error: recError };
  
  return {
    data: {
      pendingPayables: pendingPayables?.length || 0,
      pendingReceivables: pendingReceivables?.length || 0,
    },
    error: null,
  };
};