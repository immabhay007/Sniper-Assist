import React from "react";
import {
  HiOutlineMenu,
  HiOutlineChevronDoubleLeft,
  HiOutlineChevronDoubleRight,
} from "react-icons/hi";
import HeaderSearch from "@/components/layout/HeaderSearch";

// Define prop types
interface NavbarProps {
  title: string;
  subtitle?: string; // optional
  actions?: React.ReactNode; // optional, can be a button or any element
  onMobileMenu: () => void;
  collapsed: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({
  title,
  subtitle,
  actions,
  onMobileMenu,
  collapsed,
  onToggleSidebar,
}: NavbarProps) {
  const dateStr = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <header className="sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="flex items-center gap-3 px-4 sm:px-6 lg:px-8 h-[68px]">
        <button
          type="button"
          onClick={onMobileMenu}
          className="md:hidden sniper-btn !p-2 shrink-0"
          aria-label="Open menu"
        >
          <HiOutlineMenu className="size-5" />
        </button>

        <button
          type="button"
          onClick={onToggleSidebar}
          className="hidden md:inline-flex shrink-0 items-center justify-center size-9 rounded-lg border border-border/80 bg-card text-muted-foreground hover:text-foreground hover:bg-muted/50 hover:border-border transition-all shadow-sm"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <HiOutlineChevronDoubleRight className="size-5" />
          ) : (
            <HiOutlineChevronDoubleLeft className="size-5" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <h1 className="text-[18px] sm:text-[20px] font-semibold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-muted-foreground truncate">{subtitle}</p>}
        </div>

        <div className="hidden lg:flex items-center text-sm text-muted-foreground shrink-0">
          {dateStr}
        </div>

        <HeaderSearch className="hidden sm:block shrink-0" />

        {actions}
      </div>

      <div className="sm:hidden px-4 pb-3 -mt-1">
        <HeaderSearch className="w-full" />
      </div>
    </header>
  );
}