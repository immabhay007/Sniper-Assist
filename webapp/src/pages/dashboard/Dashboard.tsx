import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import StatCard from "@/components/common/StatCard";
import CategoryIcon from "@/components/categories/CategoryIcon";
import PermissionDeniedNotice from "@/components/common/PermissionDeniedNotice";
import { reportService } from "@/services/reportService";
import { fundService } from "@/services/fundService";
import { expenseService } from "@/services/expenseService";
import { categoryService } from "@/services/categoryService";
import ConstrainedText from "@/components/common/ConstrainedText";
import { formatCurrency, formatCurrencyCompact, isCompactCurrency } from "@/utils/formatCurrency";
import { formatLocalDateTime } from "@/utils/formatDate";
import { getApiErrorMessage } from "@/utils/apiError";
import { parseStoredFiles } from "@/utils/fileAttachments";
import { setAccessPage, clearAccessPage } from "@/utils/accessPage";
import {
  HiOutlineChartPie,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlinePaperClip,
  HiOutlineScale,
  HiOutlineTag,
} from "react-icons/hi";
import { usePageSearch } from "@/context/PageSearchContext";
import { DEPOSIT_SEARCH_FIELDS, EXPENSE_SEARCH_FIELDS, filterRows } from "@/utils/pageSearchFilter";

const SECTION_ICON_CLASS = {
  success: "bg-success/10 text-success",
  danger: "bg-danger/10 text-danger",
  primary: "bg-primary/10 text-primary",
};

function amountTooltip(amount, { showSign = false } = {}) {
  return isCompactCurrency(amount) ? formatCurrency(amount, { showSign }) : undefined;
}

