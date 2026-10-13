import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate, formatLocalDateTime } from "@/utils/formatDate";
import { getSniperLogoUrl } from "@/utils/azureStorage";
import { PDF_FONT, registerPdfFonts } from "@/utils/pdfFonts";

const FOOTER_MARGIN_MM = 14;
/** Equal horizontal inset for table and totals (mm). */
const PDF_SIDE_MARGIN_MM = 14;
/** Standard page margins; top is used on page 2+ (page 1 uses startY below report header). */
const PDF_TABLE_MARGIN = {
  left: PDF_SIDE_MARGIN_MM,
  right: PDF_SIDE_MARGIN_MM,
  bottom: 16,
  top: 14,
};

/** Column width ratios (must sum to 1). */
const PDF_COL_RATIOS = [0.18, 0.1, 0.14, 0.32, 0.11, 0.15];

function buildPdfColumnStyles(contentWidthMm) {
  const widths = [];
  let used = 0;
  for (let i = 0; i < PDF_COL_RATIOS.length - 1; i += 1) {
    const w = Math.round(contentWidthMm * PDF_COL_RATIOS[i] * 10) / 10;
    widths.push(w);
    used += w;
  }
  widths.push(Math.round((contentWidthMm - used) * 10) / 10);

  return {
    0: { cellWidth: widths[0], overflow: "linebreak" },
    1: { cellWidth: widths[1] },
    2: { cellWidth: widths[2] },
    3: { cellWidth: widths[3], overflow: "linebreak" },
    4: { cellWidth: widths[4], overflow: "linebreak" },
    5: { cellWidth: widths[5], halign: "right", overflow: "linebreak" },
  };
}

export function formatReportPeriod(summary) {
  const from = summary.fromDate ? formatDate(summary.fromDate, "long") : "—";
  const to = summary.toDate ? formatDate(summary.toDate, "long") : "—";
  return `${from} to ${to}`;
}

/** PDF header line, e.g. "Fund Transaction Report: 1 June 2026 to 30 June 2026". */
export function formatPdfReportTitle(summary) {
  return `Sniper Assist Report: ${formatReportPeriod(summary)}`;
}

function slugDateForFilename(date) {
  if (!date) return "all";
  return formatDate(date, "long")
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/\s+/g, "-");
}

/** Download filename, e.g. fund-report-1-june-2026-to-30-june-2026.pdf */
export function buildFundReportFilename(summary, extension = "pdf") {
  const from = slugDateForFilename(summary?.fromDate);
  const to = slugDateForFilename(summary?.toDate);
  const ext = extension.replace(/^\./, "");
  return `fund-report-${from}-to-${to}.${ext}`;
}

/** INR amounts without currency symbol (jsPDF default fonts omit ₹). */
export function formatPdfAmount(amount) {
  const n = Math.abs(Number(amount) || 0);
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);
}

/** PDF type cell: Deposit/Expense with (Transferred) on the next line when applicable. */
export function formatReportTypeForPdf(row) {
  if (!row?.isTransferred) return row?.type ?? "";
  return `${row.type}\n(Transferred)`;
}

/** Excel/CSV type cell, e.g. Deposit (Transferred). */
export function formatReportTypeForExcel(row) {
  if (!row?.isTransferred) return row?.type ?? "";
  return `${row.type} (Transferred)`;
}

function escapeCsv(val) {
  const s = String(val ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function imageElementToDataUrl(img) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx || !canvas.width || !canvas.height) {
    throw new Error("logo canvas failed");
  }
  ctx.drawImage(img, 0, 0);
  return canvas.toDataURL("image/png");
}

function loadImageElement(url, crossOrigin) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`logo load failed: ${url}`));
    img.src = url;
  });
}

/** Prefer same-origin bundled logo; fall back to Azure public URL. */
async function loadLogoDataUrl() {
  const sources = [
    { url: `${window.location.origin}/sniper_logo_transparent.png`, crossOrigin: false },
    { url: getSniperLogoUrl(), crossOrigin: true },
  ];

  for (const { url, crossOrigin } of sources) {
    try {
      const res = await fetch(url, crossOrigin ? { mode: "cors" } : {});
      if (res.ok) {
        return blobToDataUrl(await res.blob());
      }
    } catch {
      /* try image element */
    }
    try {
      const img = await loadImageElement(url, crossOrigin);
      return imageElementToDataUrl(img);
    } catch {
      /* next source */
    }
  }
  throw new Error("logo load failed");
}

function addPageFooters(doc) {
  const pageCount = doc.internal.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const footerY = doc.internal.pageSize.getHeight() - 8;

  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    doc.setFont(PDF_FONT, "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, footerY, { align: "center" });
  }
}

