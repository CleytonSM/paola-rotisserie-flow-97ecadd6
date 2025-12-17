import { useState } from "react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
    getOrders, 
    updateOrderStatus,
    Order,
    OrderStatus,
    OrderFilters 
} from "@/services/database";

export function useOrders() {
    const queryClient = useQueryClient();
    const [filters, setFilters] = useState<OrderFilters>({
        date: undefined,
        searchTerm: ''
    });

    const { data: orders = [], isLoading, refetch, isFetching } = useQuery({
        queryKey: ['orders', filters],
        queryFn: async () => {
            const { data, error } = await getOrders(filters);
            if (error) throw error;
            return data || [];
        },
        placeholderData: keepPreviousData,
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ saleId, status }: { saleId: string; status: OrderStatus }) => {
            const { error } = await updateOrderStatus(saleId, status);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingOrders'] });
            toast.success("Status atualizado com sucesso!");
        },
        onError: () => {
            toast.error("Erro ao atualizar status");
        },
    });

    const handleStatusChange = (saleId: string, newStatus: OrderStatus) => {
        updateStatusMutation.mutate({ saleId, status: newStatus });
    };

    const setDateFilter = (date: Date | undefined) => {
        setFilters(prev => ({ ...prev, date }));
    };

    const setSearchTerm = (searchTerm: string) => {
        setFilters(prev => ({ ...prev, searchTerm }));
    };

    const getOrdersByStatus = (status: OrderStatus): Order[] => {
        return orders.filter(order => order.order_status === status);
    };

    const pendingCount = orders.filter(
        o => o.order_status !== 'delivered' && o.order_status !== 'cancelled'
    ).length;

    return {
        orders,
        isLoading: isLoading && !orders.length,
        isFetching,
        filters,
        setDateFilter,
        setSearchTerm,
        handleStatusChange,
        getOrdersByStatus,
        pendingCount,
        refetch,
        isUpdating: updateStatusMutation.isPending,
    };
}

