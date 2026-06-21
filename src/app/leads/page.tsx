import Link from "next/link";
import { Badge, Card, LinkButton, PageHeader, StatCard } from "@/components/ui";
import { StageBadge } from "@/components/badges";
import AnimatedNumber from "@/components/AnimatedNumber";
import { leads as leadStore } from "@/lib/data/store";
import { relativeTime, titleCase } from "@/lib/format";

function ScorePill({ score }: { score: number }) {
  const fill =
    score >= 80 ? "from-success to-accent" : score >= 60 ? "from-brand to-accent" : score >= 40 ? "from-warning to-warning" : "from-danger to-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-panel-2">
        <div className={`h-full rounded-full bg-gradient-to-r ${fill}`} style={{ width: `${score}%` }} />
      </div>
      <span className="w-6 text-right font-data text-xs font-medium text-ink">{score}</span>
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
        subtitle="Every profile in the central Lead Store — score, funnel stage and consent status. The single source of truth all agents read from."
        action={
          <LinkButton href="/leads/import" variant="brand">
            + Import CSV
          </LinkButton>
        }
      />

      <section className="stagger mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Leads" value={<AnimatedNumber value={all.length} />} tone="info" />
        <StatCard label="Active Funnel" value={<AnimatedNumber value={active.length} />} sub="excl. churned/suppressed" />
        <StatCard label="Customers" value={<AnimatedNumber value={customers.length} />} tone="success" />
        <StatCard label="Opted In" value={<><AnimatedNumber value={optedIn.length} />/{all.length}</>} tone="brand" primary />
      </section>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Business", "City", "Type", "Score", "Stage", "Source", "Consent", "Updated"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-3 py-3 font-mono text-[10px] font-medium uppercase tracking-wider text-faint ${i === 0 ? "pl-5" : ""} ${h === "Updated" ? "pr-5 text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {all.map((lead) => (
                <tr key={lead.id} className="group border-b border-border-soft transition last:border-0 hover:bg-panel-2/50">
                  <td className="px-3 py-3 pl-5">
                    <Link href={`/leads/${lead.id}`} className="block">
                      <p className="font-medium text-ink group-hover:text-brand-soft">{lead.business_name}</p>
                      <p className="mt-0.5 text-xs text-faint">{lead.contact_name}</p>
                    </Link>
                  </td>
                  <td className="px-3 py-3 text-muted">{lead.city}</td>
                  <td className="px-3 py-3">
                    <Badge tone="muted" mono>
                      {titleCase(lead.business_type)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    <ScorePill score={lead.score} />
                  </td>
                  <td className="px-3 py-3">
                    <StageBadge stage={lead.stage} />
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-muted">{titleCase(lead.source)}</td>
                  <td className="px-3 py-3">
                    <Badge
                      tone={lead.consent_status === "opted_in" ? "success" : lead.consent_status === "opted_out" ? "danger" : "warning"}
                      mono
                    >
                      {titleCase(lead.consent_status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 pr-5 text-right font-mono text-[11px] text-faint">
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
