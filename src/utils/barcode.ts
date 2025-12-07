export interface ParsedBarcode {
    type: 'scale' | 'ean';
    productId: string; // The prefix/id part
    value?: number; // Price or Weight
    rawValue: string;
}

export function parseBarcode(barcode: string): ParsedBarcode {
    // Basic validation
    if (!barcode || barcode.length < 13) {
        return { type: 'ean', productId: barcode, rawValue: barcode };
    }

    // Check for Scale Barcode (Starts with 2)
    // Format assumption based on user input: 2AAAAAA BBBBB C
    // 2 (Prefix)
    // AAAAAA (Product ID - 6 digits? Or 2AAAAAA as 7 digits?)
    // User said: "2000220" is the code. "2000220025546" is the scan.
    // 2000220 (7 chars) -> First 7 chars matches the catalog_barcode
    // 02554 (5 chars) -> Value (Price presumably, e.g. 25.54)
    // 6 (1 char) -> Checksum
    
    if (barcode.startsWith('2')) {
        const productId = barcode.substring(0, 7); // First 7 digits
        const valuePart = barcode.substring(7, 12); // Next 5 digits
        
        // Parse value. Usually it's price. Format 02554 -> 25.54
        const value = parseInt(valuePart, 10) / 100;

        return {
            type: 'scale',
            productId,
            value,
            rawValue: barcode
        };
    }

    // Default EAN
    return {
        type: 'ean',
        productId: barcode,
        rawValue: barcode
    };
}
