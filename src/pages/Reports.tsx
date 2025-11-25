import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ReportsFilters } from "@/components/ui/reports/ReportsFilters";
import { ReportsKPIs } from "@/components/ui/reports/ReportsKPIs";
import { ReportsBarChart } from "@/components/ui/reports/ReportsBarChart";
import { ReportsPieChart } from "@/components/ui/reports/ReportsPieChart";
import { TopClientsList } from "@/components/ui/reports/TopClientsList";
import { TopSuppliersList } from "@/components/ui/reports/TopSuppliersList";
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
import { AppBreadcrumb } from "@/components/AppBreadcrumb";

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [filter, setFilter] = useState<ReportsFilter>("monthly");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  // Compute date range based on filter and customDateRange
  const dateRange = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (filter === "custom" && customDateRange?.from) {
      // Use custom date range - create new date objects to avoid mutations
      startDate = new Date(customDateRange.from.getFullYear(), customDateRange.from.getMonth(), customDateRange.from.getDate());
      if (customDateRange.to) {
        endDate = new Date(customDateRange.to.getFullYear(), customDateRange.to.getMonth(), customDateRange.to.getDate());
      } else {
        const today = new Date();
        endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      }
    } else {
      // Use pre-defined filter - get the date from filter and reconstruct it in local timezone
      const filterStartDate = getStartDateFromFilter(filter);
      startDate = new Date(filterStartDate.getFullYear(), filterStartDate.getMonth(), filterStartDate.getDate());

      const today = new Date();
      endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    }

    console.log('[Reports] Date range calculated:', {
      filter,
      startDate: startDate.toLocaleDateString('pt-BR'),
      endDate: endDate.toLocaleDateString('pt-BR'),
      startDateISO: startDate.toISOString(),
      endDateISO: endDate.toISOString(),
      startDateComponents: { year: startDate.getFullYear(), month: startDate.getMonth() + 1, day: startDate.getDate() },
      endDateComponents: { year: endDate.getFullYear(), month: endDate.getMonth() + 1, day: endDate.getDate() },
    });

    return { from: startDate, to: endDate };
  }, [filter, customDateRange]);

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getCurrentSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      // Only load data if dateRange is ready
      if (dateRange.from && dateRange.to) {
        loadData();
      }
    };
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    // Reload data when filter or customDateRange changes (only if authenticated)
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

    console.log('[Reports] loadData called with dateRange:', {
      from: dateRange.from.toLocaleDateString('pt-BR'),
      to: dateRange.to.toLocaleDateString('pt-BR'),
      fromISO: dateRange.from.toISOString(),
      toISO: dateRange.to.toISOString(),
    });

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
      console.log('[Reports] Receivables loaded:', recResult.data.length, 'records');
      console.log('[Reports] Sample receivables:', recResult.data.slice(0, 3).map((r: AccountReceivable) => ({
        id: r.id,
        entry_date: r.entry_date,
        net_value: r.net_value,
      })));
      setReceivables(recResult.data as AccountReceivable[]);
    }

    if (payResult.error) {
      console.error('[Reports] Error loading payables:', payResult.error);
      toast.error("Erro ao carregar saídas");
      setPayables([]);
    } else if (payResult.data) {
      console.log('[Reports] Payables loaded:', payResult.data.length, 'records');
      console.log('[Reports] Sample payables:', payResult.data.slice(0, 3).map((p: AccountPayable) => ({
        id: p.id,
        payment_date: p.payment_date,
        value: p.value,
      })));
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

    // Map to store data grouped by formatted date
    const dataMap: Map<
      string,
      { name: string; Entradas: number; Saídas: number; date: Date }
    > = new Map();

    receivables.forEach((r) => {
      // Use entry_date for grouping (already filtered by database)
      if (!r.entry_date) return;
      const entryDate = parseISO(r.entry_date);
      const name = format(entryDate, formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0, date: entryDate };
      entry.Entradas += Number(r.net_value);
      // Keep earliest date for sorting
      if (entryDate < entry.date) {
        entry.date = entryDate;
      }
      dataMap.set(name, entry);
    });

    payables.forEach((p) => {
      // Use payment_date for grouping (already filtered by database)
      if (!p.payment_date) return;
      const paymentDate = parseISO(p.payment_date);
      const name = format(paymentDate, formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0, date: paymentDate };
      entry.Saídas += Number(p.value);
      // Keep earliest date for sorting
      if (paymentDate < entry.date) {
        entry.date = paymentDate;
      }
      dataMap.set(name, entry);
    });

    // Convert to array and sort chronologically
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ date, ...rest }) => rest); // Remove date property before returning
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

  return (
    <div className="flex min-h-screen flex-col">

      <main className="container flex-1 py-8 md:py-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
              Relatórios
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Visão completa do fluxo financeiro.
            </p>
            <AppBreadcrumb />
          </div>
          <ReportsFilters
            filter={filter}
            onFilterChange={setFilter}
            customDateRange={customDateRange}
            onCustomDateRangeChange={setCustomDateRange}
            onExport={exportToPDF}
          />
        </div>

        {/* KPIs */}
        <ReportsKPIs kpiData={kpiData} />

        {/* Gráficos Principais */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
          <ReportsBarChart data={barChartData} loading={loading} />
          <ReportsPieChart
            data={pieChartData}
            isEmpty={kpiData.totalReceived === 0 && kpiData.totalPaid === 0}
            loading={loading}
          />
        </div>

        {/* Listas Top 5 com Animação */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopClientsList clients={topClients} loading={loading} />
          <TopSuppliersList suppliers={topSuppliers} loading={loading} />
        </div>
      </main>
    </div>
  );
}