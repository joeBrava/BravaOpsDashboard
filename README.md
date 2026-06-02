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

- See `phase1-payments/` for implementation
- See `docs/` for spec + design notes

### Phase 2 — Web dashboard (4–6 weeks)
A polished, branded web app for the sales team. Per-user authenticated view of their deals with full project timelines, invoices, and Teamwork milestone progression. Sales Manager gets all-team view.

- See `phase2-dashboard/` for implementation
- Built on top of the data foundation laid in Phase 1

## Tech stack (Phase 2)

| Layer | Pick |
|---|---|
| Framework | Next.js (App Router) |
| Styling | Tailwind CSS |
| Components | shadcn/ui |
| Animations | Framer Motion |
| Auth | Clerk *or* NextAuth + Google SSO |
| Database | Supabase (Postgres) |
| Hosting | Vercel |
| Data sync | n8n cron workflow → Supabase |

## Constraints & decisions (locked)

- **Sales team is on Slack noise overload.** Notifications must be per-person DMs (not channel-wide), opt-in, admin-toggleable.
- **GitHub is the source of truth.** Repo: https://github.com/joeBrava/BravaOpsDashboard (supersedes the earlier local-only decision). Keep secrets out of the repo — see `.gitignore`.
- **QBO sandbox only during dev.** Production cutover deferred.
- **HubSpot is the system of record for deal status.** Phase 1 writes back to deal properties that Phase 2 reads.

## Status

See `STATUS.md` for current state.
