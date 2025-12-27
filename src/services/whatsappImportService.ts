import { searchProductCatalog } from "@/services/database/product-catalog";
import { parseWhatsAppMessage, ParsedWhatsAppMessage, parseBrazilianAddress, ParsedAddress, normalize } from "@/utils/whatsappParser";
import { NewOrderItem } from "@/hooks/useNewOrder";
import { getClientByPhone } from "@/services/database/clients";
import { Client } from "@/components/features/clients/types";
import { getMachines } from "@/services/database/machines";

export interface WhatsAppImportResult {
    items: NewOrderItem[];
    notes: string;
    scheduledPickup?: Date;
    client?: Client;
    clientName?: string;
    paymentMethod?: string;
    address?: ParsedAddress | null;
    paymentDetails?: {
        method: 'pix' | 'cash' | 'card_credit' | 'card_debit';
        machineId?: string;
        cardBrand?: string;
        tax_rate?: number;
    };
}

/**
 * Service to process WhatsApp messages and map them to the application's domain.
 * This encapsulates database interactions and parser calls.
 */
export const analyzeWhatsAppMessage = async (text: string): Promise<WhatsAppImportResult> => {
    // 1. Fetch all active products for the initial fuzzy matching
    const { data: catalogData } = await searchProductCatalog("");
    const products = catalogData || [];

    // 2. Parse the message
    const parsed: ParsedWhatsAppMessage = parseWhatsAppMessage(text, products);

    // 3. Convert parsed items to full NewOrderItem format
    const items: NewOrderItem[] = [];
    
    for (const parsedItem of parsed.items) {
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
    
    // 5. Advanced Payment Matching (Card Machines & Flags)
    let paymentDetails: WhatsAppImportResult['paymentDetails'];
    if (parsed.paymentMethod) {
        const label = normalize(parsed.paymentMethod);
        
        if (label.includes("pix")) {
            paymentDetails = { method: 'pix' };
        } else if (label.includes("dinheiro")) {
            paymentDetails = { method: 'cash' };
        } else {
            // Try to match with machines/flags
            const { data: machines } = await getMachines();
            if (machines) {
                const isCredit = label.includes("credito");
                const isDebit = label.includes("debito");
                
                for (const machine of machines) {
                    const flagMatch = machine.flags?.find(f => 
                        label.includes(normalize(f.brand)) && 
                        f.type === (isCredit ? 'credit' : 'debit')
                    );
                    
                    if (flagMatch) {
                        paymentDetails = {
                            method: isCredit ? 'card_credit' : 'card_debit',
                            machineId: machine.id,
                            cardBrand: flagMatch.brand,
                            tax_rate: flagMatch.tax_rate
                        };
                        break;
                    }
                }
            }
            
            // Fallback if no specific flag matched but it's card
            if (!paymentDetails) {
                if (label.includes("credito")) paymentDetails = { method: 'card_credit' };
                else if (label.includes("debito")) paymentDetails = { method: 'card_debit' };
            }
        }
    }

    return {
        items,
        notes: parsed.notes,
        scheduledPickup: parsed.scheduledTime,
        client: recognizedClient,
        clientName: parsed.clientName,
        paymentMethod: parsed.paymentMethod,
        paymentDetails,
        address: parsed.deliveryAddress ? parseBrazilianAddress(parsed.deliveryAddress) : null
    };
};
