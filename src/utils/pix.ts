
function crc16(payload: string): string {
    let crc = 0xFFFF;
    const polynomial = 0x1021;

    for (let i = 0; i < payload.length; i++) {
        crc ^= payload.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            if ((crc & 0x8000) !== 0) {
                crc = (crc << 1) ^ polynomial;
            } else {
                crc = crc << 1;
            }
        }
    }

    return (crc & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
}

interface PixPayloadParams {
    pixKey: string;
    merchantName?: string;
    merchantCity?: string;
    amount?: number;
    txid?: string;
}

export function generatePixCode({
    pixKey,
    merchantName = "ROTI PAOLA", // Default merchant name if not provided
    merchantCity = "SAO PAULO", // Default city
    amount,
    txid = "***" // Default txid
}: PixPayloadParams): string {
    const formatField = (id: string, value: string): string => {
        const len = value.length.toString().padStart(2, '0');
        return `${id}${len}${value}`;
    };

    const payload: string[] = [];

    // 00 - Payload Format Indicator
    payload.push(formatField("00", "01"));

    // 26 - Merchant Account Information
    // GUI (00) - br.gov.bcb.pix
    // Key (01) - The Pix Key itself
    const gui = formatField("00", "br.gov.bcb.pix");
    const key = formatField("01", pixKey);
    payload.push(formatField("26", gui + key));

    // 52 - Merchant Category Code
    payload.push(formatField("52", "0000"));

    // 53 - Transaction Currency (986 = BRL)
    payload.push(formatField("53", "986"));

    // 54 - Transaction Amount (Optional in standard, but usually required for static with price)
    if (amount !== undefined && amount > 0) {
        const amountStr = amount.toFixed(2);
        payload.push(formatField("54", amountStr));
    }

    // 58 - Country Code
    payload.push(formatField("58", "BR"));

    // 59 - Merchant Name
    // Truncate to 25 chars max as per standard recommendations usually, but we'll just use what's given/default.
    // Clean special chars might be good idea but let's keep simple.
    payload.push(formatField("59", merchantName.substring(0, 25)));

    // 60 - Merchant City
    payload.push(formatField("60", merchantCity.substring(0, 15)));

    // 62 - Additional Data Field Template
    // 05 - Reference Label (TXID)
    const txidField = formatField("05", txid);
    payload.push(formatField("62", txidField));

    // 63 - CRC16
    // We append "6304" then calculate CRC
    const payloadStr = payload.join("") + "6304";
    const crc = crc16(payloadStr);

    return payloadStr + crc;
}
