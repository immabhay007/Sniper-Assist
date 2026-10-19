import { useState, type ReactNode } from "react";
import { Link, useNavigate, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  MessageSquare,
  AlertOctagon,
  ClipboardCheck,
  BarChart3,
  Tags,
  Users,
  UserSquare2,
  Settings as SettingsIcon,
  LogOut,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Item = {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type AuthUser = {
  full_name?: string;
  role?: string;
};

// Local, permissive navigate signature. TanStack Router's generated types
// require `search` on every navigation (even when the route has none), so we
// narrow it down here instead of casting at every call site.
type SimpleNavigate = (opts: { to: string; replace?: boolean }) => Promise<void>;

const sections: { title: string; items: Item[] }[] = [
  {
    title: "Overview",
    items: [
      { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { to: "/enquiries", label: "Enquiries", icon: MessageSquare },
      { to: "/complaints", label: "Complaints", icon: AlertOctagon },
      { to: "/assignments", label: "My Assignments", icon: ClipboardCheck },
    ],
  },
  {
    title: "Analytics",
    items: [{ to: "/reports", label: "Reports", icon: BarChart3 }],
  },
  {
    title: "Settings",
    items: [
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/customers", label: "Customers", icon: UserSquare2 },
      { to: "/teams", label: "Teams", icon: Users },
      { to: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

function getStoredUser(): AuthUser {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem("sniper-care-user");
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      return parsed as AuthUser;
    }
    return {};
  } catch {
    return {};
  }
}

export function Sidebar({
  collapsed,
  // onToggle is part of the public API but not used in this render.
  // Rename to _onToggle to satisfy `noUnusedParameters` / `noUnusedLocals`.
  onToggle: _onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // `useLocation()` returns a properly typed location object.
  // This avoids the "Parameter 'pathname' implicitly has an 'any' type"
  // error you were getting from `useRouterState({ select: (s) => ... })`
  // when the router isn't globally augmented with the generated route types.
  const { pathname } = useLocation();

  const navigate = useNavigate() as unknown as SimpleNavigate;
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("sniper-care-user");
    }
    setUserMenuOpen(false);
    await navigate({ to: "/login" });
  };

  const handleChangePassword = () => {
    setUserMenuOpen(false);
    void navigate({ to: "/change-password" });
  };

  const user = getStoredUser();
  const fullName = user.full_name?.trim() || "User";
  const role = user.role || "Admin";

  const initials =
    fullName
      .split(" ")
      .filter(Boolean)
      // charAt(0) always returns `string` — fixes "possibly undefined/null"
      // that `n[0]` produces under `noUncheckedIndexedAccess: true`.
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";

  return (
    <aside
      className={`relative flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-300 ease-out ${
        collapsed ? "w-[78px]" : "w-[248px]"
      }`}
    >
      {/* Brand */}
      <div className="flex justify-center px-5 pt-3 pb-1">
        <img
          src="/sniper-logo.png"
          alt="Sniper"
          style={{
            display: "block",
            width: collapsed ? 24 : 140,
            height: "auto",
            maxWidth: "100%",
          }}
          className="object-contain"
        />
      </div>

      {!collapsed && (
        <p className="px-5 pb-1 text-center text-xs text-sidebar-muted">
          Support Console
        </p>
      )}
      {collapsed && <div className="h-2" />}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mb-5">
            {!collapsed && (
              <div className="px-3 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                {section.title}
              </div>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.to ||
                  (item.to === "/dashboard" && pathname === "/");
                const Icon = item.icon;
                return (
                  <li key={item.to} className="group relative">
                    <Link
                      to={item.to}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        active
                          ? "bg-sidebar-active text-primary"
                          : "text-sidebar-foreground hover:bg-accent"
                      } ${collapsed ? "justify-center" : ""}`}
                    >
                      {active && !collapsed && (
                        <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-primary" />
                      )}
                      <Icon className="h-[18px] w-[18px] shrink-0" />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                    </Link>
                    {collapsed && (
                      <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs text-background opacity-0 shadow-md transition-opacity group-hover:opacity-100">
                        {item.label}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-sidebar-border p-3">
        {userMenuOpen && !collapsed && (
          <div className="mb-2 overflow-hidden rounded-lg border border-sidebar-border bg-card animate-in fade-in slide-in-from-bottom-2 duration-200">
            <button
              type="button"
              onClick={handleChangePassword}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-accent"
            >
              <KeyRound className="h-4 w-4" /> Change Password
            </button>

            <button
              type="button"
              onClick={() => {
                void handleLogout();
              }}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-danger-soft"
            >
              <LogOut className="h-4 w-4" /> Logout
            </button>
          </div>
        )}
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className={`flex w-full items-center gap-3 rounded-lg p-2 transition-colors hover:bg-accent ${
            collapsed ? "justify-center" : ""
          } ${userMenuOpen ? "ring-1 ring-border" : ""}`}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
            {initials}
          </div>

          {!collapsed && (
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-sidebar-foreground">
                {fullName}
              </p>
              <p className="truncate text-xs text-sidebar-muted">{role}</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}

export function MobileSidebar({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="absolute inset-0 bg-foreground/30 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute left-0 top-0 h-full animate-in slide-in-from-left duration-200">
        {children}
      </div>
    </div>
  );
}