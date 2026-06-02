# Brainstorming notes — 2026-06-02

Joe + Claude. Initial brainstorm that spawned this project.

## Origin

Started as a side question during the n8n QBO M2 build: "What would be the best way to track when invoices get paid?" Quickly expanded into a broader sales-visibility problem.

## Joe's pain points (verbatim where useful)

- Currently checks QBO every day or every other day to see what's paid; marks them manually on a Teamwork project tracking invoices
- Sales has access to payment links but "a lot of invoices to keep track of"
- Sales struggles to read Teamwork projects and understand what stage a project actually is in
- The two payment milestones that matter most:
  - **Design invoice paid** → design phase can start
  - **First 50% paid** → production can start

## Audience

Sales team (multiple people), not just Joe. Sales Manager has weight as the validator/decider for design choices.

## What sales needs answered

1. "Can I tell the customer 'we've started designing'?" (design deposit paid)
2. "Can I tell the customer 'we've started production'?" (first 50% paid)
3. "Where exactly is this project right now?" (current Teamwork milestone/stage)
4. "What's the next step, and roughly when?" (next milestone)
5. "What's blocking forward motion?" (unpaid invoices, etc.)

## Key insight — the "Slack overload" reframe

Sales Manager told Joe: sales gets a LOT of Slack notifications. A channel-wide digest will be ignored.

This single piece of feedback reshaped the architecture:
- Digest must be **per-salesperson DM** (only their deals, ~5-15 lines, scannable)
- Notifications must be **opt-in and admin-toggleable**
- Dashboard becomes more important, not less — sales who opt out of digest still need somewhere to look

## Architecture sketch (Phase 1)

```
QBO (invoice paid)
    ↓ webhook
n8n payment-detection workflow
    ↓
1. Write status to HubSpot deal property (qbo_*_invoice_paid_at)
2. Look up deal owner → Slack ID
3. Look up owner's notification prefs (opt-in / opt-out)
4. If opted-in: send DM to owner only
5. If Sales Manager: also send to their feed
```

### Real-time alerts vs daily digest

Two channels of push:
- **Real-time payment alerts** — default ON, opt-out-able, DM to deal owner the moment a payment hits
- **Daily digest** — opt-in, per-salesperson DM at 9am, lists all their active deals with status

### Admin control surface

Settings table somewhere. Per-salesperson row with toggles for digest, payment alerts, manager_view. Candidate locations:
- n8n Data Table (already wired into n8n, easy to read; UI is mediocre)
- Airtable (cleanest admin UX, $0 free tier)
- Google Sheet (simplest, ugliest)
- HubSpot user property (lives with rest of user data; HubSpot user-prop UX is awkward)

**Open question** — pick one before building.

## Architecture sketch (Phase 2)

```
HubSpot ─┐
Teamwork ┼─→ n8n sync workflow ─→ Supabase (Postgres)
QBO     ─┘    (every 5-15 min)         ↑
                                       │ reads
                                       │
                              Next.js dashboard
                              (Vercel, Clerk auth)
                                       ↑
                                       │
                              Sales rep browser
```

### Page structure (rough)

- `/` — Pipeline overview, cards for active deals, filter by stage, search
- `/deals/[id]` — Full deal detail: timeline, invoices, milestones, photo refs
- `/invoices` — Sortable invoice list
- `/settings` — User notification prefs

### Visual / UX goals (Joe's words)

> "I really want to build a dashboard that acts like a real website and is visually attractive. I don't want something that is just lines and cells, this should look good and feel smooth for the salesmen to navigate. I'm willing to put the time in to build and perfect it in order to make it flow."

This pushed us away from Airtable/Retool/Slack-canvas → toward a real custom web app.

## Scope honesty

Phase 2 is a 60-80 hour project done right:
- Auth + user management: ~8 hrs
- Backend data sync (HubSpot/Teamwork/QBO → Supabase): ~12 hrs
- Core dashboard pages + per-deal detail: ~20 hrs
- Visual polish, micro-interactions, mobile: ~16 hrs
- Testing, deployment, iteration: ~8 hrs

Not building it in a weekend. Joe acknowledged the investment.

## Daily digest mockup (DM'd per-person)

```
🌅 Your Pipeline — Tuesday, June 2

You have 3 active deals.

🟡 Acme Corp Q3
   Design: ✅ paid  •  P1: ⏳ unpaid (sent 3d ago)
   📍 Design phase — Brick Selection in progress
   ⏭️  Next: First 50% payment to unlock production
   ⚠️  Production blocked until P1 paid → consider follow-up

🟢 Salt Lake Temple
   Design: ✅ paid  •  P1: ✅ paid  •  P2: ⏳ pending
   📍 In Production — Brick Selection complete
   ⏭️  Next: Production Form approval

🔴 Big Customer Logo
   Design: ⏳ unpaid (sent 8d ago) ⚠️
   📍 Waiting on design deposit
   ⚠️  Design phase blocked → strongly consider follow-up

💸 Yesterday: Salt Lake Temple — P1 paid ($4,250)

[Toggle digest off]
```

## Settings table shape (sketch)

```
| name        | slack_id  | hubspot_owner_id | digest_on | payment_alerts_on | manager_view |
|-------------|-----------|------------------|-----------|-------------------|--------------|
| Joe Zink    | U0123ABC  | 1234567          | ✅        | ✅                | ❌           |
| Miya Autry  | U0456DEF  | 7654321          | ❌        | ✅                | ❌           |
| Sales Mgr   | U0789GHI  | 9999999          | ✅        | ❌                | ✅           |
```

## Deferred questions (revisit later)

- "How long until this stage is done?" — would need historical baselines per tasklist. Hard. v2 of v2.
- Browser push notifications from the web app? Probably overkill if Slack is the push channel.
- Embeddable inside HubSpot as a custom card?
