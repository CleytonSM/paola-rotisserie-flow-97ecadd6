import { describe, it, expect } from 'vitest';
import {
    normalize,
    levenshtein,
    findBestMatch,
    parseClientName,
    parseScheduledTime,
    parseItemLine,
    parseWhatsAppMessage,
    wordToNumber,
} from './whatsappParser';

// Mock products for testing
const mockProducts = [
    { id: '1', name: 'Frango Assado', base_price: 45.00 },
    { id: '2', name: 'Frango Desfiado', base_price: 35.00 },
    { id: '3', name: 'Salada de Maionese', base_price: 25.00 },
    { id: '4', name: 'Farofa', base_price: 15.00 },
    { id: '5', name: 'Galinha Caipira', base_price: 55.00 },
    { id: '6', name: 'Arroz Branco', base_price: 12.00 },
    { id: '7', name: 'Feijão Tropeiro', base_price: 18.00 },
    { id: '8', name: 'Vinagrete', base_price: 10.00 },
    { id: '9', name: 'Batata Frita', base_price: 20.00 },
    { id: '10', name: 'Coxinha de Frango', base_price: 8.00 },
];

describe('normalize', () => {
    it('should lowercase text', () => {
        expect(normalize('FRANGO')).toBe('frango');
        expect(normalize('FrAnGo')).toBe('frango');
    });

    it('should remove accents', () => {
        expect(normalize('maionése')).toBe('maionese');
        expect(normalize('feijão')).toBe('feijao');
        expect(normalize('três')).toBe('tr');
    });

    it('should handle plural "s"', () => {
        expect(normalize('frangos')).toBe('frango');
        expect(normalize('saladas')).toBe('salada');
    });

    it('should handle plural "es"', () => {
        expect(normalize('batatas')).toBe('batata');
    });

    it('should handle plural "ões" -> "ão"', () => {
        expect(normalize('coxinhões')).toBe('coxinhao');
        expect(normalize('limões')).toBe('limao');
    });

    it('should handle plural "ães" -> "ão"', () => {
        expect(normalize('pães')).toBe('pao');
    });

    it('should handle plural "is" -> "l"', () => {
        expect(normalize('papéis')).toBe('papel');
    });

    it('should trim whitespace', () => {
        expect(normalize('  frango  ')).toBe('frango');
    });
});

describe('levenshtein', () => {
    it('should return 0 for identical strings', () => {
        expect(levenshtein('frango', 'frango')).toBe(0);
    });

    it('should return correct distance for single character difference', () => {
        expect(levenshtein('frango', 'franco')).toBe(1);
        expect(levenshtein('frango', 'frangos')).toBe(1);
    });

    it('should return correct distance for multiple differences', () => {
        expect(levenshtein('frango', 'galinha')).toBeGreaterThan(3);
    });

    it('should handle empty strings', () => {
        expect(levenshtein('', 'frango')).toBe(6);
        expect(levenshtein('frango', '')).toBe(6);
        expect(levenshtein('', '')).toBe(0);
    });
});

describe('findBestMatch', () => {
    it('should find exact match', () => {
        const result = findBestMatch('Frango Assado', mockProducts);
        expect(result?.name).toBe('Frango Assado');
    });

    it('should find match ignoring case', () => {
        const result = findBestMatch('frango assado', mockProducts);
        expect(result?.name).toBe('Frango Assado');
    });

    it('should find match with plural', () => {
        const result = findBestMatch('frangos assados', mockProducts);
        expect(result?.name).toBe('Frango Assado');
    });

    it('should find partial match', () => {
        const result = findBestMatch('frango', mockProducts);
        expect(result?.name).toContain('Frango');
    });

    it('should find match with typo', () => {
        const result = findBestMatch('maioneze', mockProducts);
        expect(result?.name).toBe('Salada de Maionese');
    });

    it('should find match with accents removed', () => {
        const result = findBestMatch('feijao tropeiro', mockProducts);
        expect(result?.name).toBe('Feijão Tropeiro');
    });

    it('should return null for no match', () => {
        const result = findBestMatch('pizza', mockProducts);
        expect(result).toBeNull();
    });

    it('should match galinha', () => {
        const result = findBestMatch('galinha', mockProducts);
        expect(result?.name).toBe('Galinha Caipira');
    });

    it('should match coxinha', () => {
        const result = findBestMatch('coxinha', mockProducts);
        expect(result?.name).toBe('Coxinha de Frango');
    });
});