function DashboardSectionTitle({ icon: Icon, title, tone = "primary" }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={`flex items-center justify-center size-9 rounded-lg shrink-0 ${SECTION_ICON_CLASS[tone]}`}>
        <Icon className="size-[18px]" aria-hidden />
      </span>
      <h3 className="text-[15px] font-semibold">{title}</h3>
    </div>
  );
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [byCat, setByCat] = useState([]);
  const [deposits, setDeposits] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    setAccessPage("dashboard");
    return () => clearAccessPage();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setLoadError("");
      const month = new Date().getMonth() + 1;
      const year = new Date().getFullYear();

      try {
        const [b, ex, c, s, txs] = await Promise.all([
          reportService.categoryBreakdown({ month, year }),
          expenseService.list({ month, year }),
          categoryService.list(),
          fundService.summary(),
          fundService.listTransactions({ type: "CREDIT" }),
        ]);
        setByCat(b);
        setExpenses(ex.slice(0, 3));
        setCats(c);
        setSummary(s);
        setDeposits(txs.slice(0, 3));
      } catch (err) {
        setLoadError(getApiErrorMessage(err, "Failed to load dashboard."));
        setByCat([]);
        setExpenses([]);
        setCats([]);
        setSummary(null);
        setDeposits([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const { query: pageSearchQuery, setResultCount } = usePageSearch();
  const catById = (id) => cats.find((c) => c.id === id);
  const filteredDeposits = useMemo(
    () => filterRows(deposits, pageSearchQuery, DEPOSIT_SEARCH_FIELDS),
    [deposits, pageSearchQuery],
  );
  const filteredExpenses = useMemo(
    () => filterRows(expenses, pageSearchQuery, EXPENSE_SEARCH_FIELDS),
    [expenses, pageSearchQuery],
  );
  const filteredByCat = useMemo(
    () =>
      filterRows(byCat, pageSearchQuery, [
        (r) => r.category?.category_name,
        (r) => r.category?.short,
        (r) => r.amount,
        (r) => r.percentLabel,
      ]),
    [byCat, pageSearchQuery],
  );

  useEffect(() => {
    if (!pageSearchQuery.trim()) {
      setResultCount(null);
      return;
    }
    setResultCount(
      filteredDeposits.length + filteredExpenses.length + filteredByCat.length,
    );
  }, [
    filteredDeposits.length,
    filteredExpenses.length,
    filteredByCat.length,
    pageSearchQuery,
    setResultCount,
  ]);

  return (
    <DashboardLayout title="Dashboard" subtitle={new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}>
      {loadError && (
        <div className="mb-4">
          <PermissionDeniedNotice message={loadError} variant="alert" />
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 [&>*]:min-w-0">
        <StatCard
          label="Total deposited"
          value={formatCurrencyCompact(summary?.totalDeposited)}
          valueTooltip={amountTooltip(summary?.totalDeposited)}
          sub={`This month: ${formatCurrencyCompact(summary?.depositedThisMonth)}`}
          subTooltip={
            isCompactCurrency(summary?.depositedThisMonth)
              ? `This month: ${formatCurrency(summary?.depositedThisMonth)}`
              : undefined
          }
          icon={HiOutlineDownload}
          tone="success"
        />
        <StatCard
          label="Total spent"
          value={formatCurrencyCompact(summary?.totalSpent)}
          valueTooltip={amountTooltip(summary?.totalSpent)}
          sub={`This month: ${formatCurrencyCompact(summary?.spentThisMonth)}`}
          subTooltip={
            isCompactCurrency(summary?.spentThisMonth)
              ? `This month: ${formatCurrency(summary?.spentThisMonth)}`
              : undefined
          }
          icon={HiOutlineDocumentText}
          tone="danger"
        />
        <StatCard
          label="Current balance"
          value={formatCurrencyCompact(summary?.currentBalance)}
          valueTooltip={amountTooltip(summary?.currentBalance)}
          sub="With accountant"
          icon={HiOutlineScale}
          tone="success"
        />
        <StatCard
          label="Utilisation"
          value={`${summary?.utilization ?? 0}%`}
          sub="Of total deposited"
          icon={HiOutlineChartPie}
          tone="warning"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <div className="sniper-card p-5">
          <DashboardSectionTitle icon={HiOutlineDownload} title="Recent deposits" tone="success" />
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y divide-border">
              {filteredDeposits.map((t) => {
                const c = catById(t.category_id) || (t.short ? { short: t.short, color_code: t.color_code } : null);
                const proofs = parseStoredFiles(t);
                return (
                  <li key={t.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <ConstrainedText as="p" variant="card" className="text-sm font-medium" lines={2}>
                        {t.notes || t.transaction_reference || "Deposit"}
                      </ConstrainedText>
                      <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 min-w-0">
                        {formatLocalDateTime(t.transaction_date)} · {t.payment_mode}
                        {c && (
                          <span className="sniper-chip" style={{ background: `${c.color_code}22`, color: c.color_code }}>
                            {c.short}
                          </span>
                        )}
                        {proofs.length > 0 && (
                          <> · <HiOutlinePaperClip className="inline size-3 -mt-0.5" /> {proofs.length} file{proofs.length > 1 ? "s" : ""}</>
                        )}
                      </p>
                    </div>
                    <ConstrainedText
                      variant="cardAmount"
                      className="text-sm font-semibold text-success"
                      tooltip={amountTooltip(t.amount, { showSign: true })}
                    >
                      {formatCurrencyCompact(t.amount, { showSign: true })}
                    </ConstrainedText>
                  </li>
                );
              })}
              {!filteredDeposits.length && (
                <li className="py-3 text-sm text-muted-foreground">No recent deposits.</li>
              )}
            </ul>
          )}
        </div>

        <div className="sniper-card p-5">
          <DashboardSectionTitle icon={HiOutlineDocumentText} title="Recent expenses" tone="danger" />
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <ul className="divide-y divide-border">
              {filteredExpenses.map((e) => {
                const c = catById(e.category_id);
                const proofs = parseStoredFiles(e);
                return (
                  <li key={e.id} className="py-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <ConstrainedText as="p" variant="card" className="text-sm font-medium" lines={2}>
                        {e.notes || e.expense_title || "Expense"}
                      </ConstrainedText>
                      <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5 min-w-0">
                        {formatLocalDateTime(e.expense_date)} ·
                        {c && (
                          <span className="sniper-chip" style={{ background: `${c.color_code}22`, color: c.color_code }}>
                            {c.short}
                          </span>
                        )}
                        {proofs.length > 0 && (
                          <> · <HiOutlinePaperClip className="inline size-3" /> {proofs.length} file{proofs.length > 1 ? "s" : ""}</>
                        )}
                      </p>
                    </div>
                    <ConstrainedText
                      variant="cardAmount"
                      className="text-sm font-semibold text-danger"
                      tooltip={amountTooltip(e.amount) ? `−${formatCurrency(e.amount)}` : undefined}
                    >
                      −{formatCurrencyCompact(e.amount)}
                    </ConstrainedText>
                  </li>
                );
              })}
              {!filteredExpenses.length && (
                <li className="py-3 text-sm text-muted-foreground">No recent expenses.</li>
              )}
            </ul>
          )}
        </div>
      </div>

      <div className="sniper-card p-5 mt-6">
        <DashboardSectionTitle
          icon={HiOutlineTag}
          title={`Spend by category — ${new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`}
          tone="primary"
        />
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : (
          <div className="space-y-3">
            {filteredByCat.map(({ category, amount, percentLabel, barWidth }) => (
              <div key={category.id} className="grid grid-cols-[minmax(0,140px)_1fr_minmax(0,120px)] items-center gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="flex items-center justify-center size-7 rounded-full shrink-0"
                    style={{ background: `${category.color_code}22`, color: category.color_code }}
                  >
                    <CategoryIcon iconKey={category.icon} className="size-3.5" />
                  </span>
                  <ConstrainedText
                    variant="card"
                    className="min-w-0 flex-1 text-sm text-muted-foreground"
                    tooltip={category.category_name}
                  >
                    {category.category_name}
                  </ConstrainedText>
                </div>
                <div className="h-2.5 rounded-full bg-muted overflow-hidden min-w-0">
                  <div className="h-full rounded-full transition-all" style={{ width: `${barWidth}%`, background: category.color_code }} />
                </div>
                <div className="min-w-0 text-right tabular-nums">
                  <ConstrainedText
                    variant="cardAmount"
                    className="inline-block max-w-full text-xs text-muted-foreground text-right"
                    tooltip={amountTooltip(amount) ? `${formatCurrency(amount)} · ${percentLabel}` : undefined}
                  >
                    <span className="text-foreground font-medium">{formatCurrencyCompact(amount)}</span> · {percentLabel}
                  </ConstrainedText>
                </div>
              </div>
            ))}
            {!filteredByCat.length && (
              <p className="text-sm text-muted-foreground">No spend recorded this month.</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
