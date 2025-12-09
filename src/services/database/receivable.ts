/**
 * Accounts Receivable database operations
 */

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

export interface ReceivablePayment {
  amount: number;
  payment_method: string;
  card_brand?: string;
  tax_rate?: number;
  pix_key_id?: string;
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

export const getAccountsReceivable = async (
  page: number = 1,
  pageSize: number = 100
): Promise<DatabaseResult<any[]>> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await supabase
    .from('accounts_receivable')
    .select(`
      *,
      client:clients(id, name, cpf_cnpj)
    `, { count: 'exact' })
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .range(from, to);

  return { data, error, count };
};

export const getAccountsReceivableByDateRange = async (
  dateRange: { from: Date; to?: Date },
  page: number = 1,
  pageSize: number = 100
): Promise<DatabaseResult<any[]>> => {
  // Format as YYYY-MM-DD to avoid timezone issues
  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);

  let query = supabase
    .from('accounts_receivable')
    .select(`
      *,
      client:clients(id, name, cpf_cnpj)
    `, { count: 'exact' })
    .gte('entry_date', fromDateStr);

  if (dateRange.to) {
    // Range filter: from <= entry_date <= to (include all timestamps on toDate)
    const toDate = new Date(dateRange.to);
    toDate.setDate(toDate.getDate() + 1);
    const nextDayStr = formatDateToYYYYMMDD(toDate);
    query = query.lt('entry_date', nextDayStr);
  } else {
    // Single date filter: entry_date == from (include all timestamps on fromDate)
    const nextDay = new Date(dateRange.from);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = formatDateToYYYYMMDD(nextDay);
    query = query.lt('entry_date', nextDayStr);
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
    // If payments array is provided, use partial payment logic
    if (payments && payments.length > 0) {
      // Start a transaction by creating the receivable first
      const { data: receivable, error: receivableError } = await supabase
        .from('accounts_receivable')
        .insert(account)
        .select()
        .single();

      if (receivableError) throw receivableError;

      // Insert all payment records
      const paymentRecords = payments.map(payment => ({
        receivable_id: receivable.id,
        ...payment
      }));

      const { error: paymentsError } = await supabase
        .from('receivable_payments')
        .insert(paymentRecords);

      if (paymentsError) {
        // Rollback: delete the receivable if payments fail
        await supabase.from('accounts_receivable').delete().eq('id', receivable.id);
        throw paymentsError;
      }

      return { data: receivable, error: null };
    } else {
      // Legacy single payment mode
      const { data, error } = await supabase
        .from('accounts_receivable')
        .insert(account)
        .select()
        .single();

      return { data, error };
    }
  } catch (error: any) {
    console.error('Error creating receivable:', error);
    return { data: null, error };
  }
};

export const updateAccountReceivable = async (
  id: string,
  account: any,
  payments?: ReceivablePayment[]
): Promise<DatabaseResult<any>> => {
  try {
    // Update the receivable record
    const { data, error } = await supabase
      .from('accounts_receivable')
      .update(account)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // If payments array is provided, update receivable_payments
    if (payments && payments.length > 0) {
      // Delete existing payment records
      const { error: deleteError } = await supabase
        .from('receivable_payments')
        .delete()
        .eq('receivable_id', id);

      if (deleteError) throw deleteError;

      // Insert updated payment records
      const paymentRecords = payments.map(payment => ({
        receivable_id: id,
        ...payment
      }));

      const { error: paymentsError } = await supabase
        .from('receivable_payments')
        .insert(paymentRecords);

      if (paymentsError) throw paymentsError;
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error updating receivable:', error);
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

/**
 * Helper function to format date as YYYY-MM-DD in local timezone
 */
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get accounts receivable filtered for reports
 * Filters by entry_date in the specified date range (inclusive on both ends)
 * Uses date-only comparison to avoid timezone issues
 */
export const getReceivablesForReports = async (
  dateRange: { from: Date; to: Date }
): Promise<DatabaseResult<any[]>> => {
  // Format dates as YYYY-MM-DD using local timezone
  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);
  const toDateStr = formatDateToYYYYMMDD(dateRange.to);

  console.log('[getReceivablesForReports] Query parameters:', {
    fromDateStr,
    toDateStr,
    fromDateLocal: dateRange.from.toLocaleDateString('pt-BR'),
    toDateLocal: dateRange.to.toLocaleDateString('pt-BR'),
  });

  // Add one day to toDateStr for exclusive upper bound since we're comparing timestamps
  const toDate = new Date(dateRange.to);
  toDate.setDate(toDate.getDate() + 1);
  const nextDayStr = formatDateToYYYYMMDD(toDate);

  // Query using date-only strings
  // Use < nextDay instead of <= today to include all timestamps on the end date
  const { data, error } = await supabase
    .from('accounts_receivable')
    .select(`
      *,
      client:clients(id, name, cpf_cnpj)
    `)
    .not('entry_date', 'is', null)
    .gte('entry_date', fromDateStr)  // >= fromDate 00:00:00
    .lt('entry_date', nextDayStr)     // < nextDay 00:00:00 (includes all of toDate)
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[getReceivablesForReports] Query error:', error);
  } else {
    console.log('[getReceivablesForReports] Query successful, returned', data?.length || 0, 'records');
    if (data && data.length > 0) {
      console.log('[getReceivablesForReports] Sample entry_dates:',
        data.slice(0, 3).map(r => ({
          id: r.id,
          entry_date: r.entry_date,
          net_value: r.net_value,
        }))
      );
    }
  }

  return { data, error };
};