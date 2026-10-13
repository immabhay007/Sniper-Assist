import SelectInput from "@/components/common/SelectInput";
import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

export const PAGE_SIZE_OPTIONS = [25, 50, 100, 200, "all"];

export function paginateRows(rows, page, pageSize) {
  if (pageSize === "all") return rows;
  const size = Number(pageSize);
  const start = (page - 1) * size;
  return rows.slice(start, start + size);
}

export function getPageCount(total, pageSize) {
  if (pageSize === "all" || total === 0) return 1;
  return Math.max(1, Math.ceil(total / Number(pageSize)));
}

export default function TablePagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  className = "",
}) {
  const isAll = pageSize === "all";
  const size = isAll ? total : Number(pageSize);
  const totalPages = getPageCount(total, pageSize);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = total === 0 ? 0 : (safePage - 1) * size + 1;
  const end = isAll ? total : Math.min(safePage * size, total);

  return (
    <div
      className={`flex flex-wrap items-center gap-3 justify-between text-sm ${className}`}
      role="navigation"
      aria-label="Table pagination"
    >
      <span className="text-muted-foreground">
        {total === 0 ? "No records" : `Showing ${start}–${end} of ${total}`}
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-2 text-muted-foreground">
          <span className="whitespace-nowrap">Rows per page</span>
          <SelectInput
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(e.target.value)}
            className="w-[88px] !inline-block"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((opt) => (
              <option key={opt} value={String(opt)}>
                {opt === "all" ? "All" : opt}
              </option>
            ))}
          </SelectInput>
        </label>
        {!isAll && totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="sniper-btn !py-1.5 !px-2.5 disabled:opacity-50"
              disabled={safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
              aria-label="Previous page"
            >
              <HiOutlineChevronLeft className="size-4" />
            </button>
            <span className="px-2 tabular-nums text-muted-foreground whitespace-nowrap">
              Page {safePage} of {totalPages}
            </span>
            <button
              type="button"
              className="sniper-btn !py-1.5 !px-2.5 disabled:opacity-50"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(safePage + 1)}
              aria-label="Next page"
            >
              <HiOutlineChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
