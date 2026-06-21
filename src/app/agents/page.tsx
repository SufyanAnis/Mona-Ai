import { PageHeader, StatCard } from "@/components/ui";
import AgentAutopilot, { type AgentInfo } from "@/components/AgentAutopilot";
import { modules } from "@/lib/modules/registry";
import { MODULE_ACTIONS } from "@/lib/modules/engine";
import { getConfig } from "@/lib/config/controlCenter";
import { conversations, events, leads, orders } from "@/lib/data/store";
import { titleCase } from "@/lib/format";

export default function AgentsPage() {
  const cfg = getConfig();

  const agents: AgentInfo[] = modules.map((m) => ({
    id: m.id,
    name: m.name,
    tagline: m.tagline,
    actionLabel: MODULE_ACTIONS[m.id]?.[0]?.label ?? "Run operation",
    sharedService: m.shared_service,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Mission Control"
        title="Agent Autopilot"
        subtitle="Dispatch the full agent fleet in one cycle and watch each AI agent work in real time. Orchestration, gates and exception paths are live — external sends are simulated until channel keys are added."
      />

      <section className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Agents Online" value={`${modules.filter((m) => m.status === "live").length}/${modules.length}`} tone="success" />
        <StatCard label="Operating Mode" value={titleCase(cfg.operating_mode)} tone="accent" />
        <StatCard label="Leads Tracked" value={leads.all().length} tone="info" />
        <StatCard
          label="Bus Activity"
          value={events.all().length + conversations.all().length + orders.all().length}
          sub="events · msgs · orders"
          tone="brand"
        />
      </section>

      <AgentAutopilot agents={agents} />
    </>
  );
}
