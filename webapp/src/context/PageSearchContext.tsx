import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { useLocation } from "@tanstack/react-router";

// Define the shape of the context
interface PageSearchContextType {
  query: string;
  setQuery: (query: string) => void;
  resultCount: number | null;
  setResultCount: (count: number) => void;
}

// Create context with explicit type and default value
const PageSearchContext = createContext<PageSearchContextType | null>(null);

export function PageSearchProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const [query, setQuery] = useState("");
  const [resultCount, setResultCount] = useState<number | null>(null);

  // Reset search when route changes
  useEffect(() => {
    setQuery("");
    setResultCount(null);
  }, [pathname]);

  // Memoize the value to avoid unnecessary re-renders
  const value = useMemo(
    () => ({ query, setQuery, resultCount, setResultCount }),
    [query, resultCount]
  );

  return (
    <PageSearchContext.Provider value={value}>
      {children}
    </PageSearchContext.Provider>
  );
}

// Hook to access the full context
export function usePageSearch() {
  const ctx = useContext(PageSearchContext);
  if (!ctx) {
    throw new Error("usePageSearch must be used within PageSearchProvider");
  }
  return ctx;
}

// Optional: separate hook for query only (kept for backward compatibility)
export function usePageSearchQuery() {
  return usePageSearch().query;
}