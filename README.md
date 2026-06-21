# Mona J AI — Sales Automation Platform

An intelligent sales automation platform for the **Mona J** hair-care brand: 7 AI
modules on a central data layer, moving customers through the full revenue
lifecycle — **acquire → engage → convert → support → retain**.

Built on **Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4**.

> Implements the architecture in `MONA_J_AI_BUILD_SPEC.md`: single source of
> truth, shared Product Expert service, exception paths, event-driven
> orchestration, and an analytics feedback loop.

---

## Quick start

```bash
npm install      # already done if scaffolded
npm run dev      # http://localhost:3000
```

It runs immediately with **no external services** — a seeded in-memory data
layer and mock AI/integration adapters back everything. Add API keys to flip
adapters to live (see `/integrations`).

```bash
cp .env.example .env.local   # add keys as you get them
```

---

## Architecture

### Central data layer (`src/lib/data/`)
The single source of truth. No module passes state to another — all handoffs go
through here.

- `types.ts` — entity types (mirrors `schema.sql` exactly)
- `store.ts` — in-memory repositories (Lead / Conversation / Order / Event / Audit)
- `seed.ts` — deterministic demo data
- `schema.sql` — production PostgreSQL DDL + pgvector (the migration target)

### Event bus orchestrator (`src/lib/eventBus/`)
`subscribe → route → process / exception`. Modules subscribe to event types; the
orchestrator routes each event to the responsible module; exceptions emit their
own events to recovery flows or human review.

### The seven modules (`src/lib/modules/`)
`registry.ts` (metadata, phases, gates, exception paths) + `handlers.ts`
(runtime behaviour). Product Expert is a **shared service**, not a funnel step.

| Phase | Modules |
|---|---|
| **1 · Live** | Product Expert · Sales Closer · Customer Support |
| **2 · Next** | Outreach · Appointment Setter |
| **3 · Future** | Lead Hunter · Account Manager |

### Control center (`src/lib/config/`)
Versioned, audited configuration consumed by every module (targeting, outreach
rules, operating mode, approval gates, high-value thresholds).

### Analytics (`src/lib/analytics/`)
Reads the stores only. KPIs, funnel, channel performance, product-query
intelligence, module activity, revenue — the data that closes the feedback loop.

---

## Pages

| Route | What |
|---|---|
| `/` | Analytics dashboard (KPIs, funnel, revenue, channels, activity) |
| `/leads` · `/leads/[id]` | Lead Store + 360° lead view |
| `/modules` · `/modules/[id]` | The 7 modules by phase + detail |
| `/product-expert` | Live RAG console (shared service) |
| `/events` | Event bus monitor + orchestrator "process pending" |
| `/control-center` | Configuration layer + catalog + audit log |
| `/integrations` | Adapter status — what's needed to go live, by phase |

## API routes

| Endpoint | Purpose |
|---|---|
| `POST /api/product-expert/query` | Product Expert shared-service endpoint (spec §5.4) |
| `GET/POST /api/events` | List events · emit + orchestrate an event |
| `POST /api/events/process` | Drain pending events through the orchestrator |
| `GET/PATCH /api/control-center` | Read / update configuration |
| `GET /api/health` | Liveness + data-layer counts + AI mode |

---

## Going live

1. Drop keys into `.env.local` — adapters detect them and switch MOCK → LIVE.
2. Set `DATABASE_URL` and run `src/lib/data/schema.sql` to move off the
   in-memory store onto Postgres (swap the repositories in `store.ts`).
3. See `/integrations` for the per-phase checklist.
