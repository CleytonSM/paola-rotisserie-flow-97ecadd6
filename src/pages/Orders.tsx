import { useState } from "react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { useOrders } from "@/hooks/useOrders";
import {
    OrderFilters,
    OrderKanban,
    OrderList,
    OrderEmptyState
} from "@/components/features/orders";
import { useIsMobile } from "@/hooks/use-mobile";
import { Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Orders() {
    const isMobile = useIsMobile();
    const [isRefreshing, setIsRefreshing] = useState(false);
    const {
        orders,
        isLoading,
        filters,
        setDateFilter,
        setSearchTerm,
        handleStatusChange,
        pendingCount,
        refetch,
        isUpdating,
    } = useOrders();

    const hasFilters = !!filters.date || !!filters.searchTerm;

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await refetch();
        setTimeout(() => setIsRefreshing(false), 500);
    };

    return (
        <Scaffolding>
            <PageHeader
                title="Pedidos"
                subtitle="Gerencie os pedidos agendados e acompanhe o fluxo de preparação."
                action={
                    <div className="flex items-center gap-3">
                        {pendingCount > 0 && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                                {pendingCount} pendente{pendingCount > 1 ? "s" : ""}
                            </Badge>
                        )}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleRefresh}
                            disabled={isLoading || isRefreshing}
                        >
                            <RefreshCw className={cn(
                                "transition-transform",
                                (isRefreshing || isLoading) && "animate-spin"
                            )} />
                        </Button>
                    </div>
                }
                children={<AppBreadcrumb />}
            />

            <OrderFilters
                dateFilter={filters.date}
                onDateChange={setDateFilter}
                searchTerm={filters.searchTerm || ''}
                onSearchChange={setSearchTerm}
            />

            {isLoading && orders.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : orders.length === 0 ? (
                <OrderEmptyState hasFilters={hasFilters} />
            ) : isMobile ? (
                <OrderList
                    orders={orders}
                    onStatusChange={handleStatusChange}
                    isUpdating={isUpdating}
                />
            ) : (
                <OrderKanban
                    orders={orders}
                    onStatusChange={handleStatusChange}
                    isUpdating={isUpdating}
                />
            )}
        </Scaffolding>
    );
}

