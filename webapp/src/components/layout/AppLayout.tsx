import { Outlet } from "@tanstack/react-router";
import { useState } from "react";
import { Sidebar, MobileSidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = () => setCollapsed((v) => !v);
  const toggleMobile = () => setMobileOpen((v) => !v);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <Sidebar collapsed={collapsed} onToggle={toggleSidebar} />
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} />
      </MobileSidebar>

      {/* Main content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          onMenuClick={toggleMobile}            // for hamburger menu
          onToggleSidebar={toggleSidebar}       // ✅ now passed
          collapsed={collapsed}                 // ✅ now passed
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}