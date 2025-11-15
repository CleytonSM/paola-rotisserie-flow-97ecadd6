import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
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
import { getAccountsReceivable, getAccountsPayable } from "@/services/database";
import { getCurrentSession } from "@/services/auth";
import { toast } from "sonner";
import { addDays, format, parseISO, startOfToday } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { getStartDateFromFilter } from "@/components/ui/reports/utils";

export default function Reports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [filter, setFilter] = useState<ReportsFilter>("monthly");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>(undefined);

  useEffect(() => {
    const checkAuth = async () => {
      const { session } = await getCurrentSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      loadData();
    };
    checkAuth();
  }, [navigate]);

  const loadData = async () => {
    setLoading(true);
    const [recResult, payResult] = await Promise.all([
      getAccountsReceivable(),
      getAccountsPayable(),
    ]);

    if (recResult.error) {
      toast.error("Erro ao carregar entradas");
    } else if (recResult.data) {
      setReceivables(recResult.data as AccountReceivable[]);
    }

    if (payResult.error) {
      toast.error("Erro ao carregar saídas");
    } else if (payResult.data) {
      setPayables(payResult.data as AccountPayable[]);
    }

    setLoading(false);
  };

  const { filteredReceivables, filteredPayables } = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (filter === "custom" && customDateRange?.from) {
      // Usar o date range customizado
      startDate = customDateRange.from;
      endDate = customDateRange.to ? addDays(customDateRange.to, 1) : addDays(startOfToday(), 1);
    } else {
      // Usar o filtro pré-definido
      startDate = getStartDateFromFilter(filter);
      endDate = addDays(startOfToday(), 1); // Inclui hoje
    }

    const rec = receivables.filter((r) => {
      // Filtrar por entry_date
      if (!r.entry_date) return false;
      const entryDate = parseISO(r.entry_date);
      return entryDate >= startDate && entryDate < endDate;
    });
    const pay = payables.filter((p) => {
      // Filtrar por payment_date
      if (!p.payment_date) return false;
      const paymentDate = parseISO(p.payment_date);
      return paymentDate >= startDate && paymentDate < endDate;
    });
    return { filteredReceivables: rec, filteredPayables: pay };
  }, [receivables, payables, filter, customDateRange]);

  const kpiData = useMemo(() => {
    const totalReceived = filteredReceivables.reduce(
      (sum, r) => sum + Number(r.net_value),
      0
    );
    const totalPaid = filteredPayables.reduce((sum, p) => sum + Number(p.value), 0);
    const balance = totalReceived - totalPaid;
    return { totalReceived, totalPaid, balance };
  }, [filteredReceivables, filteredPayables]);

  const barChartData = useMemo((): BarChartData[] => {
    const formatType = filter === "weekly" || filter === "monthly" ? "dd/MM" : "MMM/yy";
    const locale = ptBR;

    // Map para armazenar dados agrupados por data formatada
    const dataMap: Map<
      string,
      { name: string; Entradas: number; Saídas: number; date: Date }
    > = new Map();

    filteredReceivables.forEach((r) => {
      // Usar entry_date para agrupamento (já garantimos que não é null no filtro)
      if (!r.entry_date) return;
      const entryDate = parseISO(r.entry_date);
      const name = format(entryDate, formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0, date: entryDate };
      entry.Entradas += Number(r.net_value);
      // Manter a data mais antiga para ordenação
      if (entryDate < entry.date) {
        entry.date = entryDate;
      }
      dataMap.set(name, entry);
    });

    filteredPayables.forEach((p) => {
      // Usar payment_date para agrupamento (já garantimos que não é null no filtro)
      if (!p.payment_date) return;
      const paymentDate = parseISO(p.payment_date);
      const name = format(paymentDate, formatType, { locale });
      const entry = dataMap.get(name) || { name, Entradas: 0, Saídas: 0, date: paymentDate };
      entry.Saídas += Number(p.value);
      // Manter a data mais antiga para ordenação
      if (paymentDate < entry.date) {
        entry.date = paymentDate;
      }
      dataMap.set(name, entry);
    });

    // Converter para array e ordenar por data cronologicamente
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ date, ...rest }) => rest); // Remove a propriedade date antes de retornar
  }, [filteredReceivables, filteredPayables, filter]);

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
    filteredReceivables.forEach((r) => {
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
  }, [filteredReceivables]);

  const topSuppliers = useMemo((): TopItem[] => {
    const supplierMap: Map<string, number> = new Map();
    filteredPayables.forEach((p) => {
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
  }, [filteredPayables]);

  const exportToPDF = () => {
    toast.info("Export PDF será implementado em breve");
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="container flex-1 py-8 md:py-12">
        <div className="mb-8 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="font-display text-4xl font-bold tracking-wide text-foreground md:text-5xl">
              Relatórios
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">
              Visão completa do fluxo financeiro.
            </p>
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
          <ReportsBarChart data={barChartData} />
          <ReportsPieChart
            data={pieChartData}
            isEmpty={kpiData.totalReceived === 0 && kpiData.totalPaid === 0}
          />
        </div>

        {/* Listas Top 5 com Animação */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <TopClientsList clients={topClients} />
          <TopSuppliersList suppliers={topSuppliers} />
        </div>
      </main>
    </div>
  );
}
