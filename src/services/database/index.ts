/**
 * Database service index
 * Re-exports all database operations for convenient importing
 */

// Types
export type { DatabaseResult, DatabaseQuery, DatabaseMutation } from "./types";
export type { CardMachine, CardFlag } from "./machines";
export type { PixKey, PixKeyType } from "./pix_keys";

// Suppliers
export {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./suppliers";

// Clients
export {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from "./clients";

// Accounts Payable
export {
  getAccountsPayable,
  getAccountsPayableByDateRange,
  getPayablesForReports,
  createAccountPayable,
  updateAccountPayable,
  updateAccountPayableStatus,
  deleteAccountPayable,
} from "./payable";

// Accounts Receivable
export {
  getAccountsReceivable,
  getAccountsReceivableByDateRange,
  getReceivablesForReports,
  createAccountReceivable,
  updateAccountReceivable,
  updateAccountReceivableStatus,
  deleteAccountReceivable,
} from "./receivable";

// Analytics
export {
  getWeeklyBalance,
  getPendingCounts,
  getUnpaidPayablesCount,
  getClientsCount,
  getSuppliersCount,
  getUpcomingPayablesCount,
  getOverduePayablesCount,
  getProfitHistory,
} from "./analytics";

// Refresh Tokens
export {
  revokeRefreshTokens,
  saveRefreshToken,
  getValidRefreshToken,
} from "./tokens";

// Machines
export {
  getMachines,
  createMachine,
  updateMachine,
  deleteMachine,
  addFlag,
  deleteFlag,
} from "./machines";

// Pix Keys
export {
  getPixKeys,
  createPixKey,
  updatePixKey,
  deletePixKey,
  togglePixKeyStatus,
} from "./pix_keys";
