import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  HiOutlineViewGrid, HiOutlineDownload, HiOutlineDocumentText,
  HiOutlineScale, HiOutlineChartBar, HiOutlineUsers, HiOutlineTag, HiOutlineShieldCheck,
  HiOutlineViewGrid as HiOutlineMenus,
  HiOutlineCog, HiOutlineSwitchHorizontal,
  HiOutlineLogout, HiOutlineKey,
} from "react-icons/hi";
import { MdCurrencyExchange } from "react-icons/md";
import { useAuth } from "@/context/AuthContext";
import { can } from "@/utils/permissions";
import { MENU_CATALOG, NAV_GROUPS } from "@/config/menuCatalog";
import ENV from "@/config/initializeEnvironment";

const ICON_BY_KEY = {
  dashboard: HiOutlineViewGrid,
  funds: HiOutlineDownload,
  expenses: HiOutlineDocumentText,
  fund_transfers: MdCurrencyExchange,
  fund_transactions: HiOutlineSwitchHorizontal,
  fund_balance: HiOutlineScale,
  reports: HiOutlineChartBar,
  categories: HiOutlineTag,
  users: HiOutlineUsers,
  roles: HiOutlineShieldCheck,
  menus: HiOutlineMenus,
  settings: HiOutlineCog,
};

const catalogByKey = Object.fromEntries(MENU_CATALOG.map((m) => [m.menu_key, m]));

function isNavRouteMatch(pathname, route) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

/** Prefer the longest matching menu route so /funds/transfers does not also activate /funds. */
function resolveActiveNavRoute(pathname, routes) {
  if (pathname === "/funds/transfer") {
    return routes.includes("/funds/transfers") ? "/funds/transfers" : null;
  }

  let best = null;
  for (const route of routes) {
    if (!isNavRouteMatch(pathname, route)) continue;
    if (!best || route.length > best.length) best = route;
  }
  return best;
}

const navGroups = NAV_GROUPS.map((g) => ({
  label: g.label,
  items: g.keys
    .map((key) => {
      const cat = catalogByKey[key];
      if (!cat) return null;
      return {
        to: cat.route,
        label: cat.menu_name,
        icon: ICON_BY_KEY[key] || HiOutlineViewGrid,
        key: cat.menu_key,
      };
    })
    .filter(Boolean),
}));

export default function Sidebar({ collapsed, mobileOpen, onMobileClose }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [menuOpen]);

  const initials = (user?.full_name || "U")
    .split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();

  const visibleNavRoutes = useMemo(() => {
    const routes = [];
    navGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (can(user, item.key, "can_view")) {
          routes.push(item.to);
        } else if (item.key === "fund_transfers" && can(user, "funds", "can_view")) {
          routes.push(item.to);
        }
      });
    });
    return routes;
  }, [user]);

  const activeNavRoute = useMemo(
    () => resolveActiveNavRoute(location.pathname, visibleNavRoutes),
    [location.pathname, visibleNavRoutes],
  );

  const handleLogout = async () => {
    await logout();
    navigate({ to: "/login" });
  };

  const content = (
    <aside
      className={`flex h-full flex-col bg-sidebar border-r border-sidebar-border transition-[width] duration-300 ease-out ${
        collapsed ? "w-[76px]" : "w-[248px]"
      }`}
    >
      <div className="flex justify-center px-4 pt-6 pb-5">
        <Link
          to="/dashboard"
          onClick={onMobileClose}
          className={`flex ${collapsed ? "justify-center" : "flex-col items-center gap-2"}`}
          title="Sniper Assist"
        >
          <img
            src={collapsed ? ENV.CLEO_FAVICON_URL : ENV.CLEO_LOGO_URL}
            alt="Sniper"
            className={collapsed ? "size-9 object-contain" : "h-9 w-auto max-w-[200px] object-contain"}
          />
          {!collapsed && (
            <span className="text-center text-[12px] font-medium text-muted-foreground tracking-wide">
              Sniper Assist
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((item) => {
            if (can(user, item.key, "can_view")) return true;
            if (item.key === "fund_transfers" && can(user, "funds", "can_view")) return true;
            return false;
          });
          if (visibleItems.length === 0) return null;
          return (
            <div key={group.label} className="mb-5">
              {!collapsed && (
                <div className="px-2 pb-2 text-[11px] font-medium tracking-[0.08em] uppercase text-muted-foreground/80">
                  {group.label}
                </div>
              )}
              <ul className="space-y-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const active = item.to === activeNavRoute;
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onMobileClose}
                        className={`group relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-[14px] font-medium transition-colors ${
                          active
                            ? "bg-sidebar-accent text-foreground"
                            : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
                        } ${collapsed ? "justify-center" : ""}`}
                        title={collapsed ? item.label : undefined}
                      >
                        {active && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-primary" />
                        )}
                        <Icon className={`size-[18px] shrink-0 ${active ? "text-primary" : ""}`} />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {collapsed && (
                          <span className="pointer-events-none absolute left-full ml-2 z-50 whitespace-nowrap rounded-md bg-foreground text-background px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition shadow-lg">
                            {item.label}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <div ref={userMenuRef} className="relative border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={`w-full flex items-center gap-3 rounded-lg p-2 hover:bg-sidebar-accent transition ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <div className="size-9 rounded-full bg-primary/15 text-primary grid place-items-center text-sm font-semibold ring-1 ring-primary/20">
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-1 text-left min-w-0">
              <div className="text-[13px] font-medium truncate">{user?.full_name || "Guest"}</div>
              <div className="text-[11px] text-muted-foreground truncate">{user?.role_name || user?.role || "—"}</div>
            </div>
          )}
        </button>
        {menuOpen && (
          <div className={`absolute z-30 ${collapsed ? "left-full ml-2 bottom-3" : "left-3 right-3 bottom-[72px]"} sniper-card p-1.5 shadow-lg`}>
            <Link
              to="/change-password"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md hover:bg-muted"
            >
              <HiOutlineKey className="size-4" /> Change Password
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-sm rounded-md hover:bg-muted text-danger"
            >
              <HiOutlineLogout className="size-4" /> Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden md:block sticky top-0 h-screen">{content}</div>
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="absolute inset-0 bg-foreground/30 backdrop-blur-sm" onClick={onMobileClose} />
          <div className="relative h-full">{content}</div>
        </div>
      )}
    </>
  );
}
