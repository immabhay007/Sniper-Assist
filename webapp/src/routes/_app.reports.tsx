import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { formatLocalDateTime } from "@/utils/formatDate";
import { reportService } from "@/services/reportService";
import { calculateSlaStatus } from "@/utils/slaUtils";
import {
  Download,
  Home,
  Utensils,
  Wifi,
  Briefcase,
  Car,
  Zap,
  ShoppingBag,
  Heart,
  Menu,
  Minus,
  Plus,
  RotateCw,
  Pencil,
  Undo2,
  Redo2,
  FileDown,
  Printer,
  MoreVertical,
  PanelTop,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx-js-style";
import { toast } from "@/utils/toast";
import { isAxiosError } from "axios";

export const Route = createFileRoute("/_app/reports")({
  component: ReportsPage,
});

const TX_TYPES = ["Enquiry", "Complaint"] as const;

type Enquiry = {
  ticket_no: string;
  customer_name: string;
  category_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_at: string;
  created_at_name: string;
  status: number;
  status_name: string;
  sla_deadline: string;
  sla_status: string | null;
  enquiry_details: string;
};

type Complaint = {
  ticket_no: string;
  customer_name: string;
  category_name: string;
  assigned_to: number | null;
  assigned_to_name: string | null;
  created_at: string;
  created_at_name: string;
  status: number;
  status_name: string;
  sla_deadline: string;
  sla_status: string | null;
  complaint_details: string;
  priority?: string;
};

type Row = {
  date: string;
  type: "Expense" | "Deposit";
  category: string;
  notes: string;
  mode: "Cash" | "UPI" | "Card";
  amount: number;
};

// Unified error handler – shows one toast with the appropriate message
const handleApiError = (error: unknown, defaultMessage: string) => {
  if (isAxiosError(error) && error.response?.status === 403) {
    const detail = (error.response.data as { detail?: string })?.detail || "You don't have permission to perform this action.";
    toast.error(detail);
  } else {
    toast.error(defaultMessage);
  }
};

const loadImageAsBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject("Canvas context not available");
        return;
      }

      ctx.drawImage(img, 0, 0);

      resolve(canvas.toDataURL("image/png"));
    };

    img.onerror = reject;
    img.src = url;
  });
};

