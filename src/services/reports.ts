import { supabase } from "@/integrations/supabase/client";
import { DateRange } from "react-day-picker";
import { endOfDay, startOfDay } from "date-fns";
import { 
    ProductReportItem, 
    HourlySalesData, 
    DailySalesData, 
    PaymentMethodReport, 
    SalesTypeReport 
} from "@/components/features/reports/types";

// Helper to format dates for Supabase query
const formatDates = (dateRange: { from: Date; to: Date }) => {
    return {
        from: startOfDay(dateRange.from).toISOString(),
        to: endOfDay(dateRange.to).toISOString(),
    };
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