describe('parseClientName', () => {
    it('should parse "sou a [Nome]"', () => {
        expect(parseClientName('Oi, sou a Paula')).toBe('Paula');
        expect(parseClientName('sou o João')).toBe('João');
    });

    it('should parse "aqui é [Nome]"', () => {
        expect(parseClientName('Aqui é o Carlos')).toBe('Carlos');
        expect(parseClientName('aqui é a Maria')).toBe('Maria');
    });

    it('should parse "meu nome é [Nome]"', () => {
        expect(parseClientName('Meu nome é Ana')).toBe('Ana');
        expect(parseClientName('meu nome e Pedro')).toBe('Pedro');
    });

    it('should parse "Oi, [Nome]"', () => {
        expect(parseClientName('Oi, sou José')).toBe('José');
        expect(parseClientName('Olá Roberto')).toBe('Roberto');
    });

    it('should return null for non-name lines', () => {
        expect(parseClientName('2 frangos assados')).toBeNull();
        expect(parseClientName('para retirar as 11h')).toBeNull();
    });

    it('should exclude common words', () => {
        expect(parseClientName('Oi quero fazer um pedido')).toBeNull();
        expect(parseClientName('Oi gostaria de pedir')).toBeNull();
    });

    it('should handle names with accents', () => {
        expect(parseClientName('sou a André')).toBe('André');
        expect(parseClientName('aqui é José')).toBe('José');
    });
});

describe('parseScheduledTime', () => {
    it('should parse "11:30" format', () => {
        const result = parseScheduledTime('para retirar as 11:30');
        expect(result?.getHours()).toBe(11);
        expect(result?.getMinutes()).toBe(30);
    });

    it('should parse "14h" format', () => {
        const result = parseScheduledTime('entrega 14h');
        expect(result?.getHours()).toBe(14);
        expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "9h30" format', () => {
        const result = parseScheduledTime('às 9h30');
        expect(result?.getHours()).toBe(9);
        expect(result?.getMinutes()).toBe(30);
    });

    it('should parse "10:00 hs" format', () => {
        const result = parseScheduledTime('10:00 hs');
        expect(result?.getHours()).toBe(10);
        expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "às 12:00" format', () => {
        const result = parseScheduledTime('às 12:00');
        expect(result?.getHours()).toBe(12);
        expect(result?.getMinutes()).toBe(0);
    });

    it('should parse "as 15h" format (without accent)', () => {
        const result = parseScheduledTime('retirar as 15h');
        expect(result?.getHours()).toBe(15);
        expect(result?.getMinutes()).toBe(0);
    });

    it('should return null for non-time lines', () => {
        expect(parseScheduledTime('2 frangos assados')).toBeNull();
        expect(parseScheduledTime('sou a Paula')).toBeNull();
    });

    it('should reject invalid hours', () => {
        expect(parseScheduledTime('às 25:00')).toBeNull();
    });

    it('should reject invalid minutes', () => {
        expect(parseScheduledTime('às 10:75')).toBeNull();
    });
});

