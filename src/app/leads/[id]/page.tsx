import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import { EventStatusBadge, OrderBadge, StageBadge } from "@/components/badges";
import LeadActions from "@/components/LeadActions";
import {
  conversations as convStore,
  events as eventStore,
  leads as leadStore,
  orders as orderStore,
} from "@/lib/data/store";
import { moduleMap } from "@/lib/modules/registry";
import { pkr, shortDate, titleCase } from "@/lib/format";

export default async function LeadDetail({ params }: PageProps<"/leads/[id]">) {
  const { id } = await params;
  const lead = leadStore.byId(id);
  if (!lead) notFound();

  const conversations = convStore.byLead(id);
  const orders = orderStore.byLead(id);
  const events = eventStore.byLead(id).sort((a, b) => b.created_at.localeCompare(a.created_at));

  return (
    <>
      <Link href="/leads" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-brand-soft">
        ← All leads
      </Link>
      <PageHeader
        eyebrow={`Lead · ${titleCase(lead.business_type)}`}
        title={lead.business_name}
        subtitle={`${lead.contact_name} · ${lead.city}`}
        action={<StageBadge stage={lead.stage} />}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-5">
          <Card>
            <SectionTitle title="Profile" />
            <dl className="space-y-2.5 text-sm">
              <Row label="Score" value={<span className="font-semibold text-brand-soft">{lead.score}/100</span>} />
              <Row label="Source" value={titleCase(lead.source)} />
              <Row label="Stage" value={<StageBadge stage={lead.stage} />} />
              <Row
                label="Consent"
                value={
                  <Badge tone={lead.consent_status === "opted_in" ? "success" : lead.consent_status === "opted_out" ? "danger" : "warning"}>
                    {titleCase(lead.consent_status)}
                  </Badge>
                }
              />
              <Row label="Email" value={lead.email} />
              <Row label="Phone" value={lead.phone} />
              <Row label="WhatsApp" value={lead.whatsapp} />
              <Row label="Created" value={shortDate(lead.created_at)} />
            </dl>
          </Card>

          <Card>
            <SectionTitle title="Enrichment Data" />
            {Object.keys(lead.enrichment_data).length === 0 ? (
              <p className="text-sm text-faint">No enrichment data.</p>
            ) : (
              <dl className="space-y-2 text-sm">
                {Object.entries(lead.enrichment_data).map(([k, v]) => (
                  <Row key={k} label={titleCase(k)} value={Array.isArray(v) ? v.join(", ") : String(v)} />
                ))}
              </dl>
            )}
          </Card>
        </div>

        {/* Conversations + Orders + Events */}
        <div className="space-y-5 lg:col-span-2">
          <LeadActions leadId={lead.id} />

          <Card>
            <SectionTitle title="Conversation History" subtitle={`${conversations.length} messages across channels`} />
            {conversations.length === 0 ? (
              <p className="text-sm text-faint">No conversations yet.</p>
            ) : (
              <div className="space-y-3">
                {conversations.map((c) => {
                  const out = c.direction === "outbound";
                  return (
                    <div key={c.id} className={`flex ${out ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] rounded-2xl border px-4 py-2.5 ${
                          out
                            ? "border-brand/25 bg-brand/8"
                            : "border-border-soft bg-panel-2"
                        }`}
                      >
                        <div className="mb-1 flex items-center gap-2 text-[11px] text-faint">
                          <Badge tone="muted">{titleCase(c.channel)}</Badge>
                          {c.handled_by_module && (
                            <span>{moduleMap[c.handled_by_module]?.name ?? titleCase(c.handled_by_module)}</span>
                          )}
                          {c.detected_intent !== "none" && (
                            <Badge tone="accent">{titleCase(c.detected_intent)}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-ink">{c.message_body}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <div className="grid gap-5 md:grid-cols-2">
            <Card>
              <SectionTitle title="Orders" />
              {orders.length === 0 ? (
                <p className="text-sm text-faint">No orders.</p>
              ) : (
                <div className="space-y-2.5">
                  {orders.map((o) => (
                    <div key={o.id} className="rounded-lg border border-border-soft bg-panel-2 p-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-ink">{pkr(o.total_pkr)}</span>
                        <OrderBadge status={o.status} />
                      </div>
                      <p className="mt-1 text-xs text-faint">
                        {o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}
                      </p>
                      <p className="mt-1 text-[11px] text-faint">{titleCase(o.payment_method)}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle title="Events" />
              {events.length === 0 ? (
                <p className="text-sm text-faint">No events.</p>
              ) : (
                <div className="space-y-2.5">
                  {events.map((e) => (
                    <div key={e.id} className="rounded-lg border border-border-soft bg-panel-2 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-ink">{titleCase(e.event_type)}</span>
                        <EventStatusBadge status={e.status} />
                      </div>
                      <p className="mt-1 text-[11px] text-faint">
                        → {e.routed_to ? titleCase(e.routed_to) : "unrouted"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-faint">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
