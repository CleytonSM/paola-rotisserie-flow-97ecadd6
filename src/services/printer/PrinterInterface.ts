export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  date: Date;
  orderId: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  total: number;
  paymentMethod: string;
  clientName?: string;
  change?: number; // Troco
}

export interface PrinterInterface {
  printReceipt(data: ReceiptData): Promise<void>;
}
