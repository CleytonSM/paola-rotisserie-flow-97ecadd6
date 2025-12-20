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

    const receiptHtml = `
      <div class="text-center font-bold" style="font-size: 16px;">${data.storeName}</div>
      ${data.storeAddress ? `<div class="text-center">${data.storeAddress}</div>` : ''}
      ${data.storePhone ? `<div class="text-center">${data.storePhone}</div>` : ''}
      
      <div class="divider"></div>
      
      <div>Data: ${data.date.toLocaleString('pt-BR')}</div>
      <div>Pedido: ${data.orderId}</div>
      ${data.clientName ? `<div>Cliente: ${data.clientName}</div>` : ''}
      ${data.isDelivery ? `<div><strong>ENTREGA</strong></div>` : ''}
      
      <div class="divider"></div>
      
      ${itemsHtml}
      
      <div class="divider"></div>
      
      <div class="item-row">
        <span>Subtotal:</span>
        <span>${formatCurrency(data.subtotal)}</span>
      </div>
      ${data.deliveryFee ? `
      <div class="item-row">
        <span>Taxa Entrega:</span>
        <span>${formatCurrency(data.deliveryFee)}</span>
      </div>
      ` : ''}
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
      ${data.notes ? `
      <div class="divider"></div>
      <div style="font-weight: bold; margin-bottom: 2px;">Observações:</div>
      <div>${data.notes}</div>
      ` : ''}
      
      <div class="divider"></div>
      
      <div class="text-center footer">
        Obrigado pela preferência!<br>
        Volte sempre!
      </div>
    `;

    let finalHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo</title>
        ${styles}
      </head>
      <body>
        ${receiptHtml}
    `;

    if (data.isDelivery && data.deliveryAddress) {
        finalHtml += `
            <div style="page-break-before: always; height: 20px;"></div>
            <div class="divider"></div>
            <div class="text-center font-bold" style="font-size: 24px; margin-bottom: 10px;">ENTREGA</div>
            <div class="divider"></div>
            
            <div style="font-size: 14px; margin-bottom: 5px;">Cliente:</div>
            <div style="font-size: 18px; font-weight: bold; margin-bottom: 5px;">${data.clientName}</div>
            ${data.clientPhone ? `<div style="font-size: 16px; margin-bottom: 10px;">${data.clientPhone}</div>` : ''}
            
            <div style="font-size: 14px; margin-bottom: 5px;">Endereço:</div>
            <div style="font-size: 20px; font-weight: bold; line-height: 1.3;">
                ${data.deliveryAddress}
            </div>
            
            ${data.notes ? `
            <div style="margin-top: 15px;">
                <div style="font-size: 14px; margin-bottom: 5px;">Observações:</div>
                <div style="font-size: 16px; font-weight: bold;">${data.notes}</div>
            </div>
            ` : ''}

            <div class="divider"></div>
            <div style="font-size: 14px; margin-bottom: 5px;">Itens:</div>
            ${itemsHtml}

            <div class="divider"></div>
            <div style="font-size: 24px; font-weight: bold; text-align: right; margin-top: 10px;">
                TOTAL: ${formatCurrency(data.total)}
            </div>

            <div style="margin-top: 20px; font-size: 12px; text-align: center;">
                Pedido: ${data.orderId}
            </div>
        `;
    }

    finalHtml += `
      </body>
      </html>
    `;

    return finalHtml;
  }
}
