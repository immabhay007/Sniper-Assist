import { useEffect, useMemo } from "react";
import { usePageSearch } from "@/context/PageSearchContext";
import { filterRows } from "@/utils/pageSearchFilter";

export function useFilteredRows(rows, fields) {
  const { query, setResultCount } = usePageSearch();
  const filtered = useMemo(() => filterRows(rows, query, fields), [rows, query, fields]);

  useEffect(() => {
    if (query.trim()) {
      setResultCount(filtered.length);
    } else {
      setResultCount(null);
    }
  }, [filtered.length, query, setResultCount]);

  return filtered;
}