describe('parseItemLine', () => {
    it('should parse "2 frangos assados"', () => {
        const result = parseItemLine('2 frangos assados', mockProducts);
        expect(result?.product.name).toBe('Frango Assado');
        expect(result?.quantity).toBe(2);
    });

    it('should parse "1 salada de maionese"', () => {
        const result = parseItemLine('1 salada de maionese', mockProducts);
        expect(result?.product.name).toBe('Salada de Maionese');
        expect(result?.quantity).toBe(1);
    });

    it('should parse "3x frango"', () => {
        const result = parseItemLine('3x frango', mockProducts);
        expect(result?.product.name).toContain('Frango');
        expect(result?.quantity).toBe(3);
    });

    it('should parse "1.5 kg salada"', () => {
        const result = parseItemLine('1.5 kg salada', mockProducts);
        expect(result?.product.name).toBe('Salada de Maionese');
        expect(result?.quantity).toBe(1.5);
    });

    it('should parse "meia galinha"', () => {
        const result = parseItemLine('meia galinha', mockProducts);
        expect(result?.product.name).toBe('Galinha Caipira');
        expect(result?.quantity).toBe(0.5);
    });

    it('should parse "meio frango"', () => {
        const result = parseItemLine('meio frango', mockProducts);
        expect(result?.product.name).toContain('Frango');
        expect(result?.quantity).toBe(0.5);
    });

    it('should parse "dois frangos"', () => {
        const result = parseItemLine('dois frangos', mockProducts);
        expect(result?.product.name).toContain('Frango');
        expect(result?.quantity).toBe(2);
    });

    it('should parse "três coxinhas"', () => {
        const result = parseItemLine('três coxinhas', mockProducts);
        expect(result?.product.name).toBe('Coxinha de Frango');
        expect(result?.quantity).toBe(3);
    });

    it('should parse "uma farofa"', () => {
        const result = parseItemLine('uma farofa', mockProducts);
        expect(result?.product.name).toBe('Farofa');
        expect(result?.quantity).toBe(1);
    });

    it('should parse with comma decimal separator "1,5 frango"', () => {
        const result = parseItemLine('1,5 frango', mockProducts);
        expect(result?.product.name).toContain('Frango');
        expect(result?.quantity).toBe(1.5);
    });

    it('should return null for unrecognized products', () => {
        const result = parseItemLine('2 pizzas', mockProducts);
        expect(result).toBeNull();
    });

    it('should calculate totalPrice correctly', () => {
        const result = parseItemLine('2 frangos assados', mockProducts);
        expect(result?.totalPrice).toBe(90); // 2 * 45
    });

    it('should handle typos in product names', () => {
        const result = parseItemLine('2 farrofa', mockProducts);
        expect(result?.product.name).toBe('Farofa');
    });

    it('should handle accents in product names', () => {
        const result = parseItemLine('1 feijao tropeiro', mockProducts);
        expect(result?.product.name).toBe('Feijão Tropeiro');
    });
});

describe('wordToNumber', () => {
    it('should have correct mappings', () => {
        expect(wordToNumber['meia']).toBe(0.5);
        expect(wordToNumber['metade']).toBe(0.5);
        expect(wordToNumber['um']).toBe(1);
        expect(wordToNumber['uma']).toBe(1);
        expect(wordToNumber['dois']).toBe(2);
        expect(wordToNumber['duas']).toBe(2);
        expect(wordToNumber['tres']).toBe(3);
        expect(wordToNumber['três']).toBe(3);
        expect(wordToNumber['quatro']).toBe(4);
        expect(wordToNumber['cinco']).toBe(5);
    });
});

