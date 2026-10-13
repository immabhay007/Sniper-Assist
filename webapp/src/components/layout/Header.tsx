import { useRouterState } from "@tanstack/react-router";
import { Search, Bell, Sun, Moon, Menu, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useEffect, useState } from "react";
import HeaderSearch from "@/components/layout/HeaderSearch";

// --- Type definitions ---
type PageMeta = {
  title: string;
  subtitle?: string;
};

const titles: Record<string, PageMeta> = {
  "/": { title: "Dashboard" },
  "/dashboard": { title: "Dashboard" },
  "/enquiries": { title: "Enquiries" },
  "/enquiries/create": { title: "Log Enquiry" },
  "/complaints": { title: "Complaints" },
  "/complaints/create": { title: "Log Complaint" },
  "/assignments": { title: "My Assignments" },
  "/reports": { title: "Reports" },
  "/categories": { title: "Categories" },
  "/categories/enquiry/create": { title: "Add Enquiry Category" },
  "/categories/complaint/create": { title: "Add Complaint Category" },
  "/teams": { title: "Teams" },
  "/roles": { title: "Roles" },
  "/settings": { title: "Settings" },
  "/change-password": { title: "Change Password", subtitle: "Update your account password" },
  // --- Customer routes ---
  "/customers": { title: "Customers" },
  "/customers/create": { title: "Add Customer" },
};

// --- Component props ---
interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar: () => void;
  collapsed: boolean;
  onSearch?: (query: string) => void;
}

export function Header({ onMenuClick, onToggleSidebar, collapsed, onSearch }: HeaderProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const meta: PageMeta =
    titles[pathname] ??
    (pathname.startsWith("/tickets/")
      ? { title: "Ticket Details" }
      : pathname.startsWith("/teams/permissions/")
        ? { title: "Manage Permissions" }
        : pathname.startsWith("/enquiries/") && pathname.endsWith("/edit")
          ? { title: "Edit Enquiry", subtitle: "Update enquiry details" }
          : pathname.startsWith("/complaints/") && pathname.endsWith("/edit")
            ? { title: "Edit Complaint", subtitle: "Update complaint details" }
            : (pathname.startsWith("/users/") || pathname.startsWith("/user/")) && pathname.endsWith("/edit")
              ? { title: "Edit User" }
              : pathname.startsWith("/categories/enquiry/") && pathname.endsWith("/edit")
                ? { title: "Edit Enquiry Category", subtitle: "Update category details" }
                : pathname.startsWith("/categories/complaint/") && pathname.endsWith("/edit")
                  ? { title: "Edit Complaint Category", subtitle: "Update category details" }
                  // --- Customer edit route ---
                  : pathname.startsWith("/customers/") && pathname.includes("/edit")
                    ? { title: "Edit Customer" }
                    : { title: "Dashboard" });

  // Dark mode
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      alert(`Searching for "${searchQuery}" (demo)`);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6 md:py-4">
        {/* Mobile menu toggle */}
        <button
          onClick={onMenuClick}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Sidebar toggle button */}
        <button
          onClick={onToggleSidebar}
          className="hidden h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-primary md:flex"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronsRight className="h-4 w-4" />
          ) : (
            <ChevronsLeft className="h-4 w-4" />
          )}
        </button>

        {/* Title / subtitle */}
        <div className="min-w-0 flex-1">
          <h1
            className="truncate font-display text-2xl font-semibold tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {meta.title}
          </h1>
          {meta.subtitle && (
            <p className="truncate text-sm text-muted-foreground">{meta.subtitle}</p>
          )}
        </div>

        {/* Search bar (desktop) */}
        <HeaderSearch className="hidden lg:block" />

        {/* Theme toggle */}
        <button
          onClick={() => setDark((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-primary"
          aria-label="Toggle theme"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition hover:text-primary"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
        </button>
      </div>
    </header>
  );
}