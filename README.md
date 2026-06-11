# BravaOpsDashboard

Sales-team visibility tooling for Brava Brands. Surfaces project status, invoice payment status, and production milestones to the sales team so they can keep deals moving without manually digging through Teamwork and QBO.

## Goal

Replace Joe's daily QBO check + manual Teamwork invoice-tracking project. Give every salesperson real-time clarity on:

1. **Which of their deals can move forward** (design deposit paid → design can start; first 50% paid → production can start)
2. **Where each project actually is in production** (current Teamwork milestone / stage + what's next)
3. **What's blocking forward motion** (unpaid invoices, stalled stages)

## Two phases

### Phase 1 — Payment tracking + Slack DMs (1–2 weeks)
Self-contained value. Detects invoice payments in QBO, writes status back to HubSpot deal properties, sends per-deal-owner Slack DMs in real time. Admin-toggleable per salesperson.

- See `phase1-payments/` for the design + roadmap (not yet built — a separate n8n effort)
- See `docs/` for spec + design notes

### Phase 2 — Web dashboard (4–6 weeks)
A polished, branded web app for the sales team. Per-user authenticated view of their deals with full project timelines, invoices, and Teamwork milestone progression. Sales Manager gets all-team view.

- See `phase2-dashboard/` for implementation
- **Built** (server-rendered, runs on fixtures today) — live HubSpot/Teamwork data + Google SSO are config away. See `STATUS.md`.

## Tech stack (Phase 2, as shipped)

| Layer | Pick |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 |
| Styling | Tailwind CSS v4 |
| Components | Hand-built React components |
| Auth | Auth.js (NextAuth v5) + Google SSO, domain-locked to `buildbrava.com` |
| Data access | Read-only HubSpot + Teamwork API clients via `DashboardSource` (fixtures by default; live with `DATA_SOURCE=live`) |
| Preferences | JSON-file store behind a `PreferencesStore` interface (swap for Postgres / Vercel KV in prod) |
| Hosting | Vercel (Node server) |

> Originally planned but **not** part of the shipped build: shadcn/ui, Framer Motion, Supabase, and the n8n → Supabase sync. See `STATUS.md` for the full current state.

## Constraints & decisions (locked)

- **Sales team is on Slack noise overload.** Notifications must be per-person DMs (not channel-wide), opt-in, admin-toggleable.
- **GitHub is the source of truth.** Repo: https://github.com/joeBrava/BravaOpsDashboard (supersedes the earlier local-only decision). Keep secrets out of the repo — see `.gitignore`.
- **QBO sandbox only during dev.** Production cutover deferred.
- **HubSpot is the system of record for deal status.** Phase 1 writes back to deal properties that Phase 2 reads.

## Status

See `STATUS.md` for current state.
