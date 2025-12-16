import { describe, it, expect } from 'vitest';
import { generatePixCode } from '@/utils/pix';

describe('PIX Utilities', () => {
  describe('generatePixCode', () => {
    it('should generate a valid PIX code with all parameters', () => {
      const pixCode = generatePixCode({
        pixKey: '12345678901',
        merchantName: 'LOJA TESTE',
        merchantCity: 'SAO PAULO',
        amount: 100.50,
        txid: 'TX123',
      });

      expect(pixCode).toBeDefined();
      expect(typeof pixCode).toBe('string');
      expect(pixCode.length).toBeGreaterThan(0);
      
      // Should contain the PIX key
      expect(pixCode).toContain('12345678901');
      
      // Should start with the format indicator
      expect(pixCode.startsWith('00')).toBe(true);
      
      // Should contain CRC16 at the end (4 hex characters)
      expect(pixCode).toMatch(/[0-9A-F]{4}$/);
    });

    it('should generate a PIX code without amount', () => {
      const pixCode = generatePixCode({
        pixKey: 'email@example.com',
      });

      expect(pixCode).toBeDefined();
      expect(pixCode).toContain('email@example.com');
      
      // Should NOT contain the amount field (54)
      // The format is 54 + length + value
      // Without amount, there should be no "54XX" pattern for transaction amount
    });

    it('should use default merchant name and city when not provided', () => {
      const pixCode = generatePixCode({
        pixKey: '11999998888',
      });

      expect(pixCode).toBeDefined();
      
      // Default merchant name is "ROTI PAOLA"
      expect(pixCode).toContain('ROTI PAOLA');
      
      // Default city is "SAO PAULO"
      expect(pixCode).toContain('SAO PAULO');
    });

    it('should truncate long merchant names to 25 characters', () => {
      const longName = 'A'.repeat(50);
      const pixCode = generatePixCode({
        pixKey: '12345678901',
        merchantName: longName,
      });

      expect(pixCode).toBeDefined();
      
      // The truncated name (25 chars) should be in the code
      expect(pixCode).toContain('A'.repeat(25));
      
      // But not the full 50 chars
      expect(pixCode).not.toContain('A'.repeat(26));
    });

    it('should truncate long city names to 15 characters', () => {
      const longCity = 'B'.repeat(30);
      const pixCode = generatePixCode({
        pixKey: '12345678901',
        merchantCity: longCity,
      });

      expect(pixCode).toBeDefined();
      
      // The truncated city (15 chars) should be in the code
      expect(pixCode).toContain('B'.repeat(15));
      
      // But not the full 30 chars
      expect(pixCode).not.toContain('B'.repeat(16));
    });

    it('should format amount with 2 decimal places', () => {
      const pixCode = generatePixCode({
        pixKey: '12345678901',
        amount: 99.9,
      });

      expect(pixCode).toBeDefined();
      
      // Amount should be formatted as 99.90
      expect(pixCode).toContain('99.90');
    });

    it('should handle different PIX key types', () => {
      // CPF
      const cpfCode = generatePixCode({ pixKey: '12345678901' });
      expect(cpfCode).toContain('12345678901');

      // Phone
      const phoneCode = generatePixCode({ pixKey: '+5511999998888' });
      expect(phoneCode).toContain('+5511999998888');

      // Email
      const emailCode = generatePixCode({ pixKey: 'test@test.com' });
      expect(emailCode).toContain('test@test.com');

      // Random key (UUID)
      const uuidCode = generatePixCode({ pixKey: '123e4567-e89b-12d3-a456-426614174000' });
      expect(uuidCode).toContain('123e4567-e89b-12d3-a456-426614174000');
    });

    it('should generate different CRC for different inputs', () => {
      const code1 = generatePixCode({
        pixKey: '12345678901',
        amount: 100,
      });

      const code2 = generatePixCode({
        pixKey: '12345678901',
        amount: 200,
      });

      // Last 4 characters are the CRC
      const crc1 = code1.slice(-4);
      const crc2 = code2.slice(-4);

      expect(crc1).not.toBe(crc2);
    });

    it('should include txid in the code', () => {
      const pixCode = generatePixCode({
        pixKey: '12345678901',
        txid: 'MYREF123',
      });

      expect(pixCode).toContain('MYREF123');
    });

    it('should use default txid when not provided', () => {
      const pixCode = generatePixCode({
        pixKey: '12345678901',
      });

      // Default txid is "***"
      expect(pixCode).toContain('***');
    });

    it('should not include amount when amount is 0', () => {
      const pixCode = generatePixCode({
        pixKey: '12345678901',
        amount: 0,
      });

      // Amount field (54) should not be present
      // This is hard to test directly without parsing, but we can check length
      const codeWithAmount = generatePixCode({
        pixKey: '12345678901',
        amount: 100,
      });

      expect(pixCode.length).toBeLessThan(codeWithAmount.length);
    });

    it('should handle special characters in merchant name', () => {
      // Test that the function doesn't crash with special chars
      const pixCode = generatePixCode({
        pixKey: '12345678901',
        merchantName: 'LOJA & CAFÉ',
      });

      expect(pixCode).toBeDefined();
      expect(pixCode.length).toBeGreaterThan(0);
    });
  });
});