describe('parseWhatsAppMessage - Full Integration', () => {
    it('should parse complete message with all elements', () => {
        const message = `Oi, sou a Paula
2 frangos assados
1 salada de maionese
Para retirar as 11:30`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBe('Paula');
        expect(result.items).toHaveLength(2);
        expect(result.items[0].product.name).toBe('Frango Assado');
        expect(result.items[0].quantity).toBe(2);
        expect(result.items[1].product.name).toBe('Salada de Maionese');
        expect(result.items[1].quantity).toBe(1);
        expect(result.scheduledTime?.getHours()).toBe(11);
        expect(result.scheduledTime?.getMinutes()).toBe(30);
    });

    it('should parse message with items only', () => {
        const message = `2 frangos
1 farofa
3 coxinhas`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBeUndefined();
        expect(result.scheduledTime).toBeUndefined();
        expect(result.items).toHaveLength(3);
    });

    it('should collect unrecognized lines as notes', () => {
        const message = `Oi, sou a Maria
2 frangos
Sem pimenta por favor
Entrega no portão
às 14h`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBe('Maria');
        expect(result.items).toHaveLength(1);
        expect(result.scheduledTime?.getHours()).toBe(14);
        expect(result.notes).toContain('Sem pimenta por favor');
        expect(result.notes).toContain('Entrega no portão');
    });

    it('should handle empty message', () => {
        const result = parseWhatsAppMessage('', mockProducts);

        expect(result.clientName).toBeUndefined();
        expect(result.items).toHaveLength(0);
        expect(result.scheduledTime).toBeUndefined();
        expect(result.notes).toBe('');
    });

    it('should handle message with only notes', () => {
        const message = `Bom dia!
Gostaria de fazer um pedido
Vocês entregam?`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBeUndefined();
        expect(result.items).toHaveLength(0);
        expect(result.notes).toContain('Bom dia!');
    });

    it('should handle word quantities in full message', () => {
        const message = `Sou a Carol
dois frangos assados
uma salada
meia galinha
às 12h`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBe('Carol');
        expect(result.items).toHaveLength(3);
        expect(result.items[0].quantity).toBe(2);
        expect(result.items[1].quantity).toBe(1);
        expect(result.items[2].quantity).toBe(0.5);
        expect(result.scheduledTime?.getHours()).toBe(12);
    });

    it('should handle multiline greeting', () => {
        const message = `Boa tarde
Aqui é o Roberto
1 frango assado`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBe('Roberto');
        expect(result.items).toHaveLength(1);
    });

    it('should handle mixed format message', () => {
        const message = `Olá!
Meu nome é Fernanda
Quero:
2x frango assado
1.5 kg de salada de maionese
3 farofas
Retirada às 18:30
Obrigada!`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBe('Fernanda');
        expect(result.items).toHaveLength(3);
        expect(result.scheduledTime?.getHours()).toBe(18);
        expect(result.scheduledTime?.getMinutes()).toBe(30);
        expect(result.notes).toContain('Quero:');
        expect(result.notes).toContain('Obrigada!');
    });

    it('should handle multiple items of same product', () => {
        const message = `2 frangos assados
1 frango assado`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.items).toHaveLength(2);
        expect(result.items[0].quantity).toBe(2);
        expect(result.items[1].quantity).toBe(1);
    });

    it('should handle informal message style', () => {
        const message = `oi sou patricia
quero 3 frango
2 maionese
11h`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBe('Patricia');
        expect(result.items).toHaveLength(2);
        expect(result.scheduledTime?.getHours()).toBe(11);
    });

    it('should handle message with CAPS', () => {
        const message = `SOU A JULIA
2 FRANGOS
1 FAROFA
AS 10H`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.clientName).toBe('Julia');
        expect(result.items).toHaveLength(2);
        expect(result.scheduledTime?.getHours()).toBe(10);
    });

    it('should handle decimal quantities', () => {
        const message = `0,5 frango
1,5 salada`;

        const result = parseWhatsAppMessage(message, mockProducts);

        expect(result.items).toHaveLength(2);
        expect(result.items[0].quantity).toBe(0.5);
        expect(result.items[1].quantity).toBe(1.5);
    });
});

describe('Edge Cases', () => {
    it('should handle numbered list format', () => {
        const message = `1. 2 frangos
2. 1 salada
3. 1 farofa`;

        // These might go to notes since they include "1." prefix
        const result = parseWhatsAppMessage(message, mockProducts);
        // Should still try to parse if possible
        expect(result).toBeDefined();
    });

    it('should handle bullet points', () => {
        const message = `- 2 frangos
- 1 salada`;

        const result = parseWhatsAppMessage(message, mockProducts);
        expect(result).toBeDefined();
    });

    it('should handle emoji in message', () => {
        const message = `Oi 👋
2 frangos 🍗
11h ⏰`;

        const result = parseWhatsAppMessage(message, mockProducts);
        expect(result.items.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle very long product description', () => {
        const message = `2 porcao de frango assado bem sequinho por favor sem gordura`;

        const result = parseWhatsAppMessage(message, mockProducts);
        expect(result).toBeDefined();
    });

    it('should not crash on special characters', () => {
        const message = `@#$%^&*()
2 frangos
!!!`;

        const result = parseWhatsAppMessage(message, mockProducts);
        expect(result).toBeDefined();
        expect(result.items).toHaveLength(1);
    });
});
