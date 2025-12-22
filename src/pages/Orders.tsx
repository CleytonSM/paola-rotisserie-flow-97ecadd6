import { useState } from "react";
import { AppBreadcrumb } from "@/components/layout/AppBreadcrumb";
import { PageHeader } from "@/components/ui/common/PageHeader";
import { Scaffolding } from "@/components/ui/Scaffolding";
import { useOrders } from "@/hooks/useOrders";
import { useNewOrder } from "@/hooks/useNewOrder";
import {
    OrderFilters,
    OrderKanban,
    DeliveryFilterType,
    NewOrderButton,
    NewOrderModal,
    WhatsAppImportModal
} from "@/components/features/orders";
import { Loader2, RefreshCw, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function Orders() {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
    const [deliveryFilter, setDeliveryFilter] = useState<DeliveryFilterType>('all');
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

    const newOrderState = useNewOrder(() => {
        refetch();
    });

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
                        <Button
                            onClick={() => setIsWhatsAppModalOpen(true)}
                            className="h-10 px-4 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all duration-300 hover:shadow-lg hover:scale-105 font-bold"
                        >
                            <MessageSquare className="h-5 w-5 mr-2" />
                            <span className="hidden sm:inline">Importar WhatsApp</span>
                        </Button>

                        <NewOrderButton onClick={newOrderState.open} />

                        {pendingCount > 0 && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">
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
                dateFilter={filters.date || filters.dateRange}
                onDateChange={setDateFilter}
                searchTerm={filters.searchTerm || ''}
                onSearchChange={setSearchTerm}
                deliveryFilter={deliveryFilter}
                onDeliveryFilterChange={setDeliveryFilter}
            />

            {isLoading && orders.length === 0 ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            ) : (
                <OrderKanban
                    orders={orders}
                    onStatusChange={handleStatusChange}
                    isUpdating={isUpdating}
                    filterType={deliveryFilter}
                />
            )}

            <NewOrderModal
                open={newOrderState.isOpen}
                onOpenChange={(open) => !open && newOrderState.close()}
                orderState={newOrderState}
            />

            <WhatsAppImportModal
                open={isWhatsAppModalOpen}
                onOpenChange={setIsWhatsAppModalOpen}
                onImport={(data) => {
                    newOrderState.prefill(data);
                }}
            />
        </Scaffolding>
    );
}
