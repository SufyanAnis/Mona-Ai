import Link from "next/link";
import { Badge, Card, LinkButton, PageHeader, StatCard } from "@/components/ui";
import { StageBadge } from "@/components/badges";
import { leads as leadStore } from "@/lib/data/store";
import { relativeTime, titleCase } from "@/lib/format";

function ScorePill({ score }: { score: number }) {
  const tone = score >= 80 ? "success" : score >= 60 ? "brand" : score >= 40 ? "warning" : "danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full rounded-full ${
            tone === "success"
              ? "bg-success"
              : tone === "brand"
                ? "bg-brand"
                : tone === "warning"
                  ? "bg-warning"
                  : "bg-danger"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-6 text-right text-xs font-medium text-ink">{score}</span>
    </div>
  );
}

export default function LeadsPage() {
  const all = leadStore.all();
  const active = all.filter((l) => !["suppressed", "churned"].includes(l.stage));
  const customers = all.filter((l) => l.stage === "customer");
  const optedIn = all.filter((l) => l.consent_status === "opted_in");

  return (
    <>
      <PageHeader
        eyebrow="Lead Store"
        title="Leads"
        subtitle="Every profile in the central Lead Store — score, funnel stage and consent status. The single source of truth all modules read from."
        action={
          <LinkButton href="/leads/import" variant="brand">
            + Import CSV
          </LinkButton>
        }
      />

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Leads" value={all.length} tone="info" />
        <StatCard label="Active Funnel" value={active.length} tone="accent" />
        <StatCard label="Customers" value={customers.length} tone="success" />
        <StatCard label="Opted In" value={`${optedIn.length}/${all.length}`} tone="brand" />
      </section>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="px-3 py-3 font-medium">City</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Score</th>
                <th className="px-3 py-3 font-medium">Stage</th>
                <th className="px-3 py-3 font-medium">Source</th>
                <th className="px-3 py-3 font-medium">Consent</th>
                <th className="px-5 py-3 text-right font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {all.map((lead) => (
                <tr
                  key={lead.id}
                  className="group border-b border-border-soft last:border-0 transition hover:bg-panel-2/60"
                >
                  <td className="px-5 py-3">
                    <Link href={`/leads/${lead.id}`} className="block">
                      <p className="font-medium text-ink group-hover:text-brand-soft">
                        {lead.business_name}
                      </p>
                      <p className="text-xs text-faint">{lead.contact_name}</p>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted">{lead.city}</td>
                  <td className="px-3 py-3">
                    <Badge tone="muted">{titleCase(lead.business_type)}</Badge>
                  </td>
                  <td className="px-3 py-3">
                    <ScorePill score={lead.score} />
                  </td>
                  <td className="px-3 py-3">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-3 py-3 text-xs text-muted">{titleCase(lead.source)}</td>
                  <td className="px-3 py-3">
                    <Badge
                      tone={
                        lead.consent_status === "opted_in"
                          ? "success"
                          : lead.consent_status === "opted_out"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {titleCase(lead.consent_status)}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right text-xs text-faint">
                    {relativeTime(lead.updated_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
