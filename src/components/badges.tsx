/** Domain → tone mappings for consistent status colors across pages. */
import { Badge, Dot } from "./ui";
import { titleCase } from "@/lib/format";
import type { EventStatus, LeadStage, OrderStatus } from "@/lib/data/types";
import type { ModuleStatus } from "@/lib/modules/registry";

type Tone = "default" | "brand" | "accent" | "success" | "warning" | "danger" | "info" | "muted";

const stageTone: Record<LeadStage, Tone> = {
  new: "muted",
  contacted: "info",
  engaged: "info",
  meeting_booked: "accent",
  purchase_intent: "brand",
  customer: "success",
  churned: "danger",
  suppressed: "muted",
};

export function StageBadge({ stage }: { stage: LeadStage }) {
  return (
    <Badge tone={stageTone[stage]}>
      <Dot tone={stageTone[stage]} />
      {titleCase(stage)}
    </Badge>
  );
}

const orderTone: Record<OrderStatus, Tone> = {
  cart: "muted",
  pending_payment: "warning",
  paid: "success",
  failed: "danger",
  refunded: "info",
};

export function OrderBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={orderTone[status]}>{titleCase(status)}</Badge>;
}

const eventTone: Record<EventStatus, Tone> = {
  pending: "warning",
  processed: "success",
  exception: "danger",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <Badge tone={eventTone[status]}>
      <Dot tone={eventTone[status]} />
      {titleCase(status)}
    </Badge>
  );
}

const moduleStatusTone: Record<ModuleStatus, Tone> = {
  live: "success",
  coming_next: "warning",
  future: "muted",
};

const moduleStatusLabel: Record<ModuleStatus, string> = {
  live: "Live",
  coming_next: "Coming next",
  future: "Future",
};

export function ModuleStatusBadge({ status }: { status: ModuleStatus }) {
  return (
    <Badge tone={moduleStatusTone[status]}>
      <Dot tone={moduleStatusTone[status]} />
      {moduleStatusLabel[status]}
    </Badge>
  );
}
