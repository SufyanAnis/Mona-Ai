/** Presentational primitives shared across pages (server-safe). */
import Link from "next/link";
import type { ReactNode } from "react";

type Tone = "default" | "brand" | "accent" | "success" | "warning" | "danger" | "info" | "muted";

const toneClasses: Record<Tone, string> = {
  default: "bg-elevated text-ink border-border",
  brand: "bg-brand/12 text-brand-soft border-brand/30",
  accent: "bg-accent/12 text-accent-soft border-accent/30",
  success: "bg-success/12 text-success border-success/30",
  warning: "bg-warning/12 text-warning border-warning/30",
  danger: "bg-danger/12 text-danger border-danger/30",
  info: "bg-info/12 text-info border-info/30",
  muted: "bg-panel-2 text-muted border-border-soft",
};

export function Badge({
  children,
  tone = "default",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "default" }: { tone?: Tone }) {
  const color: Record<Tone, string> = {
    default: "bg-faint",
    brand: "bg-brand",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    muted: "bg-faint",
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${color[tone]}`} />;
}

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function SectionTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-ink">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-faint">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "brand",
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: Tone;
}) {
  const accent: Record<Tone, string> = {
    default: "from-faint/40",
    brand: "from-brand/50",
    accent: "from-accent/50",
    success: "from-success/50",
    warning: "from-warning/50",
    danger: "from-danger/50",
    info: "from-info/50",
    muted: "from-faint/40",
  };
  return (
    <div className="card relative overflow-hidden p-5">
      <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${accent[tone]} to-transparent`} />
      <p className="text-xs font-medium uppercase tracking-wide text-faint">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-ink">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted">{sub}</p>}
    </div>
  );
}

export function LinkButton({
  href,
  children,
  variant = "ghost",
}: {
  href: string;
  children: ReactNode;
  variant?: "brand" | "ghost";
}) {
  const styles =
    variant === "brand"
      ? "bg-brand text-canvas hover:bg-brand-soft"
      : "border border-border bg-panel-2 text-ink hover:border-brand/40 hover:text-brand-soft";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition ${styles}`}
    >
      {children}
    </Link>
  );
}

/** Tiny inline horizontal bar for distributions. */
export function Bar({ value, max, tone = "brand" }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const fill: Record<Tone, string> = {
    default: "bg-faint",
    brand: "bg-brand",
    accent: "bg-accent",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
    info: "bg-info",
    muted: "bg-faint",
  };
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
      <div className={`h-full rounded-full ${fill[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
