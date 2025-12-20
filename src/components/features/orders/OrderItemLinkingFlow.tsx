import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ProductCatalog } from "@/services/database/product-catalog";
import { getProductItems } from "@/services/database/product-items";
import { ProductItemSelectionDialog } from "@/components/features/pdv/ProductItemSelectionDialog";
import { QuickScanCreateDialog } from "@/components/features/product-items/QuickScanCreateDialog";
import { linkProductItemToSaleItem, checkAndSetOrderReady, OrderStatus } from "@/services/database/orders";
import { toast } from "sonner";

interface OrderItemLinkingFlowProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: ProductCatalog;
    saleItemId: string;
    orderId: string;
    onStatusChange?: (orderId: string, status: OrderStatus) => void;
}

export function OrderItemLinkingFlow({
    open,
    onOpenChange,
    product,
    saleItemId,
    orderId,
    onStatusChange
}: OrderItemLinkingFlowProps) {
    const [isSelectionOpen, setIsSelectionOpen] = useState(false);
    const [isScanOpen, setIsScanOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (open) {
            checkStockAndOpen();
        } else {
            setIsSelectionOpen(false);
            setIsScanOpen(false);
        }
    }, [open]);

    const checkStockAndOpen = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await getProductItems({
                catalog_id: product.id,
                status: 'available'
            });

            if (error) throw error;

            if (data && data.length > 0) {
                setIsSelectionOpen(true);
            } else {
                setIsScanOpen(true);
            }
        } catch (error) {
            toast.error("Erro ao verificar estoque.");
            onOpenChange(false);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLink = async (productItemId: string) => {
        toast.loading("Vinculando item...");
        try {
            const { error: linkError } = await linkProductItemToSaleItem(saleItemId, productItemId);

            if (linkError) throw linkError;

            const { data: ready, error: checkError } = await checkAndSetOrderReady(orderId);

            // Invalidate queries to refresh the UI (order details, lists, etc)
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['upcomingOrders'] });

            if (checkError) {
                toast.error("Item vinculado, mas erro ao atualizar status do pedido.");
            } else if (ready) {
                toast.success("Item vinculado! Pedido marcado como PRONTO.");
                if (onStatusChange) onStatusChange(orderId, 'ready');
            } else {
                toast.success("Item vinculado com sucesso!");
            }
        } catch (error) {
            toast.error("Erro ao vincular item.");
        } finally {
            toast.dismiss();
            onOpenChange(false);
        }
    };

    if (isLoading && !isSelectionOpen && !isScanOpen) {
        return null; // Or a loader if we want, but it's usually fast
    }

    return (
        <>
            <ProductItemSelectionDialog
                open={isSelectionOpen}
                onOpenChange={(open) => {
                    setIsSelectionOpen(open);
                    if (!open && !isScanOpen) onOpenChange(false);
                }}
                product={product}
                onSelect={(item) => handleLink(item.id)}
                onScanRequest={() => {
                    setIsSelectionOpen(false);
                    // Add a tiny delay to ensure dialogs don't clash
                    setTimeout(() => setIsScanOpen(true), 100);
                }}
            />

            <QuickScanCreateDialog
                open={isScanOpen}
                onOpenChange={(open) => {
                    setIsScanOpen(open);
                    if (!open && !isSelectionOpen) onOpenChange(false);
                }}
                product={product}
                onSuccess={(item) => handleLink(item.id)}
            />
        </>
    );
}
