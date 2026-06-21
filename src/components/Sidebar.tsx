"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { modules } from "@/lib/modules/registry";

const LIVE_COUNT = modules.filter((m) => m.status === "live").length;
const PLANNED_COUNT = modules.length - LIVE_COUNT;

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
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border-soft bg-panel/50 px-4 py-5 backdrop-blur-xl md:flex">
      <Link href="/" className="mb-7 flex items-center gap-3 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand to-accent text-base font-bold text-canvas">
          M
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-bold text-ink">Mona J AI</p>
          <p className="eyebrow !text-[0.6rem]">Command Center</p>
        </div>
      </Link>

      <nav className="flex-1 space-y-6 overflow-y-auto">
        {nav.map((group) => (
          <div key={group.section}>
            <p className="eyebrow mb-2 px-2 !text-[0.6rem]">{group.section}</p>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                        active
                          ? "border border-brand/25 bg-brand/12 font-medium text-brand-soft"
                          : "border border-transparent text-muted hover:bg-panel-2 hover:text-ink"
                      }`}
                    >
                      <span className={`text-base ${active ? "text-brand" : "text-faint"}`}>{item.icon}</span>
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
          <span className="h-2 w-2 rounded-full bg-success live-dot" />
          <p className="text-xs font-medium text-ink">Fleet online</p>
        </div>
        <p className="mt-1 font-data text-[11px] text-faint">
          {LIVE_COUNT} live · {PLANNED_COUNT} planned · human-supervised
        </p>
      </div>
    </aside>
  );
}
