import { searchProductCatalog } from "@/services/database/product-catalog";
import { parseWhatsAppMessage, ParsedWhatsAppMessage } from "@/utils/whatsappParser";
import { NewOrderItem } from "@/hooks/useNewOrder";
import { getClientByPhone } from "@/services/database/clients";
import { Client } from "@/components/features/clients/types";

export interface WhatsAppImportResult {
    items: NewOrderItem[];
    notes: string;
    scheduledPickup?: Date;
    client?: Client;
    clientName?: string;
}

/**
 * Service to process WhatsApp messages and map them to the application's domain.
 * This encapsulates database interactions and parser calls.
 */
export const analyzeWhatsAppMessage = async (text: string): Promise<WhatsAppImportResult> => {
    // 1. Fetch all active products for the initial fuzzy matching
    // Using a broad search to get baseline catalog data
    const { data: catalogData } = await searchProductCatalog("");
    const products = catalogData || [];

    // 2. Parse the message using our multi-format utility
    const parsed: ParsedWhatsAppMessage = parseWhatsAppMessage(text, products);

    // 3. Convert parsed items to full NewOrderItem format
    // We fetch full product objects to ensure all metadata (unit_type, image_url, etc.) is present
    const items: NewOrderItem[] = [];
    
    for (const parsedItem of parsed.items) {
        // Find the full product from our initial list
        const fullProduct = products.find(p => p.id === parsedItem.product.id);

        if (fullProduct) {
            items.push({
                id: parsedItem.id,
                product: fullProduct,
                quantity: parsedItem.quantity,
                unitPrice: parsedItem.unitPrice,
                totalPrice: parsedItem.totalPrice
            });
        }
    }

    // 4. Try to find the client by phone if available
    let recognizedClient: Client | undefined;
    if (parsed.clientPhone) {
        const { data: clientData } = await getClientByPhone(parsed.clientPhone);
        if (clientData) {
            recognizedClient = clientData;
        }
    }

    return {
        items,
        notes: parsed.notes,
        scheduledPickup: parsed.scheduledTime,
        client: recognizedClient,
        clientName: parsed.clientName
    };
};
