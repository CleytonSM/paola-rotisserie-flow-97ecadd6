import { Order, OrderStatus, ORDER_STATUS_LABELS } from "@/services/database/orders";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface WhatsAppReplyParams {
    displayId: number;
    clientName?: string;
    clientPhone?: string;
    orderStatus: OrderStatus;
    isDelivery: boolean;
    scheduledPickup?: string | null;
}

export function cleanPhoneNumber(phone: string): string {
    return phone.replace(/\D/g, '');
}

export function generateClientReplyMessage(params: WhatsAppReplyParams): string {
    const { displayId, clientName, orderStatus, isDelivery, scheduledPickup } = params;
    const name = clientName || "Cliente";
    const pickupTime = scheduledPickup
        ? format(new Date(scheduledPickup), "HH:mm", { locale: ptBR })
        : "";

    if (orderStatus === 'ready' && !isDelivery) {
        return `Seu pedido #${displayId} está pronto! Retire às ${pickupTime}`;
    }

    if (orderStatus === 'ready' && isDelivery) {
        return `Seu pedido #${displayId} está pronto e sai pra entrega em 20min!`;
    }

    if (orderStatus === 'delivered') {
        return `Seu pedido #${displayId} foi entregue! Obrigada e volte sempre!`;
    }

    const statusLabel = ORDER_STATUS_LABELS[orderStatus] || orderStatus;
    return `Olá ${name}! Seu pedido #${displayId} está ${statusLabel.toLowerCase()}. Qualquer dúvida é só chamar!`;
}

export function buildWhatsAppClientReplyUrl(params: WhatsAppReplyParams): string | null {
    const { clientPhone } = params;
    if (!clientPhone) return null;

    const cleanPhone = cleanPhoneNumber(clientPhone);
    const message = generateClientReplyMessage(params);
    const encodedMessage = encodeURIComponent(message);

    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
}

export function getWhatsAppReplyParamsFromOrder(order: Order): WhatsAppReplyParams {
    return {
        displayId: order.display_id,
        clientName: order.clients?.name,
        clientPhone: order.clients?.phone,
        orderStatus: order.order_status,
        isDelivery: order.is_delivery,
        scheduledPickup: order.scheduled_pickup
    };
}
