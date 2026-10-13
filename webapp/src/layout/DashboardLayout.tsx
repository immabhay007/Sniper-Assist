import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "@/context/AuthContext";
import { storage } from "@/utils/storage";
import { STORAGE_KEYS } from "@/config/constants";
import { can } from "@/utils/permissions";
import { HiOutlineArrowRight, HiOutlinePlus } from "react-icons/hi";

export default function DashboardLayout({ title, subtitle, children, headerActions, fullBleed = false }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const saved = storage.get(STORAGE_KEYS.SIDEBAR);
    if (typeof saved === "boolean") setCollapsed(saved);
  }, []);

  useEffect(() => {
    if (ready && !user) navigate({ to: "/login" });
  }, [ready, user, navigate]);

  const toggleSidebar = () => {
    setCollapsed((c) => {
      const v = !c;
      storage.set(STORAGE_KEYS.SIDEBAR, v);
      return v;
    });
  };

  const defaultHeaderActions = useMemo(() => {
    if (!user) return null;
    const canLogDeposit = can(user, "funds", "can_create");
    const canLogExpense = can(user, "expenses", "can_create");
    if (!canLogDeposit && !canLogExpense) return null;
    return (
      <div className="hidden sm:flex items-center gap-2">
        {canLogDeposit && (
          <button type="button" onClick={() => navigate({ to: "/funds/log" })} className="sniper-btn">
            <HiOutlinePlus className="size-4" /> Deposit
          </button>
        )}
        {canLogExpense && (
          <button type="button" onClick={() => navigate({ to: "/expenses/log" })} className="sniper-btn">
            <HiOutlinePlus className="size-4" /> Expense
          </button>
        )}
        {canLogDeposit && (
          <button type="button" onClick={() => navigate({ to: "/funds/transfer" })} className="sniper-btn">
            <HiOutlineArrowRight className="size-4" /> Transfer
          </button>
        )}
      </div>
    );
  }, [user, navigate]);

  const navbarActions = headerActions !== undefined ? headerActions : defaultHeaderActions;

  if (!ready) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen flex bg-background">
      <Sidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />
      <div className="flex-1 min-w-0 flex flex-col">
        <Navbar
          title={title}
          subtitle={subtitle}
          collapsed={collapsed}
          onToggleSidebar={toggleSidebar}
          onMobileMenu={() => setMobileOpen(true)}
          actions={navbarActions}
        />
        <main
          className={
            fullBleed
              ? "flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden"
              : "flex-1 px-4 sm:px-6 lg:px-8 py-6 lg:py-8"
          }
        >
          {fullBleed ? children : <div className="mx-auto max-w-100%">{children}</div>}
        </main>
      </div>
    </div>
  );
}
