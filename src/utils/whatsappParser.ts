/**
 * WhatsApp Message Parser Utilities
 * 
 * Pure functions for parsing WhatsApp messages to extract:
 * - Client names
 * - Order items with quantities
 * - Scheduled pickup times
 * - Unrecognized lines (notes)
 */

export interface ParsedProduct {
    id: string;
    name: string;
    base_price: number;
}

export interface ParsedOrderItem {
    id: string;
    product: ParsedProduct;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface ParsedWhatsAppMessage {
    items: ParsedOrderItem[];
    scheduledTime: Date | undefined;
    clientName: string | undefined;
    clientPhone: string | undefined;
    notes: string;
}

/**
 * Levenshtein distance between two strings.
 * Used for fuzzy matching product names.
 */
export function levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

/**
 * Normalize text for comparison:
 * - Lowercase
 * - Remove accents
 * - Handle common Portuguese plurals
 */
export function normalize(text: string): string {
    let t = text.toLowerCase().trim();
    t = t.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // Common Portuguese plurals
    if (t.endsWith("oes")) t = t.slice(0, -3) + "ao";
    else if (t.endsWith("aes")) t = t.slice(0, -3) + "ao";
    else if (t.endsWith("is") && t.length > 3) t = t.slice(0, -2) + "l";
    else if (t.endsWith("es") && t.length > 3) t = t.slice(0, -2);
    else if (t.endsWith("s") && t.length > 2) t = t.slice(0,-1);

    return t;
}

/**
 * Word-to-number mapping for Portuguese quantity words.
 */
export const wordToNumber: Record<string, number> = {
    meia: 0.5,
    metade: 0.5,
    meio: 0.5,
    um: 1,
    uma: 1,
    dois: 2,
    duas: 2,
    tres: 3,
    três: 3,
    quatro: 4,
    cinco: 5,
    seis: 6,
    sete: 7,
    oito: 8,
    nove: 9,
    dez: 10,
};

/**
 * Find the best matching product using fuzzy matching.
 */
export function findBestMatch<T extends { name: string }>(
    query: string,
    products: T[],
    maxDistance = 2
): T | null {
    const normalizedQuery = normalize(query);
    let bestMatch: T | null = null;
    let bestScore = Infinity;

    for (const product of products) {
        const normalizedName = normalize(product.name);

        // Exact match after normalization
        if (normalizedName === normalizedQuery || normalizedName.includes(normalizedQuery)) {
            return product;
        }

        // Check if query matches product name words
        if (normalizedQuery.includes(normalizedName)) {
            return product;
        }

        // Fuzzy match
        const distance = levenshtein(normalizedQuery, normalizedName);
        const threshold = Math.min(maxDistance, Math.floor(normalizedQuery.length * 0.3));

        if (distance <= threshold && distance < bestScore) {
            bestScore = distance;
            bestMatch = product;
        }

        // Check each word in product name
        const words = normalizedName.split(' ');
        for (const word of words) {
            if (word.length < 3) continue;
            const wordDist = levenshtein(normalizedQuery, word);
            if (wordDist <= threshold && wordDist < bestScore) {
                bestScore = wordDist;
                bestMatch = product;
            }
        }
    }

    return bestMatch;
}

/**
 * Patterns for detecting client names in messages.
 */
const clientPatterns = [
    /(?:sou\s+(?:a|o)\s+)([a-záéíóúãõâêîôûç]+)/i,
    /(?:aqui\s+(?:é|e)\s+(?:a|o)?\s*)([a-záéíóúãõâêîôûç]+)/i,
    /(?:meu\s+nome\s+(?:é|e)\s*)([a-záéíóúãõâêîôûç]+)/i,
    /(?:oi|olá|ola),?\s+(?:sou\s+)?(?:a|o)?\s*([a-záéíóúãõâêîôûç]+)/i,
];

/**
 * Extract client name from a line of text.
 */
export function parseClientName(line: string): string | null {
    const lineLower = line.toLowerCase();
    const excludedWords = ["quero", "gostaria", "preciso", "oi", "ola", "bom", "boa", "queria"];

    for (const pattern of clientPatterns) {
        const match = lineLower.match(pattern);
        if (match && match[1]) {
            const name = match[1].trim();
            if (name.length >= 2 && !excludedWords.includes(name)) {
                return name.charAt(0).toUpperCase() + name.slice(1);
            }
        }
    }
    return null;
}

/**
 * Patterns for detecting time in messages.
 */
const timePhrases = [
    /(\d{1,2})[h:]\s?(\d{0,2})\b/i,
    /(\d{1,2})(?::(\d{2}))?\s*(hs?|horas?)/i,
    /(?:às|as)\s*(\d{1,2})[h:]?\s?(\d{0,2})/i,
];

/**
 * Extract scheduled time from a line of text.
 * Returns a Date object with today's date and the extracted time.
 */
export function parseScheduledTime(line: string): Date | null {
    const lineLower = line.toLowerCase();

    for (const regex of timePhrases) {
        const match = lineLower.match(regex);
        if (match) {
            const hours = parseInt(match[1]);
            const minutes = match[2] ? parseInt(match[2]) : 0;
            if (hours < 24 && minutes < 60) {
                const d = new Date();
                d.setHours(hours, minutes, 0, 0);
                return d;
            }
        }
    }
    return null;
}

/**
 * Regex pattern for detecting items with quantities.
 * Matches patterns like "2 frangos", "1kg salada", "3x frango"
 */
const itemRegex = /(\d+(?:[.,]\d+)?)\s*(x|kg|g|un|unidades|unidade)?\s*(.+)/i;

/**
 * Word-based item regex for "dois frangos", "meia galinha", etc.
 */
const wordItemRegex = /^(meia|metade|meio|um|uma|dois|duas|tres|três|quatro|cinco|seis|sete|oito|nove|dez)\s+(.+)/i;

/**
 * Parse a single line to extract an item with quantity.
 * Returns null if no item pattern is matched.
 */
export function parseItemLine<T extends { id: string; name: string; base_price: number }>(
    line: string,
    products: T[]
): ParsedOrderItem | null {
    const lineLower = line.toLowerCase().trim();
    if (!lineLower) return null;

    let quantity: number = 1;
    let productName: string = "";

    // Try word-based pattern first ("dois frangos", "meia galinha")
    const wordMatch = lineLower.match(wordItemRegex);
    if (wordMatch) {
        const qtyWord = wordMatch[1].toLowerCase();
        quantity = wordToNumber[qtyWord] || 1;
        productName = wordMatch[2].trim();
    } else {
        // Try numeric pattern ("2 frangos", "1.5 kg salada")
        const numericMatch = lineLower.match(itemRegex);
        if (numericMatch) {
            const qtyStr = numericMatch[1].replace(',', '.');
            quantity = parseFloat(qtyStr);
            if (isNaN(quantity)) quantity = 1;
            productName = numericMatch[3].trim();
        } else {
            // No quantity detected, treat whole line as product name
            productName = lineLower;
        }
    }

    if (!productName) return null;

    // Find best matching product
    const product = findBestMatch(productName, products);
    if (!product) return null;

    return {
        id: crypto.randomUUID(),
        product: {
            id: product.id,
            name: product.name,
            base_price: product.base_price,
        },
        quantity,
        unitPrice: product.base_price,
        totalPrice: product.base_price * quantity,
    };
}

/**
 * Detect if a message is from the structured catalog format.
 */
export function isStructuredMessage(text: string): boolean {
    return text.includes("Novo pedido online") && text.includes("*Itens:*");
}

/**
 * Parse a structured message from the virtual catalog.
 */
export function parseStructuredWhatsAppMessage<T extends { id: string; name: string; base_price: number }>(
    text: string,
    products: T[]
): ParsedWhatsAppMessage {
    const lines = text.split('\n');
    const items: ParsedOrderItem[] = [];
    let notesLines: string[] = [];
    let scheduledTime: Date | undefined;
    let clientName: string | undefined;
    let clientPhone: string | undefined;
    let isParsingItems = false;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Extract client name
        if (line.includes("*Cliente:*")) {
            clientName = line.replace("*Cliente:*", "").trim();
            continue;
        }

        // Extract client phone
        if (line.includes("*Telefone:*")) {
            clientPhone = line.replace("*Telefone:*", "").trim();
            continue;
        }

        // Extract date and time
        if (line.includes("*Data:*")) {
            const timeMatch = line.match(/(\d{2}\/\d{2}\/\d{4}).*às\s*(\d{2}:\d{2})/);
            if (timeMatch) {
                const [_, datePart, timePart] = timeMatch;
                const [day, month, year] = datePart.split('/').map(Number);
                const [hours, minutes] = timePart.split(':').map(Number);
                const d = new Date(year, month - 1, day, hours, minutes);
                scheduledTime = d;
            }
            continue;
        }

        // Detect items section
        if (line.includes("*Itens:*")) {
            isParsingItems = true;
            continue;
        }

        // Stop parsing items at Total or Observation
        if (line.includes("*Total:*") || line.includes("*Observações:*")) {
            isParsingItems = false;
        }

        if (isParsingItems) {
            const item = parseItemLine(line, products);
            if (item) {
                items.push(item);
            } else {
                notesLines.push(rawLine);
            }
            continue;
        }

        // Extract observations
        if (line.includes("*Observações:*")) {
            const obs = line.replace("*Observações:*", "").trim();
            if (obs) notesLines.push(obs);
            continue;
        }

        // Ignore metadata lines
        if (
            line.includes("Novo pedido online") || 
            line.includes("*Paola Gonçalves Rotisseria*") ||
            line.includes("*Telefone:*") ||
            line.includes("*Modalidade:*") ||
            line.includes("*Endereço:*") ||
            line.includes("*Pagamento:*") ||
            line.includes("*Total:*") ||
            line.includes("Pedido enviado via Catálogo Virtual")
        ) {
            continue;
        }

        notesLines.push(rawLine);
    }

