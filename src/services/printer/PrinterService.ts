import { PrinterInterface, ReceiptData } from "./PrinterInterface";
import { ZebraPrinterStrategy } from "./ZebraPrinterStrategy";

class PrinterService {
  private strategy: PrinterInterface;

  constructor() {
    // Default to Zebra (HTML/CSS) strategy
    this.strategy = new ZebraPrinterStrategy();
  }

  setStrategy(strategy: PrinterInterface) {
    this.strategy = strategy;
  }

  async printReceipt(data: ReceiptData): Promise<void> {
    return this.strategy.printReceipt(data);
  }
}

export const printerService = new PrinterService();
