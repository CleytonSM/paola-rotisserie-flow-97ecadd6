import { useState, useEffect, useMemo } from "react";
import { reportsService } from "@/services/reports";
import { DateRange } from "react-day-picker";
import { getStartDateFromFilter } from "@/components/features/reports/utils";
import type { ReportsFilter, ProductReportItem, HourlySalesData, DailySalesData, PaymentMethodReport, SalesTypeReport } from "@/components/features/reports/types";
import { toast } from "sonner";
import { startOfDay, endOfDay } from "date-fns";

export function useDetailedReports() {
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<ReportsFilter>("monthly");
    const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

    const [topProducts, setTopProducts] = useState<ProductReportItem[]>([]);
    const [salesByTime, setSalesByTime] = useState<{ hourly: HourlySalesData[], daily: DailySalesData[] }>({ hourly: [], daily: [] });
    const [salesByPayment, setSalesByPayment] = useState<PaymentMethodReport[]>([]);
    const [salesByType, setSalesByType] = useState<SalesTypeReport[]>([]);

    const dateRange = useMemo(() => {
        let from: Date;
        let to: Date;

        if (filter === "custom" && customDateRange?.from) {
            from = customDateRange.from;
            to = customDateRange.to || customDateRange.from;
        } else {
            // Handle "today" case if not handled by utility
            if (filter === "today") {
                const now = new Date();
                from = now;
                to = now;
            } else {
                const startDate = getStartDateFromFilter(filter);
                from = startDate;
                to = new Date();
            }
        }
        
        return { from: startOfDay(from), to: endOfDay(to) };
    }, [filter, customDateRange]);

    const fetchTopProducts = async () => {
        setLoading(true);
        try {
            const data = await reportsService.getTopProducts(dateRange);
            setTopProducts(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar produtos");
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesByTime = async () => {
        setLoading(true);
        try {
            const data = await reportsService.getSalesByTime(dateRange);
            setSalesByTime(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar dados temporais");
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesByPayment = async () => {
        setLoading(true);
        try {
            const data = await reportsService.getSalesByPaymentMethod(dateRange);
            setSalesByPayment(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar pagamentos");
        } finally {
            setLoading(false);
        }
    };

    const fetchSalesByType = async () => {
        setLoading(true);
        try {
            const data = await reportsService.getSalesByType(dateRange);
            setSalesByType(data);
        } catch (error) {
            console.error(error);
            toast.error("Erro ao carregar tipos de venda");
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        filter,
        setFilter,
        customDateRange,
        setCustomDateRange,
        dateRange,
        topProducts,
        fetchTopProducts,
        salesByTime,
        fetchSalesByTime,
        salesByPayment,
        fetchSalesByPayment,
        salesByType,
        fetchSalesByType
    };
}
