import { Badge, Card, PageHeader, SectionTitle } from "@/components/ui";
import ControlCenterForm from "@/components/ControlCenterForm";
import { getConfig, getConfigMeta } from "@/lib/config/controlCenter";
import { audit as auditStore } from "@/lib/data/store";
import { products } from "@/lib/knowledge/catalog";
import { pkr, relativeTime, titleCase } from "@/lib/format";

export default function ControlCenterPage() {
  const cfg = getConfig();
  const meta = getConfigMeta();
  const audit = auditStore.all().slice(0, 8);

  return (
    <>
      <PageHeader
        eyebrow="Configuration Layer"
        title="Control Center"
        subtitle="CEO / Sales Manager configuration consumed by every module. Changes are versioned and written to the audit log."
        action={<Badge tone="brand">Config v{meta.version}</Badge>}
      />

      <ControlCenterForm initial={cfg} initialVersion={meta.version} />

      {/* Product catalog */}
      <section className="mt-8">
        <SectionTitle
          title="Product Catalog"
          subtitle="SKUs, pricing & bundles — feeds Product Expert + Sales Closer"
        />
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-faint">
                  <th className="px-5 py-3 font-medium">SKU</th>
                  <th className="px-3 py-3 font-medium">Product</th>
                  <th className="px-3 py-3 font-medium">Category</th>
                  <th className="px-3 py-3 font-medium">Retail (PKR)</th>
                  <th className="px-3 py-3 font-medium">Distributor</th>
                  <th className="px-5 py-3 font-medium">Hair Types</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.sku} className="border-b border-border-soft last:border-0">
                    <td className="px-5 py-3 font-mono text-xs text-faint">{p.sku}</td>
                    <td className="px-3 py-3 font-medium text-ink">{p.name}</td>
                    <td className="px-3 py-3">
                      <Badge tone="muted">{titleCase(p.category)}</Badge>
                    </td>
                    <td className="px-3 py-3 text-ink">{pkr(p.price_pkr)}</td>
                    <td className="px-3 py-3 text-muted">
                      {p.distributor_price_pkr ? pkr(p.distributor_price_pkr) : "—"}
                    </td>
                    <td className="px-5 py-3 text-xs text-muted">{p.hair_types.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      {/* Audit log */}
      <section className="mt-8">
        <SectionTitle title="Audit Log" subtitle="Every config change & gate decision (spec §9)" />
        <Card>
          <div className="space-y-2">
            {audit.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border-soft bg-panel-2 px-3 py-2.5 text-sm"
              >
                <div className="min-w-0">
                  <p className="text-ink">
                    <span className="font-medium">{a.action}</span>
                    <span className="text-faint"> · {a.target}</span>
                  </p>
                  <p className="truncate text-xs text-faint">
                    {a.actor} · {JSON.stringify(a.detail)}
                  </p>
                </div>
                <span className="shrink-0 text-xs text-faint">{relativeTime(a.created_at)}</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </>
  );
}
