import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-faint">404</p>
      <h1 className="mt-2 text-2xl font-bold text-ink">Not found</h1>
      <p className="mt-1.5 text-sm text-muted">That record or page doesn’t exist in the data layer.</p>
      <Link
        href="/"
        className="mt-5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-canvas transition hover:bg-brand-soft"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
