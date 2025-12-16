/**
 * Test data factories for E2E tests.
 * Generates unique data to avoid conflicts in the real Supabase database.
 */

/**
 * Generates a unique test identifier based on timestamp
 */
export function uniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * Generates a valid CPF number for testing
 * Note: This generates a structurally valid CPF but is for testing purposes only
 */
export function generateCPF(): string {
  const random = (n: number) => Math.floor(Math.random() * n);
  
  const cpf = Array.from({ length: 9 }, () => random(9));
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += cpf[i] * (10 - i);
  }
  let d1 = 11 - (sum % 11);
  d1 = d1 >= 10 ? 0 : d1;
  cpf.push(d1);
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += cpf[i] * (11 - i);
  }
  let d2 = 11 - (sum % 11);
  d2 = d2 >= 10 ? 0 : d2;
  cpf.push(d2);
  
  // Format: XXX.XXX.XXX-XX
  const cpfStr = cpf.join('');
  return `${cpfStr.slice(0, 3)}.${cpfStr.slice(3, 6)}.${cpfStr.slice(6, 9)}-${cpfStr.slice(9)}`;
}

/**
 * Generates a valid CNPJ number for testing
 */
export function generateCNPJ(): string {
  const random = (n: number) => Math.floor(Math.random() * n);
  
  const cnpj = Array.from({ length: 12 }, () => random(9));
  
  // Calculate first verification digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += cnpj[i] * weights1[i];
  }
  let d1 = sum % 11;
  d1 = d1 < 2 ? 0 : 11 - d1;
  cnpj.push(d1);
  
  // Calculate second verification digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += cnpj[i] * weights2[i];
  }
  let d2 = sum % 11;
  d2 = d2 < 2 ? 0 : 11 - d2;
  cnpj.push(d2);
  
  // Format: XX.XXX.XXX/XXXX-XX
  const cnpjStr = cnpj.join('');
  return `${cnpjStr.slice(0, 2)}.${cnpjStr.slice(2, 5)}.${cnpjStr.slice(5, 8)}/${cnpjStr.slice(8, 12)}-${cnpjStr.slice(12)}`;
}

/**
 * Generates a test client object
 */
export function generateTestClient() {
  const id = uniqueId();
  return {
    name: `Cliente Teste ${id}`,
    cpfCnpj: generateCPF(),
    phone: `(11) ${Math.floor(90000 + Math.random() * 9999)}-${Math.floor(1000 + Math.random() * 8999)}`,
    email: `teste.${id}@example.com`,
  };
}

/**
 * Test credentials for authentication
 * IMPORTANT: These should be test/development account credentials
 */
export const TEST_CREDENTIALS = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'testpassword123',
};
