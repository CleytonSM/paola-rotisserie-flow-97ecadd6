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

export const getAccountsPayableByDateRange = async (
  dateRange: { from: Date; to?: Date }
): Promise<DatabaseResult<any[]>> => {
  const fromDate = new Date(dateRange.from);
  fromDate.setHours(0, 0, 0, 0);

  let query = supabase
    .from('accounts_payable')
    .select(`
      *,
      supplier:suppliers(id, name)
    `)
    .gte('due_date', fromDate.toISOString());

  if (dateRange.to) {
    // Range filter: from <= due_date <= to
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte('due_date', toDate.toISOString());
  } else {
    // Single date filter: due_date == from
    const nextDay = new Date(fromDate);
    nextDay.setDate(nextDay.getDate() + 1);
    query = query.lt('due_date', nextDay.toISOString());
  }

  const { data, error } = await query.order('payment_date', { ascending: false });

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
    .order('entry_date', { ascending: false });

  return { data, error };
};

export const getAccountsReceivableByDateRange = async (
  dateRange: { from: Date; to?: Date }
): Promise<DatabaseResult<any[]>> => {
  const fromDate = new Date(dateRange.from);
  fromDate.setHours(0, 0, 0, 0);

  let query = supabase
    .from('accounts_receivable')
    .select(`
      *,
      client:clients(id, name, cpf_cnpj)
    `)
    .gte('entry_date', fromDate.toISOString());

  if (dateRange.to) {
    // Range filter: from <= entry_date <= to
    const toDate = new Date(dateRange.to);
    toDate.setHours(23, 59, 59, 999);
    query = query.lte('entry_date', toDate.toISOString());
  } else {
    // Single date filter: entry_date == from
    const nextDay = new Date(fromDate);
    nextDay.setDate(nextDay.getDate() + 1);
    query = query.lt('entry_date', nextDay.toISOString());
  }

  const { data, error } = await query.order('entry_date', { ascending: false });

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

export const updateAccountReceivableStatus = async (
  id: string,
  status: string
): Promise<DatabaseResult<any>> => {
  const { data, error } = await supabase
    .from('accounts_receivable')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

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
    .gte('entry_date', weekAgo.toISOString())
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

export const getUnpaidPayablesCount = async (): Promise<DatabaseResult<number>> => {
  const { count, error } = await supabase
    .from('accounts_payable')
    .select('*', { count: 'exact', head: true })
    .neq('status', 'paid');

  if (error) return { data: null, error };

  return {
    data: count || 0,
    error: null,
  };
};

export const getClientsCount = async (): Promise<DatabaseResult<number>> => {
  const { count, error } = await supabase
    .from('clients')
    .select('*', { count: 'exact', head: true });

  if (error) return { data: null, error };

  return {
    data: count || 0,
    error: null,
  };
};

export const getSuppliersCount = async (): Promise<DatabaseResult<number>> => {
  const { count, error } = await supabase
    .from('suppliers')
    .select('*', { count: 'exact', head: true });

  if (error) return { data: null, error };

  return {
    data: count || 0,
    error: null,
  };
};

export const getUpcomingPayablesCount = async (): Promise<DatabaseResult<number>> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sevenDaysLater = new Date();
  sevenDaysLater.setDate(today.getDate() + 7);
  sevenDaysLater.setHours(23, 59, 59, 999);

  const { count, error } = await supabase
    .from('accounts_payable')
    .select('*', { count: 'exact', head: true })
    .not('due_date', 'is', null)
    .gte('due_date', today.toISOString())
    .lte('due_date', sevenDaysLater.toISOString())
    .neq('status', 'paid');

  if (error) return { data: null, error };

  return {
    data: count || 0,
    error: null,
  };
};

export const getProfitHistory = async (): Promise<DatabaseResult<{
  month: string;
  profit: number;
  type: 'historical' | 'projected';
}[]>> => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: receivables, error: receivablesError } = await supabase
      .from('accounts_receivable')
      .select('net_value, entry_date')
      .gte('entry_date', sixMonthsAgo.toISOString());

    if (receivablesError) throw receivablesError;

    const { data: payables, error: payablesError } = await supabase
      .from('accounts_payable')
      .select('value, payment_date')
      .gte('payment_date', sixMonthsAgo.toISOString());

    if (payablesError) throw payablesError;

    // Agrupar por mês
    const monthlyData = new Map<string, { receivable: number; payable: number }>();

    receivables?.forEach((r) => {
      const month = new Date(r.entry_date).toISOString().slice(0, 7);
      const current = monthlyData.get(month) || { receivable: 0, payable: 0 };
      current.receivable += Number(r.net_value);
      monthlyData.set(month, current);
    });

    payables?.forEach((p) => {
      const month = new Date(p.payment_date).toISOString().slice(0, 7);
      const current = monthlyData.get(month) || { receivable: 0, payable: 0 };
      current.payable += Number(p.value);
      monthlyData.set(month, current);
    });

    // Converter para array e ordenar
    const historical = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        profit: data.receivable - data.payable,
        type: 'historical' as const,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Calcular projeção simples (média dos últimos 3 meses)
    const lastThreeMonths = historical.slice(-3);
    const avgProfit = lastThreeMonths.length > 0
      ? lastThreeMonths.reduce((sum, m) => sum + m.profit, 0) / lastThreeMonths.length
      : 0;

    // Gerar 3 meses de projeção
    const projected = [];
    const now = new Date();
    for (let i = 1; i <= 3; i++) {
      const projectedDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      projected.push({
        month: projectedDate.toISOString().slice(0, 7),
        profit: avgProfit,
        type: 'projected' as const,
      });
    }

    return {
      data: [...historical, ...projected],
      error: null,
    };
  } catch (error) {
    console.error('Error getting profit history:', error);
    return {
      data: null,
      error: error as Error,
    };
  }
};

// ============= REFRESH TOKENS =============
export const revokeRefreshTokens = async (userId: string): Promise<DatabaseResult<void>> => {
  const { error } = await supabase
    .from('refresh_tokens')
    .update({ revoked_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('revoked_at', null);

  return { data: null, error };
};

export const saveRefreshToken = async (
  userId: string,
  tokenHash: string,
  expiresAt: Date
): Promise<DatabaseResult<void>> => {
  const { error } = await supabase
    .from('refresh_tokens')
    .insert({
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      device_info: navigator.userAgent,
    });

  return { data: null, error };
};

export const getValidRefreshToken = async (
  userId: string,
  tokenHash: string
): Promise<DatabaseResult<boolean>> => {
  const { data, error } = await supabase
    .from('refresh_tokens')
    .select('id')
    .eq('user_id', userId)
    .eq('token_hash', tokenHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return { data: null, error };
  }

  return { data: !!data, error: null };
};