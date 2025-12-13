import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { getCurrentSession } from "@/services/auth";
import { getClientsCount, getOverduePayablesCount, getProfitHistory, getSuppliersCount, getUnpaidPayablesCount, getUpcomingPayablesCount, getWeeklyBalance } from "../services/database";

export const useDashboard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [balance, setBalance] = useState({ balance: 0, totalReceivable: 0, totalPayable: 0 });
    const [unpaidPayablesCount, setUnpaidPayablesCount] = useState(0);
    const [clientsCount, setClientsCount] = useState(0);
    const [suppliersCount, setSuppliersCount] = useState(0);
    const [upcomingPayablesCount, setUpcomingPayablesCount] = useState(0);
    const [profitData, setProfitData] = useState<any[]>([]);
    const [overduePayablesCount, setOverduePayablesCount] = useState(0);
    
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

        const [
        balanceResult,
        unpaidPayablesResult,
        clientsResult,
        suppliersResult,
        upcomingPayablesResult,
        profitResult,
        overduePayablesResult,
        ] = await Promise.all([
        getWeeklyBalance(),
        getUnpaidPayablesCount(),
        getClientsCount(),
        getSuppliersCount(),
        getUpcomingPayablesCount(),
        getProfitHistory(),
        getOverduePayablesCount(),
        ]);

        if (balanceResult.error) {
        toast.error("Erro ao carregar saldo");
        } else if (balanceResult.data) {
        setBalance(balanceResult.data);
        }

        if (unpaidPayablesResult.error) {
        toast.error("Erro ao carregar contas a pagar");
        } else if (unpaidPayablesResult.data !== null) {
        setUnpaidPayablesCount(unpaidPayablesResult.data);
        }

        if (clientsResult.error) {
        toast.error("Erro ao carregar total de clientes");
        } else if (clientsResult.data !== null) {
        setClientsCount(clientsResult.data);
        }

        if (suppliersResult.error) {
        toast.error("Erro ao carregar total de fornecedores");
        } else if (suppliersResult.data !== null) {
        setSuppliersCount(suppliersResult.data);
        }

        if (upcomingPayablesResult.error) {
        toast.error("Erro ao carregar contas a vencer");
        } else if (upcomingPayablesResult.data !== null) {
        setUpcomingPayablesCount(upcomingPayablesResult.data);
        }

        if (profitResult.error) {
        toast.error("Erro ao carregar histórico de lucros");
        } else if (profitResult.data) {
        setProfitData(profitResult.data);
        }

        if (overduePayablesResult.error) {
        toast.error("Erro ao carregar contas vencidas");
        } else if (overduePayablesResult.data !== null) {
        setOverduePayablesCount(overduePayablesResult.data);
        }

        setLoading(false);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
        }).format(value);
    };

    const formatMonthYear = (monthStr: string) => {
        if (!monthStr) return "";
        const [year, month] = monthStr.split("-");
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
    };

    return {
        loading,
        balance,
        unpaidPayablesCount,
        clientsCount,
        suppliersCount,
        upcomingPayablesCount,
        profitData,
        overduePayablesCount,
        formatCurrency,
        formatMonthYear,
        navigate,
    }
}
