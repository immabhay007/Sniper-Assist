import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { reportService } from "@/services/reportService";
import { categoryService } from "@/services/categoryService";
import { formatDate, formatLocalDateTime } from "@/utils/formatDate";
import { tableCellWrapClass } from "@/utils/datetime";
import {
  downloadCsvReport,
  downloadPdfReport,
  createPdfPreviewUrl,
  formatPdfAmount,
  formatReportTypeForExcel,
} from "@/utils/reportExport";
import { getApiErrorMessage } from "@/utils/apiError";
import { toast } from "@/utils/toast";
import PdfViewer from "@/components/common/PdfViewer";
import CategoryIcon from "@/components/categories/CategoryIcon";
import { HiOutlineDocumentDownload } from "react-icons/hi";
import { useAuth } from "@/context/AuthContext";
import { useFilteredRows } from "@/hooks/useFilteredRows";
import { REPORT_ROW_SEARCH_FIELDS } from "@/utils/pageSearchFilter";
import { usePageSearchQuery } from "@/context/PageSearchContext";

function toLocalIsoDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function currentMonthStartIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function currentMonthEndIso() {
  const d = new Date();
  return toLocalIsoDate(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export default function Reports() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [format, setFormat] = useState("pdf");
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [report, setReport] = useState(null);

  const [fromDate, setFromDate] = useState(currentMonthStartIso);
  const [toDate, setToDate] = useState(currentMonthEndIso);
  const [includeDeposits, setIncludeDeposits] = useState(true);
  const [includeExpenses, setIncludeExpenses] = useState(true);
  const [selectedCats, setSelectedCats] = useState([]);

  useEffect(() => {
    categoryService.list({ activeOnly: false }).then((cats) => {
      setCategories(cats);
      setSelectedCats(cats.map((c) => c.id));
    });
  }, []);

  const allSelected = categories.length > 0 && selectedCats.length === categories.length;

  const toggleAllCategories = () => {
    setSelectedCats(allSelected ? [] : categories.map((c) => c.id));
  };

  const toggleCategory = (id) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const data = await reportService.generateReport({
        fromDate,
        toDate,
        includeDeposits,
        includeExpenses,
        categoryIds: allSelected ? [] : selectedCats,
      });
      setReport(data);
      setApplied(true);
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to generate report"));
      setReport(null);
      setApplied(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (categories.length) applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, [categories.length]);

  const download = async (type) => {
    if (!report || downloading) return;
    const stamp = `${fromDate || "all"}_${toDate || "all"}`;
    setDownloading(true);
    try {
      if (type === "PDF") {
        await downloadPdfReport(report);
        await reportService.logDownload({
          report_type: "PDF",
          month_year: stamp,
          downloaded_by: user?.id,
        });
      } else {
        downloadCsvReport({
          rows: report.rows,
          summary: report.summary,
          filename: `sniper-report-${stamp}.csv`,
        });
        await reportService.logDownload({
          report_type: "Excel",
          month_year: stamp,
          downloaded_by: user?.id,
        });
      }
    } finally {
      setDownloading(false);
    }
  };

  const pageSearchQuery = usePageSearchQuery();
  const filteredReportRows = useFilteredRows(report?.rows ?? [], REPORT_ROW_SEARCH_FIELDS);
  const displayReport = useMemo(() => {
    if (!report) return null;
    if (!pageSearchQuery.trim()) return report;
    return { ...report, rows: filteredReportRows };
  }, [report, filteredReportRows, pageSearchQuery]);

  const previewTitle = useMemo(() => {
    if (!report) return "Apply filters to generate a report";
    const count = pageSearchQuery.trim() ? filteredReportRows.length : report.summary.count;
    return `${count} transaction${count === 1 ? "" : "s"}`;
  }, [report, filteredReportRows.length, pageSearchQuery]);

  return (
    <DashboardLayout fullBleed title="Reports" subtitle="Filter, preview, and download transaction reports">
      <aside className="w-full lg:w-[280px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-muted/20 p-5 lg:py-6 flex flex-col gap-5 overflow-y-auto">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground">
                Date range
              </h3>
              <button
                type="button"
                onClick={applyFilters}
                disabled={loading || (!includeDeposits && !includeExpenses)}
                className="sniper-btn sniper-btn-primary !py-1.5 !px-3 text-xs shrink-0 disabled:opacity-50"
              >
                {loading ? "Applying…" : "Apply"}
              </button>
            </div>
            <div className="space-y-3">
              <label className="block">
                <span className="text-[13px] font-medium mb-1.5 block">From date</span>
                <input
                  type="date"
                  className="sniper-input w-full"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-[13px] font-medium mb-1.5 block">To date</span>
                <input
                  type="date"
                  className="sniper-input w-full"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Transaction type
            </h3>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDeposits}
                  onChange={(e) => setIncludeDeposits(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Deposits
              </label>
              <label className="flex items-center gap-2.5 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeExpenses}
                  onChange={(e) => setIncludeExpenses(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Expenses
              </label>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col">
            <h3 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">
              Categories
            </h3>
            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 pr-1">
              <label className="flex items-center gap-2.5 text-sm font-medium cursor-pointer pb-1 border-b border-border">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAllCategories}
                  className="rounded border-border text-primary focus:ring-primary"
                />
                ALL
              </label>
              {categories.map((c) => (
                <label key={c.id} className="flex items-center gap-2.5 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCats.includes(c.id)}
                    onChange={() => toggleCategory(c.id)}
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  <span
                    className="flex items-center justify-center size-6 rounded-full shrink-0"
                    style={{ background: `${c.color_code}22`, color: c.color_code }}
                  >
                    <CategoryIcon iconKey={c.icon} className="size-3.5" />
                  </span>
                  <span className="truncate">{c.short}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={applyFilters}
            disabled={loading || (!includeDeposits && !includeExpenses)}
            className="sniper-btn sniper-btn-primary w-full !py-2.5 mt-auto disabled:opacity-50"
          >
            {loading ? "Applying…" : "Apply"}
          </button>
      </aside>

      <section className="flex-1 flex flex-col min-w-0 min-h-0 bg-background">
        <div className="flex items-center border-b border-border px-4 sm:px-6 h-12 shrink-0">
            <div className="inline-flex rounded-lg bg-muted p-0.5">
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                  format === "pdf"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                PDF
              </button>
              <span className="w-px bg-border self-stretch my-1" aria-hidden />
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${
                  format === "excel"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Excel
              </button>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden sm:inline">{previewTitle}</span>
              <button
                type="button"
                onClick={() => download(format === "pdf" ? "PDF" : "Excel")}
                disabled={!applied || !report?.rows?.length || downloading}
                className="sniper-btn !py-1.5 !px-3 text-sm disabled:opacity-50"
              >
                <HiOutlineDocumentDownload className="size-4" />
                {downloading ? "Downloading…" : `Download ${format === "pdf" ? "PDF" : "Excel"}`}
              </button>
            </div>
          </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {!applied || !report ? (
            <div className="h-full min-h-[400px] grid place-items-center text-sm text-muted-foreground">
              Select filters and click Apply to preview your report.
            </div>
          ) : format === "pdf" ? (
            <PdfPreview report={displayReport} />
          ) : (
            <ExcelPreview report={displayReport} />
          )}
        </div>
      </section>
    </DashboardLayout>
  );
}

function PdfPreview({ report }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewFailed, setPreviewFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    setLoading(true);
    setPreviewFailed(false);
    setPdfUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });

    createPdfPreviewUrl(report)
      .then((url) => {
        if (cancelled) {
          URL.revokeObjectURL(url);
          return;
        }
        setPdfUrl(url);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          toast.error("Failed to generate PDF preview.");
          setPreviewFailed(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
      setPdfUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [report]);

  if (loading) {
    return (
      <div className="h-[min(75vh,720px)] min-h-[480px] grid place-items-center text-sm text-muted-foreground">
        Generating PDF preview…
      </div>
    );
  }

  if (previewFailed) {
    return (
      <div className="h-[min(75vh,720px)] min-h-[480px] grid place-items-center text-sm text-muted-foreground">
        PDF preview could not be generated.
      </div>
    );
  }

  return (
    <article className="w-full max-w-none">
      <PdfViewer src={pdfUrl} title="Sniper transaction report" />
    </article>
  );
}

function ExcelPreview({ report }) {
  const { rows, summary } = report;
  return (
    <article className="w-full overflow-x-auto">
      <p className="text-xs text-muted-foreground mb-3">Sniper_Report.xlsx — preview</p>
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-[13px] border-collapse font-sans">
          <thead>
            <tr>
              {["Date & time", "Type", "Category", "Notes", "Mode", "Amount"].map((h) => (
                <th
                  key={h}
                  className="border border-[#d4d4d4] bg-[#e8f5e9] px-3 py-2 text-left font-semibold text-[#1b5e20] whitespace-nowrap"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="border border-[#d4d4d4] px-3 py-8 text-center text-muted-foreground">
                  No transactions
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#fafafa]"}>
                  <td className={`border border-[#d4d4d4] px-3 py-1.5 ${tableCellWrapClass}`}>{formatLocalDateTime(r.date)}</td>
                  <td className="border border-[#d4d4d4] px-3 py-1.5 whitespace-pre-line">
                    {formatReportTypeForExcel(r)}
                  </td>
                  <td className="border border-[#d4d4d4] px-3 py-1.5">{r.category}</td>
                  <td className="border border-[#d4d4d4] px-3 py-1.5 break-words align-top">{r.notes || "—"}</td>
                  <td className="border border-[#d4d4d4] px-3 py-1.5 break-words align-top">{r.mode || "—"}</td>
                  <td className={`border border-[#d4d4d4] px-3 py-1.5 text-right tabular-nums font-medium align-top ${r.type === "Expense" ? "text-[#b91c1c]" : "text-[#15803d]"}`}>
                    {r.type === "Expense" ? "-" : ""}{formatPdfAmount(r.amount)}
                  </td>
                </tr>
              ))
            )}
            <tr className="bg-[#fff9e6] font-semibold">
              <td colSpan={5} className="border border-[#d4d4d4] px-3 py-2 text-right">Total deposits</td>
              <td className="border border-[#d4d4d4] px-3 py-2 text-right tabular-nums text-[#15803d]">{formatPdfAmount(summary.totalDeposits)}</td>
            </tr>
            <tr className="bg-[#fff9e6] font-semibold">
              <td colSpan={5} className="border border-[#d4d4d4] px-3 py-2 text-right">Total expenses</td>
              <td className="border border-[#d4d4d4] px-3 py-2 text-right tabular-nums text-[#b91c1c]">{formatPdfAmount(summary.totalExpenses)}</td>
            </tr>
            <tr className="bg-[#e3f2fd] font-bold">
              <td colSpan={5} className="border border-[#d4d4d4] px-3 py-2 text-right">Net</td>
              <td className="border border-[#d4d4d4] px-3 py-2 text-right tabular-nums">{formatPdfAmount(summary.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  );
}
