import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { endOfDay, startOfDay, addDays, differenceInDays, format } from "date-fns";
import { 
    ProductReportItem, 
    HourlySalesData, 
    DailySalesData, 
    PaymentMethodReport, 
    SalesTypeReport,
    ProjectionKPIs,
    DailyProjection,
    DetailedProjectionRow
} from "@/components/features/reports/types";

// Helper to format dates for Supabase query
const formatDates = (dateRange: { from: Date; to: Date }) => {
    return {
        from: startOfDay(dateRange.from).toISOString(),
        to: endOfDay(dateRange.to).toISOString(),
    };
};

const formatDateToYYYYMMDD = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


export const reportsService = {
    // 1. Ranking Produtos
    getTopProducts: async (dateRange: { from: Date; to: Date }): Promise<ProductReportItem[]> => {
        const { from, to } = formatDates(dateRange);
        
        const { data, error } = await supabase
            .from("sale_items")
            .select(`
                name,
                quantity,
                total_price,
                product_catalog (
                    id,
                    name
                ),
                sales!inner (
                    status,
                    payment_status,
                    accounts_receivable!inner (
                        payment_date
                    )
                )
            `)
            .eq("sales.status", "completed")
            .eq("sales.payment_status", "paid")
            .gte("sales.accounts_receivable.payment_date", from)
            .lte("sales.accounts_receivable.payment_date", to);

        if (error) throw error;

        // Aggregation in JS (since we can't easily do it in Supabase client without internal tools)
        const aggregator = new Map<string, ProductReportItem>();

        data?.forEach((item) => {
            const productName = item.product_catalog?.name || item.name;
            const productId = item.product_catalog?.id || item.name; // Fallback key
            
            const existing = aggregator.get(productId) || {
                id: productId,
                name: productName,
                quantity: 0,
                totalValue: 0
            };

            existing.quantity += Number(item.quantity);
            existing.totalValue += Number(item.total_price);
            aggregator.set(productId, existing);
        });

        return Array.from(aggregator.values()).sort((a, b) => b.totalValue - a.totalValue);
    },

    // 2. Por Hora/Dia
    getSalesByTime: async (dateRange: { from: Date; to: Date }): Promise<{ hourly: HourlySalesData[], daily: DailySalesData[] }> => {
        const { from, to } = formatDates(dateRange);

        const { data, error } = await supabase
            .from("sales")
            .select(`
                total_amount,
                accounts_receivable!inner (
                    payment_date
                )
            `)
            .eq("status", "completed")
            .eq("payment_status", "paid")
            .gte("accounts_receivable.payment_date", from)
            .lte("accounts_receivable.payment_date", to);

        if (error) throw error;

        const hoursMap = new Array(24).fill(0).map((_, i) => ({ hour: i, value: 0, count: 0 }));
        const daysMap = new Map<number, { value: number, count: number }>(); 

        data?.forEach((sale: any) => {
            const date = new Date(sale.accounts_receivable.payment_date);
            const hour = date.getHours();
            const day = date.getDay();
            const amount = Number(sale.total_amount);

            // Hourly
            hoursMap[hour].value += amount;
            hoursMap[hour].count += 1;

            // Daily
            const currentDay = daysMap.get(day) || { value: 0, count: 0 };
            currentDay.value += amount;
            currentDay.count += 1;
            daysMap.set(day, currentDay);
        });

        const weekDays = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
        const daily = Array.from(daysMap.entries()).map(([dayIdx, val]) => ({
            dayOfWeek: weekDays[dayIdx],
            value: val.value,
            count: val.count
        })).sort((a, b) => weekDays.indexOf(a.dayOfWeek) - weekDays.indexOf(b.dayOfWeek)); // Use map keys to sort if needed, but simple map is usually enough. For correct order:
        
        // Ensure all days depend on range, but for specific "By Day of Week" report often we want aggregate over multiple weeks.
        
        return { hourly: hoursMap, daily };
    },

    // 3. Por Forma de Pagamento
    getSalesByPaymentMethod: async (dateRange: { from: Date; to: Date }): Promise<PaymentMethodReport[]> => {
        const { from, to } = formatDates(dateRange);

        const { data, error } = await supabase
            .from("sale_payments")
            .select(`
                amount,
                payment_method,
                sales!inner (
                    status,
                    payment_status,
                    accounts_receivable!inner (
                        payment_date
                    )
                )
            `)
            .eq("sales.status", "completed")
            .eq("sales.payment_status", "paid")
            .gte("sales.accounts_receivable.payment_date", from)
            .lte("sales.accounts_receivable.payment_date", to);

        if (error) throw error;

        const methodMap = new Map<string, { total: number, count: number }>();
        let grandTotal = 0;

        data?.forEach((payment) => {
            const amount = Number(payment.amount);
            const method = payment.payment_method;
            
            const existing = methodMap.get(method) || { total: 0, count: 0 };
            existing.total += amount;
            existing.count += 1;
            methodMap.set(method, existing);
            
            grandTotal += amount;
        });

        return Array.from(methodMap.entries()).map(([method, stats]) => ({
            method: formatPaymentMethod(method),
            total: stats.total,
            count: stats.count,
            percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0
        })).sort((a, b) => b.total - a.total);
    },

    // 4. Por Tipo de Venda (Assuming we can distinguish types, else defaults)
    // Currently the schema doesn't seem to have explicit 'type' column on sales table, 
    // but we can infer from delivery address presence or specific metadata if available.
    // Based on user request "Balcão / Entrega / Agendado", let's check if we can infer this.
    // If not, we might need to rely on 'client_id' (if null -> balcao?) or add a column.
    // However, looking at the schema provided in knowledge base, there isn't a direct 'type' column on 'sales'.
    // `sales` has `client_id`. `sale_items` has `product_item_id`.
    // I will use a placeholder logic or inferred logic: 
    // - If has client address -> Delivery (Need to join with simple client check or if shipping info is stored)
    // - Actually, let's look at `delivery_orders` table if it exists? 
    // NOT FOUND in schema. 
    // Maybe checking `notes` or if `client_id` is present vs null?
    // For now I'll create the structure and maybe infer from "is_delivery" if that flag existed, but I'll check `sales` columns again.
    // Provided Schema: `sales` (id, display_id, total_amount, client_id, status, notes, change_amount, created_at).
    // It seems there is no explicit type. I'll infer:
    // If client_id is NULL -> "Balcão"
    // If client_id is SET -> "Identificado" (Could be delivery or just loyal customer)
    // Wait, the user mentions "Balcão / Entrega / Agendado".
    // I will start by just grouping by Client presence for now as "Balcão" vs "Cliente Registrado".
    getSalesByType: async (dateRange: { from: Date; to: Date }): Promise<SalesTypeReport[]> => {
        const { from, to } = formatDates(dateRange);

        // Note: is_delivery and scheduled_pickup are fields in the sale jsonb or columns? 
        // Based on `SaleData` interface in sales.ts, these are passed to `complete_sale`. 
        // I need to check if they are actual columns in the `sales` table or just params.
        // The Knowledge Base says `sales` table has: id, display_id, total_amount, client_id, status, notes, change_amount, created_at.
        // It does NOT list is_delivery. 
        // However, `complete_sale` might store them in a different way or the schema docs are outdated.
        // If I assume they are NOT columns, I have to rely on `notes` or `client_id` as fallback.
        // BUT, `SaleData` interface has them. Let's assume they might be in `notes` text or we stick to the inference I made.
        // ...Actually, looking at `sales.ts`, it sends `p_sale_data` to RPC. 
        // If the RPC inserts into `sales`, it matches the table schema.
        // If schema doesn't have `is_delivery`, maybe it's lost or in `notes`.
        // I will stick to the previous inference but improve it slightly if possible.
        // Actually, let's keep the previous implementation as the schema docs don't confirm `is_delivery` column.
        // I'll add a check for "Entrega" in notes which is common.
        
        const { data, error } = await supabase
            .from("sales")
            .select(`
                id, total_amount, client_id, notes, is_delivery, scheduled_pickup,
                accounts_receivable!inner (
                    payment_date
                )
            `) 
            .eq("status", "completed")
            .eq("payment_status", "paid")
            .gte("accounts_receivable.payment_date", from)
            .lte("accounts_receivable.payment_date", to);

        if (error) throw error;

        const typeMap = new Map<string, { total: number, count: number }>();
        let grandTotal = 0;

        data?.forEach((sale) => {
            const amount = Number(sale.total_amount);
            let type = "Balcão"; 
            
            if (sale.is_delivery) {
                type = "Entrega";
            } else if (sale.scheduled_pickup) {
                type = "Agendado";
            }

            const existing = typeMap.get(type) || { total: 0, count: 0 };
            existing.total += amount;
            existing.count += 1;
            typeMap.set(type, existing);
            grandTotal += amount;
        });

        return Array.from(typeMap.entries()).map(([type, stats]) => ({
            type,
            total: stats.total,
            count: stats.count,
            percentage: grandTotal > 0 ? (stats.total / grandTotal) * 100 : 0
        })).sort((a, b) => b.total - a.total);
    },

    // 5. Projeções
    getProjections: async (days: number): Promise<{
        kpis: ProjectionKPIs,
        chartData: DailyProjection[],
        payablesTable: DetailedProjectionRow[],
        receivablesTable: DetailedProjectionRow[]
    }> => {
        const today = startOfDay(new Date());
        const endDate = endOfDay(addDays(today, days));
        
        const todayStr = formatDateToYYYYMMDD(today);
        const endDateStr = formatDateToYYYYMMDD(endDate);

        // Current Balance (Estimated from all history)
        const { data: recBalance } = await supabase.from('accounts_receivable').select('net_value').eq('status', 'received');
        const { data: payBalance } = await supabase.from('accounts_payable').select('value').eq('status', 'paid');
        
        const currentBalance = (recBalance?.reduce((a, b) => a + Number(b.net_value), 0) || 0) - 
                             (payBalance?.reduce((a, b) => a + Number(b.value), 0) || 0);

        // Pending Payables
        const { data: payables, error: pError } = await supabase
            .from('accounts_payable')
            .select('id, value, due_date, supplier:suppliers(name)')
            .neq('status', 'paid')
            .lte('due_date', endDateStr)
            .order('due_date', { ascending: true });

        if (pError) throw pError;

        // Pending Receivables
        const { data: receivables, error: rError } = await supabase
            .from('accounts_receivable')
            .select('id, net_value, entry_date, client:clients(name)')
            .neq('status', 'received')
            .lte('entry_date', endDateStr)
            .order('entry_date', { ascending: true });

        if (rError) throw rError;

        // Calculate KPIs
        const kpis: ProjectionKPIs = {
            currentBalance: currentBalance,
            totalToPay: 0,
            totalToReceive: 0,
            estimatedBalance: 0,
            payablesOverdue: 0,
            payablesToday: 0,
            payables7: 0,
            payables15: 0,
            payables30: 0,
            receivablesOverdue: 0,
            receivablesToday: 0,
            receivables7: 0,
            receivables15: 0,
            receivables30: 0
        };

        const todayDateStr = formatDateToYYYYMMDD(today); // "2025-12-27" in local time

        payables?.forEach(p => {
            const val = Number(p.value);
            // p.due_date is "YYYY-MM-DD" or ISO. We just need the date part.
            const dueStr = p.due_date.split('T')[0];
            const due = new Date(dueStr + 'T12:00:00'); // Treat as local midday
            const diff = differenceInDays(due, today);
            
            // Overdue: strictly before today
            if (dueStr < todayDateStr) kpis.payablesOverdue += val;
            
            // Today: exactly today string match
            if (dueStr === todayDateStr) kpis.payablesToday += val;
            
            // Future buckets (include Today for "Next X days")
            if (diff >= 0 && diff <= 7) kpis.payables7 += val;
            if (diff >= 0 && diff <= 15) kpis.payables15 += val;
            if (diff >= 0 && diff <= 30) kpis.payables30 += val;
            
            kpis.totalToPay += val;
        });

        receivables?.forEach(r => {
            const val = Number(r.net_value);
            const entryStr = r.entry_date.split('T')[0];
            const entry = new Date(entryStr + 'T12:00:00');
            const diff = differenceInDays(entry, today);
            
            if (entryStr < todayDateStr) kpis.receivablesOverdue += val;
            if (entryStr === todayDateStr) kpis.receivablesToday += val;

            if (diff >= 0 && diff <= 7) kpis.receivables7 += val;
            if (diff >= 0 && diff <= 15) kpis.receivables15 += val;
            if (diff >= 0 && diff <= 30) kpis.receivables30 += val;
            
            kpis.totalToReceive += val;
        });

        // Estimated Balance = Current Money + Total Pending (Overdue + Future)
        // Wait, 'totalToReceive' is summing ALL fetched pending items?
        // Yes, because fetch has .neq('status', 'paid') and .lte(endDateStr)
        // The fetch includes OVERDUE items if they are <= endDateStr (which is true for past dates).
        // Correct.
        kpis.estimatedBalance = kpis.currentBalance + kpis.totalToReceive - kpis.totalToPay;

        // Chart Data (Daily)
        const chartData: DailyProjection[] = [];
        
        // Start running balance with REALIZED balance + OVERDUE pending items
        // This answers: "If I cleared all my backlogs today, where would I stand?"
        // and ensures past pending items influence the future trend line starting Day 0.
        let runningBalance = kpis.currentBalance + kpis.receivablesOverdue - kpis.payablesOverdue;

        // Create a map for faster lookup and date normalization
        const payablesMap = new Map<string, number>();
        payables?.forEach(p => {
             const d = p.due_date.split('T')[0]; // Ensure YYYY-MM-DD
             const current = payablesMap.get(d) || 0;
             payablesMap.set(d, current + Number(p.value));
        });

        const receivablesMap = new Map<string, number>();
        receivables?.forEach(r => {
             const d = r.entry_date.split('T')[0];
             const current = receivablesMap.get(d) || 0;
             receivablesMap.set(d, current + Number(r.net_value));
        });

        for (let i = 0; i <= days; i++) {
            const date = addDays(today, i);
            const dateStr = formatDateToYYYYMMDD(date);
            
            const dayPayables = payablesMap.get(dateStr) || 0;
            const dayReceivables = receivablesMap.get(dateStr) || 0;
            
            // For Day 0 (Today), we must handle carefully:
            // kpis.payablesToday and kpis.receivablesToday are already SUMMED in the maps above via dateStr match.
            // Our starting runningBalance includes OVERDUE (< Today) but EXCLUDES Today's pending.
            // So adding (dayReceivables - dayPayables) here correctly adds Today's effect.
            
            runningBalance += (dayReceivables - dayPayables);
            
            chartData.push({
                date: format(date, "dd/MM"),
                balance: runningBalance
            });
        }

        // Tables Data
        const groupDetailed = (data: any[], dateField: string, valueField: string, originField: string): DetailedProjectionRow[] => {
            const map = new Map<string, DetailedProjectionRow>();
            data.forEach(item => {
                const dateRaw = item[dateField];
                if (!dateRaw) return;
                
                // Normalizing key to avoid duplication if times vary
                const dateKey = dateRaw.split('T')[0];

                if (!map.has(dateKey)) {
                    map.set(dateKey, { date: dateKey, total: 0, items: [] });
                }
                const row = map.get(dateKey)!;
                row.total += Number(item[valueField]);
                row.items.push({
                    origin: item[originField]?.name || "Desconhecido",
                    value: Number(item[valueField])
                });
            });
            return Array.from(map.values()).sort((a,b) => a.date.localeCompare(b.date));
        };

        const payablesTable = groupDetailed(payables || [], 'due_date', 'value', 'supplier');
        const receivablesTable = groupDetailed(receivables || [], 'entry_date', 'net_value', 'client');

        return { kpis, chartData, payablesTable, receivablesTable };
    }
};

const formatPaymentMethod = (method: string) => {
    const map: Record<string, string> = {
        cash: "Dinheiro",
        card_credit: "Crédito",
        card_debit: "Débito",
        pix: "Pix",
        multiple: "Múltiplo"
    };
    return map[method] || method;
};
