/**
 * @deprecated This file has been refactored into separate entity files.
 * Please import from @/services/database instead.
 * 
 * The database service has been organized into the following structure:
 * - src/services/database/types.ts - Shared types
 * - src/services/database/suppliers.ts - Supplier operations
 * - src/services/database/clients.ts - Client operations
 * - src/services/database/payable.ts - Accounts payable operations
 * - src/services/database/receivable.ts - Accounts receivable operations
 * - src/services/database/analytics.ts - Dashboard analytics
 * - src/services/database/tokens.ts - Refresh token operations
 * - src/services/database/index.ts - Re-exports all operations
 * 
 * All existing imports from @/services/database will continue to work
 * through the index.ts file.
 */

// Re-export everything from the new structure for backward compatibility
export * from "./database/index";
