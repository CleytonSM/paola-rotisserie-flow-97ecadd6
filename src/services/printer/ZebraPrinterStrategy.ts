import { PrinterInterface, ReceiptData } from "./PrinterInterface";
import { formatCurrency } from "@/utils/format";

export class ZebraPrinterStrategy implements PrinterInterface {
  async printReceipt(data: ReceiptData): Promise<void> {
    const receiptContent = this.generateReceiptHTML(data);
    this.printHTML(receiptContent);
  }

  private printHTML(htmlContent: string) {
    const iframe = document.createElement("iframe");
    iframe.style.position = "absolute";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();

      // Cleanup after print dialog is closed (or reasonably timed out)
      // Note: There is no reliable event for "print cancel", so we just delay removal
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }
  }

  private generateReceiptHTML(data: ReceiptData): string {
    const styles = `
      <style>
        @page {
          margin: 0;
          size: 80mm auto; /* 80mm width, auto height */
        }
        body {
          font-family: 'Courier New', Courier, monospace;
          width: 80mm;
          margin: 0;
          padding: 5px;
          color: #000;
          font-size: 12px;
          line-height: 1.2;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: bold; }
        .divider { border-top: 1px dashed #000; margin: 5px 0; }
        .item-row { display: flex; justify-content: space-between; }
        .item-name { width: 100%; margin-bottom: 2px; }
        .item-details { display: flex; justify-content: space-between; font-size: 11px; }
        .total-row { display: flex; justify-content: space-between; margin-top: 5px; font-size: 14px; }
        .footer { margin-top: 10px; font-size: 10px; }
      </style>
    `;

    const itemsHtml = data.items.map(item => `
      <div style="margin-bottom: 5px;">
        <div class="item-name">${item.name}</div>
        <div class="item-details">
          <span>${item.quantity} x ${formatCurrency(item.price)}</span>
          <span>${formatCurrency(item.total)}</span>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo</title>
        ${styles}
      </head>
      <body>
        <div class="text-center font-bold" style="font-size: 16px;">${data.storeName}</div>
        ${data.storeAddress ? `<div class="text-center">${data.storeAddress}</div>` : ''}
        ${data.storePhone ? `<div class="text-center">${data.storePhone}</div>` : ''}
        
        <div class="divider"></div>
        
        <div>Data: ${data.date.toLocaleString('pt-BR')}</div>
        <div>Pedido: ${data.orderId}</div>
        ${data.clientName ? `<div>Cliente: ${data.clientName}</div>` : ''}
        
        <div class="divider"></div>
        
        ${itemsHtml}
        
        <div class="divider"></div>
        
        <div class="item-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(data.subtotal)}</span>
        </div>
        ${data.discount ? `
        <div class="item-row">
          <span>Desconto:</span>
          <span>-${formatCurrency(data.discount)}</span>
        </div>
        ` : ''}
        <div class="total-row font-bold">
          <span>TOTAL:</span>
          <span>${formatCurrency(data.total)}</span>
        </div>
        
        <div class="divider"></div>
        
        <div class="item-row">
          <span>Pagamento:</span>
          <span class="font-bold uppercase">${data.paymentMethod}</span>
        </div>
        ${data.change ? `
        <div class="item-row">
          <span>Troco:</span>
          <span>${formatCurrency(data.change)}</span>
        </div>
        ` : ''}
        
        <div class="divider"></div>
        
        <div class="text-center footer">
          Obrigado pela preferência!<br>
          Volte sempre!
        </div>
      </body>
      </html>
    `;
  }
}
