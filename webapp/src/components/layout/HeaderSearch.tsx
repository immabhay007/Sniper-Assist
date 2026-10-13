import { useLocation } from "@tanstack/react-router";
import { HiOutlineSearch } from "react-icons/hi";
import { usePageSearch } from "@/context/PageSearchContext";
import { isPageSearchable } from "@/utils/pageSearchRoutes";

export default function HeaderSearch({ className = "" }) {
  const { pathname } = useLocation();
  const { query, setQuery, resultCount } = usePageSearch();
  const searchable = isPageSearchable(pathname);
  const q = query.trim();

  return (
    <div className={`relative ${className}`}>
      <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setQuery("");
        }}
        placeholder={searchable ? "Search this page…" : "Search not available here"}
        className="sniper-input !pl-9 !py-2 w-full min-w-[200px] sm:min-w-[220px] lg:min-w-[260px] disabled:opacity-60"
        aria-label="Search current page"
        disabled={!searchable}
      />
      {searchable && q.length > 0 && resultCount !== null && (
        <p className="absolute right-0 top-full mt-1 text-[11px] text-muted-foreground whitespace-nowrap">
          {resultCount === 0
            ? "No matches on this page"
            : `${resultCount} match${resultCount === 1 ? "" : "es"} on this page`}
        </p>
      )}
    </div>
  );
}
