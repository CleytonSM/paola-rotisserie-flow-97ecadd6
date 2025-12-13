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
    getSuppliersList,
    getSupplierById,
    createSupplier,
    updateSupplier,
    deleteSupplier,
} from "./suppliers";

// Clients
export {
    getClients,
    getClientsList,
    getClientById,
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
export type { PayableFilters } from "./payable";

// Accounts Receivable
export {
    getAccountsReceivable,
    getAccountsReceivableByDateRange,
    getReceivablesForReports,
    createAccountReceivable,
    updateAccountReceivable,
    updateAccountReceivableStatus,
    deleteAccountReceivable,
    getReceivablePayments,
} from "./receivable";
export type { ReceivablePayment, ReceivableFilters } from "./receivable";

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

// Product Catalog (Master Products)
export {
    getProductCatalog,
    getProductCatalogList,
    getProductCatalogById,
    getInternalActiveCatalogProducts,
    createCatalogProduct,
    updateCatalogProduct,
    deleteCatalogProduct,
    hardDeleteCatalogProduct,
} from "./product-catalog";
export type { ProductCatalog, ProductCatalogInput } from "./product-catalog";

// Product Items (Individual Weighed Items)
export {
    getProductItems,
    createProductItem,
    updateProductItem,
    deleteProductItem,
    markItemAsSold,
    getExpiringItems,
    markExpiredItems,
} from "./product-items";
export type {
    ProductItem,
    ProductItemInput,
    ProductItemStatus,
    ProductItemFilters
} from "./product-items";

// Product Stock
export { getProductCatalogStock, getAllCatalogStocks } from "./product-stock";
export type { StockSummary } from "./product-stock";