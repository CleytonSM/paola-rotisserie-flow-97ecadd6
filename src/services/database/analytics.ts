

import { supabase } from "@/integrations/supabase/client";
import type { DatabaseResult } from "./types";


const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getWeeklyBalance = async (): Promise<DatabaseResult<any>> => {
  const today = new Date();
  const weekAgo = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7);
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const weekAgoStr = formatDateToYYYYMMDD(weekAgo);
  const tomorrowStr = formatDateToYYYYMMDD(tomorrow);




  const { data: receivables, error: recError } = await supabase
    .from('accounts_receivable')
    .select('net_value')
    .gte('payment_date', weekAgoStr)
    .lt('payment_date', tomorrowStr)
    .eq('status', 'received');

  if (recError) return { data: null, error: recError };


  const { data: payables, error: payError } = await supabase
    .from('accounts_payable')
    .select('value')
    .gte('payment_date', weekAgoStr)
    .lt('payment_date', tomorrowStr)
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
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const sevenDaysLater = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
  const eightDaysLater = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 8);

  const todayStr = formatDateToYYYYMMDD(todayDate);
  const eightDaysLaterStr = formatDateToYYYYMMDD(eightDaysLater);

  const { count, error } = await supabase
    .from('accounts_payable')
    .select('*', { count: 'exact', head: true })
    .not('due_date', 'is', null)
    .gte('due_date', todayStr)
    .lt('due_date', eightDaysLaterStr) // Includes next 7 days
    .neq('status', 'paid');

  if (error) return { data: null, error };

  return {
    data: count || 0,
    error: null,
  };
};

export const getOverduePayablesCount = async (): Promise<DatabaseResult<number>> => {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayStr = formatDateToYYYYMMDD(todayDate);

  const { count, error } = await supabase
    .from('accounts_payable')
    .select('*', { count: 'exact', head: true })
    .not('due_date', 'is', null)
    .lt('due_date', todayStr) // Before today (overdue)
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
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
    const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const sixMonthsAgoStr = formatDateToYYYYMMDD(sixMonthsAgo);
    const tomorrowStr = formatDateToYYYYMMDD(tomorrow);

    const { data: receivables, error: receivablesError } = await supabase
      .from('accounts_receivable')
      .select('net_value, payment_date')
      .eq('status', 'received')
      .gte('payment_date', sixMonthsAgoStr)
      .lt('payment_date', tomorrowStr);

    if (receivablesError) throw receivablesError;

    const { data: payables, error: payablesError } = await supabase
      .from('accounts_payable')
      .select('value, payment_date')
      .gte('payment_date', sixMonthsAgoStr)
      .lt('payment_date', tomorrowStr);

    if (payablesError) throw payablesError;

    const monthlyData = new Map<string, { receivable: number; payable: number }>();

    receivables?.forEach((r) => {
      if (!r.payment_date) return;
      const month = new Date(r.payment_date).toISOString().slice(0, 7);
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

    const historical = Array.from(monthlyData.entries())
      .map(([month, data]) => ({
        month,
        profit: data.receivable - data.payable,
        type: 'historical' as const,
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const lastThreeMonths = historical.slice(-3);
    const avgProfit = lastThreeMonths.length > 0
      ? lastThreeMonths.reduce((sum, m) => sum + m.profit, 0) / lastThreeMonths.length
      : 0;

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
    return {
      data: null,
      error: error as Error,
    };
  }
};