    return {
        items,
        scheduledTime,
        clientName,
        clientPhone,
        notes: notesLines.join('\n').trim(),
    };
}

/**
 * Parse a complete WhatsApp message.
 * Extracts client name, items, scheduled time, and unrecognized lines as notes.
 */
export function parseWhatsAppMessage<T extends { id: string; name: string; base_price: number }>(
    text: string,
    products: T[]
): ParsedWhatsAppMessage {
    // If it's a structured message, use the specific parser
    if (isStructuredMessage(text)) {
        return parseStructuredWhatsAppMessage(text, products);
    }

    const lines = text.split('\n');
    const items: ParsedOrderItem[] = [];
    let notesLines: string[] = [];
    let scheduledTime: Date | undefined;
    let clientName: string | undefined;
    let clientPhone: string | undefined;

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        let processed = false;

        // 1. Try to extract client name
        if (!clientName) {
            const name = parseClientName(line);
            if (name) {
                clientName = name;
                processed = true;
            }
        }

        // 2. Try to extract scheduled time
        if (!scheduledTime) {
            const time = parseScheduledTime(line);
            if (time) {
                scheduledTime = time;
                processed = true;
            }
        }

        // 3. Try to parse as an item (only if not already processed as client/time)
        if (!processed) {
            const item = parseItemLine(line, products);
            if (item) {
                items.push(item);
                processed = true;
            }
        }

        // 4. If nothing matched, add to notes
        if (!processed) {
            notesLines.push(rawLine);
        }
    }

    return {
        items,
        scheduledTime,
        clientName,
        clientPhone,
        notes: notesLines.join('\n').trim(),
    };
}
