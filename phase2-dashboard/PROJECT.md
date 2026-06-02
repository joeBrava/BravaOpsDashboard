# Phase 2 — Web Dashboard

Polished, branded web app for the sales team. Per-user authenticated view of their deals with full project timelines, invoice status, and Teamwork milestone progression.

## Status

**Deferred** until Phase 1 ships and stabilizes. Brainstorm notes captured in `../docs/2026-06-02-brainstorm-notes.md`.

## Planned tech stack

| Layer | Pick |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Animations | Framer Motion |
| Charts | Recharts or Tremor |
| Auth | Clerk *or* NextAuth + Google SSO |
| Database | Supabase (Postgres) |
| Hosting | Vercel |
| Data sync | n8n cron workflow → Supabase |

## Planned page structure

- `/` — Pipeline overview (cards per active deal, filter by stage, search)
- `/deals/[id]` — Per-deal detail (timeline, invoices, milestones, photo refs, history)
- `/invoices` — Sortable invoice list
- `/settings` — Per-user notification preferences

## Why deferred

1. Phase 1 ships value in days; this would take 4-6 weeks before anything is usable
2. Phase 1's HubSpot deal-property writeback becomes the data spec for what this dashboard reads — designing Phase 2 first would mean making this same data decision twice
3. Phase 2 should be informed by what sales actually does with Phase 1 over a few weeks of real use