async function generatePDF(
  enquiries: Enquiry[],
  complaints: Complaint[],
  reportTitle: string,
  dateRange: string
): Promise<Blob> {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const logoBase64 = await loadImageAsBase64(
        "https://sniperpublicstorage.blob.core.windows.net/sniperlogo/sniper_logo_transparent.png"
      );

    doc.addImage(
      logoBase64,
      "PNG",
      pageWidth / 2 - 15,
      8,
      30,
      15
    );
  } catch (err) {
    console.error("Failed to load logo", err);
  }
  // ----- Header (centered) -----
  doc.setFontSize(16);
  doc.text("Sniper Assist.", pageWidth / 2, 30, { align: "center" });
  doc.text(reportTitle, pageWidth / 2, 40, { align: "center" });
  doc.text(dateRange, pageWidth / 2, 47, { align: "center" });

  let yPos = 55;

  const renderTable = (title: string, data: any[], isEnquiry: boolean) => {
    if (data.length === 0) return;

    // Table title
    doc.setFontSize(11);
    doc.text(title, 14, yPos);
    yPos += 5;

    const headers = [
      "Ticket ID",
      "Category",
      "Customer",
      "Assigned To",
      "Created By",
      "Created At",
      "SLA Status",
      "SLA Deadline",
      "Description",
      "Status",
    ];

    const rows = data.map((item) => [
      item.ticket_no,
      item.category_name,
      item.customer_name,
      item.assigned_to_name || "-",
      item.created_at_name || "-",
      formatLocalDateTime(item.created_at),
      item.sla_status || "-",
      formatLocalDateTime(item.sla_deadline),
      isEnquiry ? item.enquiry_details : item.complaint_details,
      item.status_name,
    ]);

    autoTable(doc, {
  startY: yPos,

  head: [headers],
  body: rows,

  theme: "striped",

  styles: {
    fontSize: 5, // Smaller body text
    cellPadding: 0.5,
    halign: "center",
    valign: "middle",
    lineColor: [200, 200, 200],
    lineWidth: 0.1,
    overflow: "linebreak",
  },

  headStyles: {
    fillColor: [41, 128, 185],
    textColor: 255,
    fontSize: 6, // Slightly larger header
    halign: "center",
    valign: "middle",
    fontStyle: "bold",
  },

  margin: {
    left: 10,
    right: 10,
    top: 5,
    bottom: 5,
  },

  tableWidth: "auto",

  columnStyles: {
    0: { cellWidth: 14 }, // Ticket ID
    1: { cellWidth: 18 }, // Category
    2: { cellWidth: 20 }, // Customer
    3: { cellWidth: 20 }, // Assigned To
    4: { cellWidth: 20 }, // Created By
    5: { cellWidth: 22 }, // Created At
    6: { cellWidth: 16 }, // SLA Status
    7: { cellWidth: 22 }, // SLA Deadline
    8: { cellWidth: 28 }, // Description
    9: { cellWidth: 16 }, // Status
  },

  didDrawPage: (data) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFontSize(8);
    doc.text(
      `Page ${data.pageNumber}`,
      pageWidth - 25,
      pageHeight - 5
    );
  },
});

    yPos = (doc as any).lastAutoTable.finalY + 8;
  };

  renderTable("Enquiries", enquiries, true);
  renderTable("Complaints", complaints, false);

  if (enquiries.length === 0 && complaints.length === 0) {
    doc.setFontSize(10);
    doc.text("No records found.", 14, yPos);
  }

  return doc.output("blob");
}

