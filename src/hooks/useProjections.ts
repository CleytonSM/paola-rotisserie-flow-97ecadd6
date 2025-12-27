import { useState, useEffect } from "react";
import { reportsService } from "@/services/reports";
import { 
  ProjectionKPIs, 
  DailyProjection, 
  DetailedProjectionRow 
} from "@/components/features/reports/types";
import { toast } from "sonner";

export function useProjections() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState<7 | 15 | 30>(15);
  const [data, setData] = useState<{
    kpis: ProjectionKPIs;
    chartData: DailyProjection[];
    payablesTable: DetailedProjectionRow[];
    receivablesTable: DetailedProjectionRow[];
  } | null>(null);

  const fetchProjections = async () => {
    setLoading(true);
    try {
      const result = await reportsService.getProjections(days);
      setData(result);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao carregar projeções");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjections();
  }, [days]);

  return {
    loading,
    days,
    setDays,
    data,
    refresh: fetchProjections
  };
}
