/**
 * Accounts Payable database operations
 */
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";

/**
 * Helper function to format date as YYYY-MM-DD in local timezone
 */
const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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
  // Format as YYYY-MM-DD to avoid timezone issues
  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);

  let query = supabase
    .from('accounts_payable')
    .select(`
      *,
      supplier:suppliers(id, name)
    `)
    .gte('payment_date', fromDateStr);

  if (dateRange.to) {
    // Range filter: from <= payment_date <= to (include all timestamps on toDate)
    const toDate = new Date(dateRange.to);
    toDate.setDate(toDate.getDate() + 1);
    const nextDayStr = formatDateToYYYYMMDD(toDate);
    query = query.lt('payment_date', nextDayStr);
  } else {
    // Single date filter: payment_date == from (include all timestamps on fromDate)
    const nextDay = new Date(dateRange.from);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = formatDateToYYYYMMDD(nextDay);
    query = query.lt('payment_date', nextDayStr);
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

/**
 * Get accounts payable filtered for reports
 * Filters by payment_date in the specified date range (inclusive on both ends)
 * Uses date-only comparison to avoid timezone issues
 */
export const getPayablesForReports = async (
  dateRange: { from: Date; to: Date }
): Promise<DatabaseResult<any[]>> => {
  // Format dates as YYYY-MM-DD using local timezone
  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);
  const toDateStr = formatDateToYYYYMMDD(dateRange.to);

  console.log('[getPayablesForReports] Query parameters:', {
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
    .from('accounts_payable')
    .select(`
      *,
      supplier:suppliers(id, name)
    `)
    .not('payment_date', 'is', null)
    .gte('payment_date', fromDateStr)  // >= fromDate 00:00:00
    .lt('payment_date', nextDayStr)     // < nextDay 00:00:00 (includes all of toDate)
    .order('payment_date', { ascending: false });

  if (error) {
    console.error('[getPayablesForReports] Query error:', error);
  } else {
    console.log('[getPayablesForReports] Query successful, returned', data?.length || 0, 'records');
    if (data && data.length > 0) {
      console.log('[getPayablesForReports] Sample payment_dates:',
        data.slice(0, 3).map(p => ({
          id: p.id,
          payment_date: p.payment_date,
          value: p.value,
        }))
      );
    }
  }

  return { data, error };
};