// ----------------------------------------------------------------
// Excel Generator
// ----------------------------------------------------------------
function generateExcel(
  enquiries: Enquiry[],
  complaints: Complaint[],
  reportTitle: string,
  dateRange: string
): Blob {
  const wb = XLSX.utils.book_new();

  const createReportSheet = (
    data: any[],
    sheetName: string,
    reportTitle: string,
    dateRange: string
  ) => {
    const headers = [
      "Ticket ID",
      "Category",
      "Customer",
      "Assigned To",
      "Created By",
      "Created At",
      "SLA Status",
      "SLA Deadline",
      "Description",
      "Status",
    ];

    const rows = data.map((item) => [
      item["Ticket ID"],
      item["Category"],
      item["Customer"],
      item["Assigned To"],
      item["Created By"],
      item["Created At"],
      item["SLA Status"],
      item["SLA Deadline"],
      item["Description"],
      item["Status"],
    ]);

    const ws = XLSX.utils.aoa_to_sheet([
      ["Sniper Assist"],
      [reportTitle],
      [dateRange],
      [],
      headers,
      ...rows,
    ]);

    // Merge title rows
    ws["!merges"] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } },
    ];

    // Column widths
    ws["!cols"] = [
  { wch: 12 }, // Ticket ID
  { wch: 15 }, // Category
  { wch: 18 }, // Customer
  { wch: 15 }, // Assigned To
  { wch: 15 }, // Created By
  { wch: 18 }, // Created At
  { wch: 12 }, // SLA Status
  { wch: 18 }, // SLA Deadline
  { wch: 30 }, // Description
  { wch: 12 }, // Status
];

    // Print settings - Fit all columns to page width
    ws["!pageSetup"] = {
      paperSize: 9, // A4
      orientation: "landscape",
      fitToWidth: 1,
      fitToHeight: 0, // unlimited rows
      scale: 100,
    };

    ws["!margins"] = {
      left: 0.25,
      right: 0.25,
      top: 0.5,
      bottom: 0.5,
      header: 0.3,
      footer: 0.3,
    };

    // Row heights
    ws["!rows"] = [
      { hpt: 30 },
      { hpt: 24 },
      { hpt: 20 },
    ];

    // Styles
    const titleStyle = {
      font: {
        bold: true,
        sz: 22,
        color: { rgb: "1F1F1F" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    const reportStyle = {
      font: {
        bold: true,
        sz: 16,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    const dateStyle = {
      font: {
        italic: true,
        sz: 12,
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
    };

    const headerStyle = {
      font: {
        bold: true,
        color: { rgb: "FFFFFF" },
      },
      fill: {
        fgColor: { rgb: "1F4E78" },
      },
      alignment: {
        horizontal: "center",
        vertical: "center",
      },
      border: {
        top: { style: "thin", color: { rgb: "000000" } },
        bottom: { style: "thin", color: { rgb: "000000" } },
        left: { style: "thin", color: { rgb: "000000" } },
        right: { style: "thin", color: { rgb: "000000" } },
      },
    };

    ws["A1"].s = titleStyle;
    ws["A2"].s = reportStyle;
    ws["A3"].s = dateStyle;

    // Header styling
    headers.forEach((_, colIndex) => {
      const cellRef = XLSX.utils.encode_cell({
        r: 4,
        c: colIndex,
      });

      if (ws[cellRef]) {
        ws[cellRef].s = headerStyle;
      }
    });

    // Data row borders
    for (let row = 5; row < rows.length + 5; row++) {
      for (let col = 0; col < headers.length; col++) {
        const cellRef = XLSX.utils.encode_cell({
          r: row,
          c: col,
        });

        if (ws[cellRef]) {
          ws[cellRef].s = {
            border: {
              top: { style: "thin", color: { rgb: "D9D9D9" } },
              bottom: { style: "thin", color: { rgb: "D9D9D9" } },
              left: { style: "thin", color: { rgb: "D9D9D9" } },
              right: { style: "thin", color: { rgb: "D9D9D9" } },
            },
            alignment: {
              vertical: "top",
              wrapText: true,
            },
          };
        }
      }
    }

    return ws;
  };

  // Enquiry Sheet
  if (enquiries.length > 0) {
    const enquiryRows = enquiries.map((item) => ({
      "Ticket ID": item.ticket_no,
      Category: item.category_name,
      Customer: item.customer_name,
      "Assigned To": item.assigned_to_name || "-",
      "Created By": item.created_at_name || "-",
      "Created At": formatLocalDateTime(item.created_at),
      "SLA Status": item.sla_status || "-",
      "SLA Deadline": formatLocalDateTime(item.sla_deadline),
      Description: item.enquiry_details,
      Status: item.status_name,
    }));

    const ws = createReportSheet(
      enquiryRows,
      "Enquiries",
      "Enquiry Report",
      dateRange
    );

    XLSX.utils.book_append_sheet(wb, ws, "Enquiries");
  }

  // Complaint Sheet
  if (complaints.length > 0) {
    const complaintRows = complaints.map((item) => ({
      "Ticket ID": item.ticket_no,
      Category: item.category_name,
      Customer: item.customer_name,
      "Assigned To": item.assigned_to_name || "-",
      "Created By": item.created_at_name || "-",
      "Created At": formatLocalDateTime(item.created_at),
      "SLA Status": item.sla_status || "-",
      "SLA Deadline": formatLocalDateTime(item.sla_deadline),
      Description: item.complaint_details,
      Status: item.status_name,
    }));

    const ws = createReportSheet(
      complaintRows,
      "Complaints",
      "Complaint Report",
      dateRange
    );

    XLSX.utils.book_append_sheet(wb, ws, "Complaints");
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([["No records found"]]);
    XLSX.utils.book_append_sheet(wb, ws, "Report");
  }

  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });

  return new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

function ReportsPage() {
  const [types, setTypes] = useState<string[]>([...TX_TYPES]);
  const [format, setFormat] = useState<"PDF" | "Excel">("PDF");
  const [zoom, setZoom] = useState(65);
  const [page] = useState(1);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [downloading, setDownloading] = useState(false);

  // Ref to prevent duplicate API calls (strict mode double mount)
  const isFetching = useRef(false);

  // Helper: format Date to YYYY-MM-DD in local time
  const formatLocalDate = (date: Date): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Get current month's first and last day in local time
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const firstDay = new Date(y, m, 1);
  const lastDay = new Date(y, m + 1, 0);

  const [from, setFrom] = useState(formatLocalDate(firstDay));
  const [to, setTo] = useState(formatLocalDate(lastDay));

  // Load initial data on mount
  useEffect(() => {
    void fetchReports();
  }, []);

  // Helper to format date to "d Month YYYY"
  const formatDateRange = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownload = async () => {
    try {
      setDownloading(true);

      const typeLabel =
        types.length === 2
          ? "Enquiries & Complaints"
          : types.includes("Enquiry")
          ? "Enquiries"
          : "Complaints";
      const reportTitle = `${typeLabel} Report`;
      const dateRange = `${formatDateRange(from)} to ${formatDateRange(to)}`;

      let blob: Blob;
      if (format === "PDF") {
        blob = await generatePDF(enquiries, complaints, reportTitle, dateRange);
      } else {
        blob = generateExcel(enquiries, complaints, reportTitle, dateRange);
      }

      // Trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const extension = format === "Excel" ? "xlsx" : "pdf";
      link.download = `report_${from}_to_${to}.${extension}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed", error);
      handleApiError(error, "Failed to generate report.");
    } finally {
      setDownloading(false);
    }
  };

  const getReportType = () => {
    if (types.length === 2) return "Enquiries & Complaints Report";
    if (types.includes("Enquiry")) return "Enquiries Report";
    if (types.includes("Complaint")) return "Complaints Report";
    return "Enquiries & Complaints Report";
  };

  const fromStr = formatDateRange(from);
  const toStr = formatDateRange(to);
  const dateRangeStr = `${fromStr} to ${toStr}`;
  const reportType = getReportType();

  const getReportTitle = () => {
    const fromStr = formatDateRange(from);
    const toStr = formatDateRange(to);
    let typeLabel = "";
    if (types.length === 2) typeLabel = "Enquiries & Complaints";
    else if (types.includes("Enquiry")) typeLabel = "Enquiries";
    else if (types.includes("Complaint")) typeLabel = "Complaints";
    else typeLabel = "Enquiries & Complaints";
    return `${typeLabel} Report: ${fromStr} to ${toStr}`;
  };

  const fetchReports = async (params?: {
    fromDate: string;
    toDate: string;
    type: string;
  }) => {
    // Prevent concurrent calls
    if (isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    setError(null);

    try {
      const response = await reportService.getReports({
        fromDate: params?.fromDate ?? from,
        toDate: params?.toDate ?? to,
        type: params?.type ?? "both",
      });

      const data = response?.data ?? response;
      setEnquiries(data?.enquiries ?? []);
      setComplaints(data?.complaints ?? []);
    } catch (error) {
      console.error("Failed to fetch reports", error);
      const defaultMsg = "Failed to fetch reports.";
      handleApiError(error, defaultMsg);
      setError(defaultMsg);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  const handleApply = () => {
    const typeParam =
      types.length === TX_TYPES.length ? "both" : types.join(",");

    fetchReports({
      fromDate: from,
      toDate: to,
      type: typeParam,
    });
  };

  const toggle = (arr: string[], v: string, setter: (a: string[]) => void) =>
    setter(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="grid min-h-screen grid-cols-1 gap-5 items-stretch lg:grid-cols-[320px_1fr]">
      {/* ============ FILTER PANEL ============ */}
      <aside className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Date range
          </span>
          <button
            onClick={handleApply}
            className="rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90"
          >
            Apply
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium">From date</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">To date</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div>
            <h4 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Type
            </h4>
            <div className="space-y-2.5">
              {TX_TYPES.map((t) => (
                <label key={t} className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    checked={types.includes(t)}
                    onChange={() => toggle(types, t, setTypes)}
                    className="h-4 w-4 rounded accent-primary"
                  />
                  {t}
                </label>
              ))}
            </div>
          </div>

          <div>
            {/* Categories section removed – kept as per original */}
          </div>
        </div>

        <div className="mt-auto border-t border-border p-4">
          <button
            onClick={handleApply}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Apply
          </button>
        </div>
      </aside>

      {/* ============ PREVIEW PANEL ============ */}
      <section className="flex h-full flex-col rounded-2xl border border-border bg-card shadow-card">
        {/* Top: format tabs + download */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-1 rounded-full bg-muted/60 p-1">
            {(["PDF", "Excel"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFormat(f)}
                className={`rounded-full px-5 py-1.5 text-xs font-semibold transition ${
                  format === f
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium text-muted-foreground">
              {enquiries.length + complaints.length} transactions
            </span>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {downloading ? (
                <RotateCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )}
              {downloading ? "Generating..." : `Download ${format}`}
            </button>
          </div>
        </div>

        {/* PDF viewer */}
        <div className="p-5 flex-1 overflow-hidden">
          {format === "PDF" ? (
            <div className="overflow-hidden rounded-xl border border-border bg-neutral-800 shadow-card">
              {/* Dark toolbar */}
              <div className="flex items-center gap-2 bg-neutral-800 px-3 py-2 text-neutral-300">
                <ToolbarBtn><Menu className="h-4 w-4" /></ToolbarBtn>
                <span className="ml-1 truncate text-sm font-medium text-white">
                  ae9ab0f2-e498-48…
                </span>

                <div className="mx-auto flex items-center gap-1.5">
                  <span className="rounded bg-neutral-700 px-2 py-0.5 text-xs font-semibold text-white">
                    {page}
                  </span>

                  <span className="text-xs text-neutral-400">/ 8</span>

                  <ToolbarBtn onClick={() => setZoom((z) => Math.max(25, z - 10))}>
                    <Minus className="h-4 w-4" />
                  </ToolbarBtn>

                  <span className="rounded bg-neutral-700 px-2 py-0.5 text-xs font-semibold text-white">
                    {zoom}%
                  </span>

                  <ToolbarBtn onClick={() => setZoom((z) => Math.min(200, z + 10))}>
                    <Plus className="h-4 w-4" />
                  </ToolbarBtn>

                  <ToolbarBtn><PanelTop className="h-4 w-4" /></ToolbarBtn>
                  <ToolbarBtn><RotateCw className="h-4 w-4" /></ToolbarBtn>
                  <ToolbarBtn><Pencil className="h-4 w-4" /></ToolbarBtn>
                  <ToolbarBtn><Undo2 className="h-4 w-4" /></ToolbarBtn>
                  <ToolbarBtn><Redo2 className="h-4 w-4" /></ToolbarBtn>
                </div>

                <ToolbarBtn><FileDown className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn><Download className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn><Printer className="h-4 w-4" /></ToolbarBtn>
                <ToolbarBtn><MoreVertical className="h-4 w-4" /></ToolbarBtn>
              </div>

              {/* PDF Layout */}
              <div className="flex bg-neutral-700/40" style={{ height: 560 }}>
                <div className="w-44 shrink-0 overflow-y-auto border-r border-neutral-700 bg-neutral-800/60 px-3 py-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div key={n} className="mb-4 flex flex-col items-center">
                      <div
                        className={`w-full overflow-hidden rounded bg-white shadow-md ${
                          n === 1 ? "ring-2 ring-sky-400" : ""
                        }`}
                      >
                        <ThumbDoc />
                      </div>
                      <span className="mt-1.5 text-[11px] text-neutral-300">{n}</span>
                    </div>
                  ))}
                </div>

                <div className="flex-1 overflow-y-auto bg-neutral-700/30 px-6 py-6">
                  <div
                    className="mx-auto bg-white shadow-2xl"
                    style={{
                      width: `${Math.min(100, zoom + 25)}%`,
                      maxWidth: 720,
                    }}
                  >
                    <ReportPaper
                      rows={rows}
                      reportType={reportType}
                      dateRange={dateRangeStr}
                      enquiries={enquiries}
                      complaints={complaints}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Excel Layout - Full Width */
            <div className="h-full overflow-auto rounded-xl border border-border bg-white">
              <ExcelPreview
                reportType={reportType}
                dateRange={dateRangeStr}
                enquiries={enquiries}
                complaints={complaints}
              />
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function ToolbarBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
    >
      {children}
    </button>
  );
}

function ThumbDoc() {
  return (
    <div className="aspect-[3/4] w-full p-2">
      <div className="mb-1 text-center text-[6px] font-bold text-primary" style={{ fontFamily: "Georgia, serif" }}>
        Sniper.
      </div>
      <div className="mb-1 text-center text-[4px] font-semibold text-neutral-800">Sniper Assist LLP.</div>
      <div className="mb-1 text-center text-[3px] text-neutral-500">Sniper Report</div>
      <div className="space-y-[2px]">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="flex gap-[2px]">
            <div className="h-[2px] flex-1 bg-neutral-200" />
            <div className="h-[2px] w-3 bg-neutral-200" />
            <div className="h-[2px] w-3 bg-neutral-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportPaper({ rows, reportType, dateRange, enquiries, complaints }: { rows: Row[]; reportType: string; dateRange: string; enquiries: Enquiry[]; complaints: Complaint[]; }) {
  
  const renderTable = (title: string, data: any[], isEnquiry: boolean) => {
    if (data.length === 0) return null;

    const getSlaBadge = (status?: string | null) => {
      switch (status) {
        case "Breached":
          return (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
              Breached
            </span>
          );
        case "Approaching":
          return (
            <span className="inline-flex items-center rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700">
              Approaching
            </span>
          );
        case "On Track":
          return (
            <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
              On Track
            </span>
          );
        default:
          return "-";
      }
    };

    return (
      <>
        <h3 className="mt-4 text-left text-xs font-semibold text-neutral-800">{title}</h3>
        <table className="w-full table-auto text-[10px]">
          <thead>
            <tr className="border-y border-neutral-200 text-left text-neutral-500">
              <th className="px-0.5 py-1 font-semibold">Ticket ID</th>
              <th className="px-0.5 py-1 font-semibold">Category</th>
              <th className="px-0.5 py-1 font-semibold">Customer</th>
              <th className="px-0.5 py-1 font-semibold">Assigned To</th>
              <th className="px-0.5 py-1 font-semibold">Created By</th>
              <th className="px-0.5 py-1 font-semibold">Created At</th>
              <th className="px-0.5 py-1 font-semibold">SLA Status</th>
              <th className="px-0.5 py-1 font-semibold">SLA Deadline</th>
              <th className="px-0.5 py-1 font-semibold">Description</th>
              <th className="px-0.5 py-1 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((item, idx) => (
              <tr key={idx} className="border-b border-neutral-100 align-top">
                <td className="px-0.5 py-1 text-neutral-500">{item.ticket_no}</td>
                <td className="px-0.5 py-1 text-neutral-800">{item.category_name}</td>
                <td className="px-0.5 py-1 text-neutral-800">{item.customer_name}</td>
                <td className="px-0.5 py-1 text-neutral-800">{item.assigned_to_name || "-"}</td>
                <td className="px-0.5 py-1 text-neutral-800">{item.created_at_name || "-"}</td>
                <td className="px-0.5 py-1 text-neutral-500">{formatLocalDateTime(item.created_at)}</td>
                <td className="px-3 py-3">
                  {getSlaBadge(calculateSlaStatus(item.sla_deadline, item.created_at))}
                </td>
                <td className="px-0.5 py-1 text-neutral-500">{formatLocalDateTime(item.sla_deadline)}</td>
                <td className="px-0.5 py-1 text-neutral-400">
                  {isEnquiry ? item.enquiry_details : item.complaint_details}
                </td>
                <td className="px-1 py-2.5 text-neutral-800">{item.status_name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </>
    );
  };

  
  return (
    <div className="px-10 py-10">
      <div className="mb-0 flex justify-center">
        <img
          src="https://sniperpublicstorage.blob.core.windows.net/sniperlogo/sniper_logo_transparent.png"
          alt="Sniper"
          className="h-auto w-24 object-contain"
        />
      </div>

      <h2 className="mb-1 text-center text-lg font-bold text-neutral-900">
        Sniper Assist.
      </h2>

      <p className="mb-0 text-center text-sm text-neutral-500">
        {reportType}
      </p>
      <p className="mb-4 text-center text-xs text-neutral-500">
        {dateRange}
      </p>


      {renderTable("Enquiries", enquiries, true)}
      {renderTable("Complaints", complaints, false)}

      {enquiries.length === 0 && complaints.length === 0 && (
        <p className="text-center text-sm text-neutral-400">No records found.</p>
      )}

    </div>
  );
}

function ExcelPreview({
  reportType,
  dateRange,
  enquiries,
  complaints,
}: {
  reportType: string;
  dateRange: string;
  enquiries: Enquiry[];
  complaints: Complaint[];
}) {
  const headers = [
    "Ticket ID",
    "Category",
    "Customer",
    "Assigned To",
    "Created By",
    "Created At",
    "SLA Status",
    "SLA Deadline",
    "Description",
    "Status",
  ];

  const renderRows = (data: any[], isEnquiry: boolean) =>
    data.map((item, idx) => (
      <tr key={idx} className="border-b">
        <td className="border p-2">{item.ticket_no}</td>
        <td className="border p-2">{item.category_name}</td>
        <td className="border p-2">{item.customer_name}</td>
        <td className="border p-2">{item.assigned_to_name || "-"}</td>
        <td className="border p-2">{item.created_at_name || "-"}</td>
        <td className="border p-2">
          {formatLocalDateTime(item.created_at)}
        </td>
        <td className="border p-2">
          {calculateSlaStatus(item.sla_deadline, item.created_at) || "-"}
        </td>
        <td className="border p-2">
          {formatLocalDateTime(item.sla_deadline)}
        </td>
        <td className="border p-2">
          {isEnquiry
            ? item.enquiry_details
            : item.complaint_details}
        </td>
        <td className="border p-2">{item.status_name}</td>
      </tr>
    ));

  return (
    <div className="bg-white p-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">
          Sniper Assist
        </h1>

        <h2 className="text-lg font-semibold mt-2">
          {reportType}
        </h2>

        <p className="text-sm text-gray-500">
          {dateRange}
        </p>
      </div>

      {enquiries.length > 0 && (
        <>
          <div className="mb-2 text-lg font-semibold">
            Enquiries Sheet
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#1F4E78] text-white">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="border p-2 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {renderRows(enquiries, true)}
            </tbody>
          </table>
        </>
      )}

      {complaints.length > 0 && (
        <>
          <div className="mt-10 mb-2 text-lg font-semibold">
            Complaints Sheet
          </div>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-[#1F4E78] text-white">
                {headers.map((h) => (
                  <th
                    key={h}
                    className="border p-2 text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {renderRows(complaints, false)}
            </tbody>
          </table>
        </>
      )}

      {enquiries.length === 0 &&
        complaints.length === 0 && (
          <div className="text-center text-gray-500 py-10">
            No records found
          </div>
        )}
    </div>
  );
}