import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type {
  AccountReceivable,
  AccountPayable,
  ReportsFilter,
  BarChartData,
  PieChartData,
  TopItem,
} from "@/components/ui/reports/types";
import { getReceivablesForReports, getPayablesForReports } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { getStartDateFromFilter } from "@/components/ui/reports/utils";

export const useReports = () => {
    const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [filter, setFilter] = useState<ReportsFilter>("monthly");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  const dateRange = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (filter === "custom" && customDateRange?.from) {
      startDate = new Date(customDateRange.from.getFullYear(), customDateRange.from.getMonth(), customDateRange.from.getDate());
      if (customDateRange.to) {
        endDate = new Date(customDateRange.to.getFullYear(), customDateRange.to.getMonth(), customDateRange.to.getDate());
      } else {
        const today = new Date();
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      }
    } else {
      const filterStartDate = getStartDateFromFilter(filter);
      startDate = new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate());

      const today = new Date();
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    return { from: startDate, to: endDate };
  }, [filter, customDateRange]);

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getCurrentSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      if (dateRange.from && dateRange.to) {
        loadData();
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    const loadWhenReady = async () => {
      const { session } = await getCurrentSession();
      if (session && dateRange.from && dateRange.to) {
        loadData();
      }
    };
    loadWhenReady();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange.from, dateRange.to]);

  const loadData = async () => {
    if (!dateRange.from || !dateRange.to) return;

    setLoading(true);
    const [recResult, payResult] = await Promise.all([
      getReceivablesForReports(dateRange),
      getPayablesForReports(dateRange),
    ]);

    if (recResult.error) {
      console.error('[Reports] Error loading receivables:', recResult.error);
      toast.error("Erro ao carregar entradas");
      setReceivables([]);
    } else if (recResult.data) {
      setReceivables(recResult.data as AccountReceivable[]);
    }

    if (payResult.error) {
      console.error('[Reports] Error loading payables:', payResult.error);
      toast.error("Erro ao carregar saídas");
      setPayables([]);
    } else if (payResult.data) {
      setPayables(payResult.data as AccountPayable[]);
    }

    setLoading(false);
  };

  const kpiData = useMemo(() => {
    const totalReceived = receivables.reduce(
      (sum, r) => sum + Number(r.net_value),
      0
    );
    const totalPaid = payables.reduce((sum, p) => sum + Number(p.value), 0);
    const balance = totalReceived - totalPaid;
    return { totalReceived, totalPaid, balance };
  }, [receivables, payables]);

  const barChartData = useMemo((): BarChartData[] => {
    const formatType = filter === "weekly" || filter === "monthly" ? "dd/MM" : "MMM/yy";
    const locale = ptBR;

    const dataMap: Map<
      string,
      { name: string; Entradas: number; Saídas: number; date: Date }
    > = new Map();

    receivables.forEach((r) => {
      if (!r.entry_date) return;
      const entryDate = parseISO(r.entry_date);
      const name = format(entryDate, formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0, date: entryDate };
      entry.Entradas += Number(r.net_value);
      if (entryDate < entry.date) {
        entry.date = entryDate;
      }
      dataMap.set(name, entry);
    });

    payables.forEach((p) => {
      if (!p.payment_date) return;
      const paymentDate = parseISO(p.payment_date);
      const name = format(paymentDate, formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0, date: paymentDate };
      entry.Saídas += Number(p.value);
      if (paymentDate < entry.date) {
        entry.date = paymentDate;
      }
      dataMap.set(name, entry);
    });

    return Array.from(dataMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ date, ...rest }) => rest);
  }, [receivables, payables, filter]);

  const pieChartData = useMemo((): PieChartData[] => {
    return [
      {
        name: "Entradas",
        value: kpiData.totalReceived,
        fill: "hsl(var(--secondary))",
      },
      {
        name: "Saídas",
        value: kpiData.totalPaid,
        fill: "hsl(var(--destructive))",
      },
    ];
  }, [kpiData]);

  const topClients = useMemo((): TopItem[] => {
    const clientMap: Map<string, number> = new Map();
    receivables.forEach((r) => {
      const name = r.client?.name || "Venda Avulsa";
      clientMap.set(name, (clientMap.get(name) || 0) + Number(r.net_value));
    });
    const sorted = Array.from(clientMap.entries()).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    return sorted.slice(0, 5).map(([name, value]) => ({
      name,
      value,
      percentage: (value / max) * 100,
    }));
  }, [receivables]);

  const topSuppliers = useMemo((): TopItem[] => {
    const supplierMap: Map<string, number> = new Map();
    payables.forEach((p) => {
      const name = p.supplier?.name || "Pagamento Avulso";
      supplierMap.set(name, (supplierMap.get(name) || 0) + Number(p.value));
    });
    const sorted = Array.from(supplierMap.entries()).sort((a, b) => b[1] - a[1]);
    const max = sorted[0]?.[1] || 1;
    return sorted.slice(0, 5).map(([name, value]) => ({
      name,
      value,
      percentage: (value / max) * 100,
    }));
  }, [payables]);

  const exportToPDF = () => {
    toast.info("Export PDF será implementado em breve");
  };

  return {
    loading,
    kpiData,
    barChartData,
    pieChartData,
    topClients,
    topSuppliers,
    filter,
    setFilter,
    customDateRange,
    exportToPDF,
    setCustomDateRange
  };
}