export function downloadCsvReport({ rows, summary, filename = "sniper-report.csv" }) {
  const lines = [
    ["Sniper Assist — Transaction Report"],
    [`Period: ${summary.fromDate || "—"} to ${summary.toDate || "—"}`],
    [`Generated: ${new Date().toLocaleString("en-IN")}`],
    [],
    ["Date & time", "Type", "Category", "Notes", "Mode", "Amount"],
    ...rows.map((r) => [
      formatLocalDateTime(r.date),
      formatReportTypeForExcel(r),
      r.category,
      r.notes,
      r.mode,
      r.type === "Expense" ? -Math.abs(r.amount) : r.amount,
    ]),
    [],
    ["Total deposits", "", "", "", "", summary.totalDeposits],
    ["Total expenses", "", "", "", "", summary.totalExpenses],
    ["Net", "", "", "", "", summary.net],
  ];
  const csv = lines.map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function buildPdfDocument(reportData) {
  const { rows, summary } = reportData;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  await registerPdfFonts(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = 18;

  try {
    const logoData = await loadLogoDataUrl();
    const format = logoData.startsWith("data:image/jpeg") ? "JPEG" : "PNG";
    const props = doc.getImageProperties(logoData);
    const logoH = 14;
    const logoW = (props.width / props.height) * logoH;
    doc.addImage(logoData, format, (pageWidth - logoW) / 2, y, logoW, logoH);
    y += logoH + 8;
  } catch {
    y += 2;
  }

  doc.setFont(PDF_FONT, "bold");
  doc.setFontSize(14);
  doc.setTextColor(26, 26, 26);
  doc.text("Sniper Hom Care LLP.", pageWidth / 2, y, { align: "center" });
  y += 7;

  doc.setFont(PDF_FONT, "normal");
  doc.setFontSize(12);
  doc.setTextColor(102, 102, 102);
  const title = formatPdfReportTitle(summary);
  const titleLines = doc.splitTextToSize(title, pageWidth - PDF_SIDE_MARGIN_MM * 2);
  doc.text(titleLines, pageWidth / 2, y, { align: "center" });
  y += titleLines.length * 5.5 + 8;
  doc.setTextColor(0, 0, 0);

  const body = rows.map((r) => {
    const amtStr =
      r.type === "Expense"
        ? `-${formatPdfAmount(r.amount)}`
        : formatPdfAmount(r.amount);
    return [
      formatLocalDateTime(r.date),
      formatReportTypeForPdf(r),
      r.category,
      String(r.notes || "—"),
      r.mode || "—",
      amtStr,
    ];
  });

  const contentWidth = pageWidth - PDF_SIDE_MARGIN_MM * 2;

  autoTable(doc, {
    startY: y,
    tableWidth: contentWidth,
    head: [["Date & time", "Type", "Category", "Notes", "Mode", "Amount"]],
    body: body.length ? body : [["No transactions", "", "", "", "", ""]],
    theme: "plain",
    headStyles: {
      font: PDF_FONT,
      fillColor: [245, 243, 255],
      textColor: [91, 75, 183],
      fontStyle: "bold",
      lineWidth: { bottom: 0.4 },
      valign: "middle",
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
    },
    styles: {
      font: PDF_FONT,
      fontSize: 8,
      cellPadding: { top: 2, right: 2, bottom: 2, left: 2 },
      overflow: "linebreak",
      valign: "top",
    },
    columnStyles: buildPdfColumnStyles(contentWidth),
    margin: PDF_TABLE_MARGIN,
    showHead: "everyPage",
  });

  let finalY = doc.lastAutoTable.finalY + 10;
  const tableLeft = PDF_SIDE_MARGIN_MM;
  const tableRight = pageWidth - PDF_SIDE_MARGIN_MM;
  const rightX = tableRight;
  const labelX = tableLeft + contentWidth * 0.68;

  if (finalY > pageHeight - FOOTER_MARGIN_MM - 20) {
    doc.addPage();
    finalY = 20;
  }

  doc.setFontSize(10);
  const totals = [
    ["Total deposits", formatPdfAmount(summary.totalDeposits), [21, 128, 61]],
    ["Total expenses", formatPdfAmount(summary.totalExpenses), [185, 28, 28]],
    ["Net", formatPdfAmount(summary.net), [26, 26, 26]],
  ];
  for (const [label, value, color] of totals) {
    doc.setTextColor(102, 102, 102);
    doc.setFont(PDF_FONT, "normal");
    doc.text(label, labelX, finalY);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.setFont(PDF_FONT, "bold");
    doc.text(value, rightX, finalY, { align: "right" });
    finalY += 6;
  }

  addPageFooters(doc);
  return doc;
}

/** Blob URL for in-app PDF preview; caller must revoke when done. */
export async function createPdfPreviewUrl(reportData) {
  const doc = await buildPdfDocument(reportData);
  const blob = doc.output("blob");
  return URL.createObjectURL(blob);
}

export async function downloadPdfReport(
  reportData,
  filename = buildFundReportFilename(reportData?.summary, "pdf"),
) {
  const doc = await buildPdfDocument(reportData);
  doc.save(filename);
}
