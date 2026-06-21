/** Presentational primitives shared across pages (server-safe). */
import Link from "next/link";
import type { ReactNode } from "react";

type Tone =
  | "default"
  | "brand"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "muted";

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

const dotColor: Record<Tone, string> = {
  default: "bg-faint",
  brand: "bg-brand",
  accent: "bg-accent",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  info: "bg-info",
  muted: "bg-faint",
};

export function Badge({
  children,
  tone = "default",
  mono = false,
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  mono?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        mono ? "font-mono tracking-tight" : ""
      } ${toneClasses[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Dot({ tone = "default", pulse = false }: { tone?: Tone; pulse?: boolean }) {
  return <span className={`inline-block h-2 w-2 rounded-full ${dotColor[tone]} ${pulse ? "live-dot" : ""}`} />;
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

/** Small uppercase mono micro-label used for section eyebrows. */
export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`eyebrow ${className}`}>{children}</p>;
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
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4 fade-up">
      <div>
        {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-ink md:text-[1.7rem]">{title}</h1>
        {subtitle && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  tone = "default",
  primary = false,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  tone?: Tone;
  /** Highlight the most important metric with an accent edge. */
  primary?: boolean;
}) {
  return (
    <div className="card lift relative h-full overflow-hidden p-5">
      {primary && (
        <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-brand via-accent to-transparent" />
      )}
      <p className="eyebrow">{label}</p>
      <p
        className={`mt-2 font-data text-2xl font-semibold tracking-tight ${
          primary ? "brand-text" : "text-ink"
        }`}
      >
        {value}
      </p>
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
      ? "bg-brand text-canvas hover:bg-brand-soft font-semibold"
      : "border border-border bg-panel-2 text-ink hover:border-brand/40 hover:text-brand-soft";
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm transition ${styles}`}
    >
      {children}
    </Link>
  );
}

/** Horizontal bar (cyan→teal gradient) for distributions. */
export function Bar({ value, max, tone = "brand" }: { value: number; max: number; tone?: Tone }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  const fill =
    tone === "success"
      ? "bg-gradient-to-r from-success to-accent"
      : tone === "accent"
        ? "bg-gradient-to-r from-accent to-brand"
        : "bg-gradient-to-r from-brand to-accent";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-panel-2">
      <div className={`h-full rounded-full ${fill}`} style={{ width: `${pct}%` }} />
    </div>
  );
}
