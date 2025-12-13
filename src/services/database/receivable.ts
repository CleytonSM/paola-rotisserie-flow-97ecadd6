import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export interface ReceivablePayment {
  amount: number;
  payment_method: string;
  card_brand?: string;
  tax_rate?: number;
  pix_key_id?: string;
  created_at?: string; 
  receivable_id?: string;
}

export const getReceivablePayments = async (
  receivableId: string
): Promise<DatabaseResult<ReceivablePayment[]>> => {
  const { data, error } = await supabase
    .from('receivable_payments')
    .select('*')
    .eq('receivable_id', receivableId)
    .order('created_at', { ascending: true });

  return { data: data as ReceivablePayment[] | null, error };
};

export interface ReceivableFilters {
  statusFilter?: 'all' | 'pending' | 'received';
  searchTerm?: string;
}

export const getAccountsReceivable = async (
  page: number = 1,
  pageSize: number = 100,
  filters?: ReceivableFilters
): Promise<DatabaseResult<any[]>> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('accounts_receivable')
    .select(`
      *,
      client:clients(id, name, cpf_cnpj)
    `, { count: 'exact' });

  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    query = query.eq('status', filters.statusFilter);
  }

  if (filters?.searchTerm && filters.searchTerm.trim()) {
    const sanitized = filters.searchTerm
      .slice(0, 100)
      .replace(/[%_]/g, '\\$&');
    query = query.ilike('client.name', `%${sanitized}%`);
  }

  const { data, error, count } = await query
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  return { data, error, count };
};

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getAccountsReceivableByDateRange = async (
  dateRange: { from: Date; to?: Date },
  page: number = 1,
  pageSize: number = 100,
  filters?: ReceivableFilters
): Promise<DatabaseResult<any[]>> => {

  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);

  let query = supabase
    .from('accounts_receivable')
    .select(`
      *,
      client:clients(id, name, cpf_cnpj)
    `, { count: 'exact' })
    .gte('entry_date', fromDateStr);

  if (dateRange.to) {
    const toDate = new Date(dateRange.to);
    toDate.setDate(toDate.getDate() + 1);
    const nextDayStr = formatDateToYYYYMMDD(toDate);
    query = query.lt('entry_date', nextDayStr);
  } else {
    const nextDay = new Date(dateRange.from);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = formatDateToYYYYMMDD(nextDay);
    query = query.lt('entry_date', nextDayStr);
  }

  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    query = query.eq('status', filters.statusFilter);
  }

  if (filters?.searchTerm && filters.searchTerm.trim()) {
    const sanitized = filters.searchTerm
      .slice(0, 100)
      .replace(/[%_]/g, '\\$&');
    query = query.ilike('client.name', `%${sanitized}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  return { data, error, count };
};

export const createAccountReceivable = async (
  account: any,
  payments?: ReceivablePayment[]
): Promise<DatabaseResult<any>> => {
  try {
    if (payments && payments.length > 0) {
      const { data: receivable, error: receivableError } = await supabase
        .from('accounts_receivable')
        .insert(account)
        .select()
        .single();

      if (receivableError) throw receivableError;

      const paymentRecords = payments.map(payment => ({
        receivable_id: receivable.id,
        ...payment
      }));

      const { error: paymentsError } = await supabase
        .from('receivable_payments')
        .insert(paymentRecords);

      if (paymentsError) {
        await supabase.from('accounts_receivable').delete().eq('id', receivable.id);
        throw paymentsError;
      }

      return { data: receivable, error: null };
    } else {
      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert(account)
        .select()
        .single();

      return { data, error };
    }
  } catch (error: any) {
    return { data: null, error };
  }
};

export const updateAccountReceivable = async (
  id: string,
  account: any,
  payments?: ReceivablePayment[]
): Promise<DatabaseResult<any>> => {
  try {
    const { error } = await supabase
      .from('accounts_receivable')
      .update(account)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    if (payments && payments.length > 0) {
      const { error: deleteError } = await supabase
        .from('receivable_payments')
        .delete()
        .eq('receivable_id', id);

      if (deleteError) throw deleteError;

      const paymentRecords = payments.map(payment => ({
        receivable_id: id,
        ...payment
      }));

      const { error: paymentsError } = await supabase
        .from('receivable_payments')
        .insert(paymentRecords);

      if (paymentsError) throw paymentsError;
    }

    return { data: null, error: null };
  } catch (error: any) {
    return { data: null, error };
  }
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

export const getReceivablesForReports = async (
  dateRange: { from: Date; to: Date }
): Promise<DatabaseResult<any[]>> => {
  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);
  
  const toDate = new Date(dateRange.to);
  toDate.setDate(toDate.getDate() + 1);
  const nextDayStr = formatDateToYYYYMMDD(toDate);

  const { data, error } = await supabase
    .from('accounts_receivable')
    .select(`
      id,
      net_value,
      entry_date,
      client:clients(name)
    `)
    .not('entry_date', 'is', null)
    .gte('entry_date', fromDateStr)
    .lt('entry_date', nextDayStr)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  return { data, error };
};