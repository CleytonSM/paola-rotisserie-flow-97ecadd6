import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export interface CsvColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number);
}

export function exportToCsv<T extends object>(
  data: T[],
  columns: CsvColumn<T>[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = columns.map((col) => col.header);
  
  const rows = data.map((item) =>
    columns.map((col) => {
      const value =
        typeof col.accessor === "function"
          ? col.accessor(item)
          : item[col.accessor];
      
      const stringValue = String(value ?? "");
      if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    })
  );

  const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPdf(
  elementId: string,
  filename: string,
  reportTitle: string,
  periodLabel: string
): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error("Elemento não encontrado:", elementId);
    return;
  }

  const canvas = await html2canvas(element, {
    useCORS: true,
    logging: false,
    background: "#ffffff",
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const headerHeight = 35;
  const footerHeight = 15;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - headerHeight - footerHeight - margin;

  addPdfHeader(pdf, reportTitle, periodLabel, margin, pageWidth);

  const imgWidth = contentWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let yPosition = headerHeight;
  let remainingHeight = imgHeight;
  let sourceY = 0;

  while (remainingHeight > 0) {
    if (yPosition !== headerHeight) {
      pdf.addPage();
      addPdfHeader(pdf, reportTitle, periodLabel, margin, pageWidth);
      yPosition = headerHeight;
    }

    const sliceHeight = Math.min(remainingHeight, contentHeight);
    const sourceSliceHeight = (sliceHeight / imgWidth) * canvas.width;

    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = sourceSliceHeight;
    const ctx = tempCanvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(
        canvas,
        0,
        sourceY,
        canvas.width,
        sourceSliceHeight,
        0,
        0,
        canvas.width,
        sourceSliceHeight
      );
      const sliceImgData = tempCanvas.toDataURL("image/png");
      pdf.addImage(sliceImgData, "PNG", margin, yPosition, imgWidth, sliceHeight);
    }

    sourceY += sourceSliceHeight;
    remainingHeight -= sliceHeight;
    yPosition += sliceHeight;
  }

  addPdfFooter(pdf, margin, pageWidth, pageHeight);

  pdf.save(filename);
}

function addPdfHeader(
  pdf: jsPDF,
  reportTitle: string,
  periodLabel: string,
  margin: number,
  pageWidth: number
): void {
  pdf.setFillColor(255, 251, 245);
  pdf.rect(0, 0, pageWidth, 30, "F");

  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(46, 46, 46);
  pdf.text("Paola Gonçalves Rotisseria", margin, 12);

  pdf.setFontSize(12);
  pdf.setFont("helvetica", "normal");
  pdf.text(reportTitle, margin, 20);

  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  pdf.text(periodLabel, margin, 27);

  pdf.setDrawColor(240, 230, 210);
  pdf.line(margin, 30, pageWidth - margin, 30);
}

function addPdfFooter(
  pdf: jsPDF,
  margin: number,
  pageWidth: number,
  pageHeight: number
): void {
  const totalPages = pdf.getNumberOfPages();
  
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    
    pdf.setDrawColor(240, 230, 210);
    pdf.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

    pdf.setFontSize(8);
    pdf.setTextColor(107, 114, 128);
    pdf.setFont("helvetica", "normal");
    
    const exportDate = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    pdf.text(`Gerado pelo sistema em ${exportDate}`, margin, pageHeight - 6);
    pdf.text(`Página ${i} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 6);
  }
}

export function generateReportFilename(
  reportType: string,
  extension: "pdf" | "csv",
  dateRange?: { from: Date; to: Date }
): string {
  const now = new Date();
  const dateStr = format(now, "yyyy-MM-dd");
  
  if (dateRange) {
    const fromStr = format(dateRange.from, "yyyy-MM-dd");
    const toStr = format(dateRange.to, "yyyy-MM-dd");
    if (fromStr !== toStr) {
      return `relatorio-${reportType}-${fromStr}-a-${toStr}.${extension}`;
    }
  }
  
  return `relatorio-${reportType}-${dateStr}.${extension}`;
}

export function generatePeriodLabel(dateRange: { from: Date; to: Date }): string {
  const fromStr = format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
  const toStr = format(dateRange.to, "dd/MM/yyyy", { locale: ptBR });
  
  if (fromStr === toStr) {
    return `Dia ${fromStr}`;
  }
  
  return `Período: ${fromStr} a ${toStr}`;
}

export type ReportsFilterType =
  | "today"
  | "weekly"
  | "monthly"
  | "bimonthly"
  | "quarterly"
  | "semiannually"
  | "annually"
  | "custom";

const FILTER_LABELS: Record<ReportsFilterType, string> = {
  today: "Hoje",
  weekly: "Últimos 7 dias",
  monthly: "Últimos 30 dias",
  bimonthly: "Últimos 2 meses",
  quarterly: "Últimos 3 meses",
  semiannually: "Últimos 6 meses",
  annually: "Último ano",
  custom: "Personalizado",
};

export function generateWhatsAppPeriodLabel(
  dateRange: { from: Date; to: Date },
  filter: ReportsFilterType
): string {
  const fromStr = format(dateRange.from, "dd/MM/yyyy", { locale: ptBR });
  const toStr = format(dateRange.to, "dd/MM/yyyy", { locale: ptBR });
  const filterLabel = FILTER_LABELS[filter];
  
  if (fromStr === toStr) {
    return `${fromStr} (${filterLabel})`;
  }
  
  return `${fromStr} a ${toStr} (${filterLabel})`;
}

export interface WhatsAppReportData {
  faturamento: number;
  pedidos: number;
  entregas: number;
  topProduto?: { name: string; quantity: number };
  periodo: string;
}

export function generateWhatsAppReportMessage(data: WhatsAppReportData): string {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  let message = `Resumo do dia\n`;
  message += `Faturamento: ${formatCurrency(data.faturamento)}\n`;
  message += `Pedidos: ${data.pedidos}\n`;
  message += `Entregas: ${data.entregas}\n`;
  
  if (data.topProduto) {
    message += `Top produto: ${data.topProduto.name} (${data.topProduto.quantity}un)\n`;
  }
  
  message += `Período: ${data.periodo}`;

  return message;
}

export function openWhatsAppWithMessage(message: string): void {
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
}
