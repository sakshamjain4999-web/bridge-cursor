"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Truck,
  Route,
  Users,
  Building2,
  FileText,
  Receipt,
  Settings,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Route },
  { href: "/fleet", label: "Fleet", icon: Truck },
  { href: "/drivers", label: "Drivers", icon: Users },
  { href: "/parties", label: "Parties", icon: Building2 },
  { href: "/invoices", label: "Invoices", icon: FileText },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-[260px] flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-accent shadow-lg shadow-primary/20">
          <Truck className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground">
            Transport<span className="gradient-text">AI</span>
          </p>
          <p className="text-[10px] text-muted uppercase tracking-wider font-mono">Fleet Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "nav-active-indicator bg-sidebar-active text-primary-light"
                  : "text-muted hover:bg-sidebar-hover hover:text-foreground"
              }`}
            >
              <Icon
                className={`h-4.5 w-4.5 shrink-0 transition-colors ${
                  isActive ? "text-primary-light" : "text-muted group-hover:text-muted-light"
                }`}
                size={18}
              />
              <span className="flex-1">{label}</span>
              {isActive && (
                <ChevronRight className="h-3.5 w-3.5 text-primary/60" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary-light border border-primary/20">
            A
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">Admin</p>
            <p className="text-[10px] text-muted truncate">Fleet Manager</p>
          </div>
          <div className="h-2 w-2 rounded-full bg-success pulse-dot" />
        </div>
      </div>
    </aside>
  );
}
