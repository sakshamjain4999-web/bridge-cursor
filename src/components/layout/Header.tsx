"use client";

import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/trips": "Trips",
  "/fleet": "Fleet",
  "/drivers": "Drivers",
  "/parties": "Parties",
  "/invoices": "Invoices",
  "/expenses": "Expenses",
  "/settings": "Settings",
};

function getPageTitle(pathname: string): string {
  // Exact match
  if (pageTitles[pathname]) return pageTitles[pathname];
  // Prefix match
  const segments = pathname.split("/").filter(Boolean);
  const base = "/" + segments[0];
  return pageTitles[base] || "Bridge AI";
}

export default function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-header/95 px-6 backdrop-blur-md">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Search button */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground transition-colors"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-foreground transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </button>

        {/* Avatar */}
        <div className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary-light border border-primary/20">
          A
        </div>
      </div>
    </header>
  );
}
