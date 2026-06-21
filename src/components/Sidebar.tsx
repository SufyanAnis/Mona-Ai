"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { modules } from "@/lib/modules/registry";

const LIVE_COUNT = modules.filter((m) => m.status === "live").length;

const nav: Array<{ section: string; items: Array<{ href: string; label: string; icon: string }> }> = [
  {
    section: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: "▦" },
      { href: "/agents", label: "Agent Autopilot", icon: "⏻" },
      { href: "/leads", label: "Leads", icon: "◷" },
      { href: "/events", label: "Event Bus", icon: "⇄" },
    ],
  },
  {
    section: "AI Modules",
    items: [
      { href: "/modules", label: "All Modules", icon: "✦" },
      { href: "/product-expert", label: "Product Expert", icon: "✷" },
    ],
  },
  {
    section: "Configuration",
    items: [
      { href: "/control-center", label: "Control Center", icon: "⚙" },
      { href: "/integrations", label: "Integrations", icon: "⊕" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border-soft bg-panel/60 px-4 py-5 backdrop-blur md:flex">
      <Link href="/" className="mb-7 flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-base font-bold text-canvas">
          M
        </span>
        <div className="leading-tight">
          <p className="text-sm font-bold text-ink">Mona J AI</p>
          <p className="text-[11px] text-faint">Sales Automation · v4</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              {group.section}
            </p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "bg-brand/12 font-medium text-brand-soft"
                          : "text-muted hover:bg-panel-2 hover:text-ink"
                      }`}
                    >
                      <span className={`text-base ${active ? "text-brand" : "text-faint"}`}>
                        {item.icon}
                      </span>
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-4 rounded-xl border border-border-soft bg-panel-2 p-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success" />
          <p className="text-xs font-medium text-ink">All systems live</p>
        </div>
        <p className="mt-1 text-[11px] text-faint">
          {LIVE_COUNT} of {modules.length} modules active.
        </p>
      </div>
    </aside>
  );
}
