import CategoryIcon from "@/components/categories/CategoryIcon";
import ConstrainedText from "@/components/common/ConstrainedText";
import ProofAttachmentsCell from "@/components/common/ProofAttachmentsCell";
import { formatCurrency, formatCurrencyCompact, isCompactCurrency } from "@/utils/formatCurrency";
import { formatLocalDateTime } from "@/utils/formatDate";

const w = {
  category: {
    width: "260px",
    colClassName: "w-[260px] min-w-[260px]",
  },
  dateTime: {
    width: "140px",
    colClassName: "w-[140px] min-w-[140px]",
  },
  description: {
    width: "auto",
    colClassName: "min-w-[280px]",
  },
  type: {
    width: "100px",
    colClassName: "w-[100px] min-w-[100px]",
  },
  mode: {
    width: "100px",
    colClassName: "w-[100px] min-w-[100px]",
  },
  amount: {
    width: "120px",
    colClassName: "w-[120px] min-w-[120px]",
  },
  proof: {
    width: "100px",
    colClassName: "w-[100px] min-w-[100px]",
  },
};

function activityAmountTooltip(amount, isCredit) {
  if (!isCompactCurrency(amount)) return undefined;
  return isCredit ? formatCurrency(amount, { showSign: true }) : `−${formatCurrency(amount)}`;
}

/**
 * Column definitions for Fund Transactions and Fund Balance activity tables.
 * @param {Map<number, object>} catById
 */
export function buildFundActivityColumns(catById) {
  return [
    {
      key: "category",
      header: "Category",
      ...w.category,
      wrap: false,
      render: (r) => {
        const cat = catById.get(r.category_id);
        if (!cat) return <span className="text-muted-foreground">—</span>;
        return (
          <span className="inline-flex items-center gap-2 min-w-0 max-w-full">
            <span
              className="flex items-center justify-center size-8 rounded-full shrink-0"
              style={{ background: `${cat.color_code}22`, color: cat.color_code }}
            >
              <CategoryIcon iconKey={cat.icon} className="size-4" />
            </span>
            <ConstrainedText
              variant="table"
              className="font-medium text-sm min-w-0"
              tooltip={cat.category_name}
            >
              {cat.category_name}
            </ConstrainedText>
          </span>
        );
      },
    },
    {
      key: "transaction_date",
      header: "Date & time",
      ...w.dateTime,
      render: (r) => (
        <span className="block leading-snug">{formatLocalDateTime(r.transaction_date)}</span>
      ),
    },
    {
      key: "notes",
      header: "Description",
      ...w.description,
      className: "align-top min-w-0",
      render: (r) => (
        <ConstrainedText variant="tableDescription" className="font-medium" lines={2}>
          {(r.notes || "").trim() || "—"}
        </ConstrainedText>
      ),
    },
    {
      key: "transaction_type",
      header: "Type",
      ...w.type,
      wrap: false,
      render: (r) => {
        const isTransfer = r.transaction_source === "FUND_TRANSFERRED";
        const isCredit = r.transaction_type === "CREDIT";
        const label = isTransfer ? "Transfer" : isCredit ? "Deposit" : "Expense";
        return (
          <span
            className={`sniper-chip whitespace-nowrap ${isCredit ? "bg-success-soft text-success" : "bg-danger-soft text-danger"}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      key: "payment_mode",
      header: "Mode",
      ...w.mode,
      render: (r) => (
        <ConstrainedText variant="table">{r.payment_mode || "—"}</ConstrainedText>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      ...w.amount,
      wrap: false,
      headerClassName: "text-right",
      className: "text-right tabular-nums align-top",
      render: (r) => {
        const isCredit = r.transaction_type === "CREDIT";
        return (
          <ConstrainedText
            variant="tableAmount"
            className={`font-semibold ${isCredit ? "text-success" : "text-danger"}`}
            tooltip={activityAmountTooltip(r.amount, isCredit)}
          >
            {isCredit
              ? formatCurrencyCompact(r.amount, { showSign: true })
              : `−${formatCurrencyCompact(r.amount)}`}
          </ConstrainedText>
        );
      },
    },
    {
      key: "files",
      header: "Proof",
      ...w.proof,
      wrap: false,
      headerClassName: "text-center",
      className: "text-center",
      render: (r) => (
        <ProofAttachmentsCell row={r} variant="compact" modalTitle="Transaction proof" />
      ),
    },
  ];
}
