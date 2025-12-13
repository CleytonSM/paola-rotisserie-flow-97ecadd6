
import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";


const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export interface PayableFilters {
  statusFilter?: 'all' | 'pending' | 'paid' | 'overdue';
  searchTerm?: string;
}

export const getAccountsPayable = async (
  page: number = 1,
  pageSize: number = 100,
  filters?: PayableFilters
): Promise<DatabaseResult<any[]>> => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('accounts_payable')
    .select(`
      *,
      supplier:suppliers(id, name)
    `, { count: 'exact' });

  // Apply status filter
  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    if (filters.statusFilter === 'overdue') {
      // Overdue: due_date < today AND status != 'paid'
      const todayStr = formatDateToYYYYMMDD(new Date());
      query = query
        .lt('due_date', todayStr)
        .neq('status', 'paid');
    } else {
      query = query.eq('status', filters.statusFilter);
    }
  }

  // Apply search filter (search by supplier name)
  if (filters?.searchTerm && filters.searchTerm.trim()) {
    const sanitized = filters.searchTerm
      .slice(0, 100)
      .replace(/[%_]/g, '\\$&');
    query = query.ilike('supplier.name', `%${sanitized}%`);
  }

  const { data, error, count } = await query
    .order('payment_date', { ascending: false })
    .range(from, to);
  return { data, error, count };
};

export const getAccountsPayableByDateRange = async (
  dateRange: { from: Date; to?: Date },
  page: number = 1,
  pageSize: number = 100,
  filters?: PayableFilters
): Promise<DatabaseResult<any[]>> => {

  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);

  let query = supabase
    .from('accounts_payable')
    .select(`
      *,
      supplier:suppliers(id, name)
    `, { count: 'exact' })
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

  // Apply status filter
  if (filters?.statusFilter && filters.statusFilter !== 'all') {
    if (filters.statusFilter === 'overdue') {
      const todayStr = formatDateToYYYYMMDD(new Date());
      query = query
        .lt('due_date', todayStr)
        .neq('status', 'paid');
    } else {
      query = query.eq('status', filters.statusFilter);
    }
  }

  // Apply search filter
  if (filters?.searchTerm && filters.searchTerm.trim()) {
    const sanitized = filters.searchTerm
      .slice(0, 100)
      .replace(/[%_]/g, '\\$&');
    query = query.ilike('supplier.name', `%${sanitized}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await query
    .order('payment_date', { ascending: false })
    .range(from, to);
  return { data, error, count };
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

export const getPayablesForReports = async (
  dateRange: { from: Date; to: Date }
): Promise<DatabaseResult<any[]>> => {
  // Format dates as YYYY-MM-DD using local timezone
  const fromDateStr = formatDateToYYYYMMDD(dateRange.from);
  const toDateStr = formatDateToYYYYMMDD(dateRange.to);



  // Add one day to toDateStr for exclusive upper bound since we're comparing timestamps
  const toDate = new Date(dateRange.to);
  toDate.setDate(toDate.getDate() + 1);
  const nextDayStr = formatDateToYYYYMMDD(toDate);

  // Query using date-only strings
  // Use < nextDay instead of <= today to include all timestamps on the end date
  const { data, error } = await supabase
    .from('accounts_payable')
    .select(`
      id,
      value,
      payment_date,
      supplier:suppliers(name)
    `)
    .not('payment_date', 'is', null)
    .gte('payment_date', fromDateStr)  // >= fromDate 00:00:00
    .lt('payment_date', nextDayStr)     // < nextDay 00:00:00 (includes all of toDate)
    .order('payment_date', { ascending: false });

  if (error) {
    if (data && data.length > 0) {
      // Data loaded
    }
  }

  return { data, error };
};