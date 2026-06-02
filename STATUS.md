# Status

**Updated:** 2026-06-02

## Current state

**Phase 1:** Brainstorming complete. Design in progress. Not yet specced or built.

**Phase 2:** Brainstorming complete. Design deferred until Phase 1 ships.

## Decisions locked

- Phase 1 first, then Phase 2 (sequential, not parallel)
- Per-salesperson Slack DMs, not channel-wide digest
- Admin-toggleable opt-in for notifications (settings table somewhere)
- Real-time payment alerts default ON for deal owner
- Daily digest opt-in per salesperson
- Sales Manager gets all-team digest variant
- Web dashboard for Phase 2 (not Airtable/Retool/Slack canvas)
- Tech stack: Next.js + Tailwind + shadcn + Supabase + Vercel + Clerk/NextAuth

## Open questions

### Phase 1
- [ ] Where does the admin settings table live? (n8n Data Table vs Airtable vs Google Sheet vs HubSpot user property)
- [ ] What exactly is in the daily per-person digest? (mock + Sales Manager review needed)
- [ ] What HubSpot deal properties need to be created/used for payment status writeback?
- [ ] QBO webhook architecture: Invoice entity subscription vs Payment entity vs both?
- [ ] How to map HubSpot owner email → Slack user ID (manual map vs Slack lookup vs HubSpot integration)
- [ ] Should "yesterday's payments" appear in the digest, or only in the real-time alert moment?
- [ ] Do we want a CDC-polling fallback in case a webhook event is missed?

### Phase 2
- [ ] Auth provider: Clerk vs NextAuth + Google SSO
- [ ] Brand/visual direction — any Brava brand guide to follow?
- [ ] Mobile responsive requirements?
- [ ] What does the per-deal detail page actually show?
- [ ] Sales Manager view: same UI with extra filters, or separate dedicated view?
- [ ] Should the dashboard be embeddable inside HubSpot via app cards?
- [ ] Hosting: Vercel free tier OK, or do we need custom domain + SSL from day 1?

## Next actions

1. Walk through Phase 1 design → write spec to `docs/`
2. Sales Manager validation pass on Phase 1 digest mock
3. Build Phase 1 in n8n (extends existing `JA1et0DT7LnLEtdE` workflow OR new workflow — TBD)
4. Ship Phase 1, run it for a few weeks, observe what sales actually does with it
5. Phase 2 design kickoff (revisit dashboard requirements based on Phase 1 usage data)

## Related projects in BBProjects/

- `n8nAutomations/` — existing n8n workflow infrastructure; Phase 1 extends this
- `QBO2Hubspot/` — M1 sandbox orchestrator (reference for QBO API patterns)
- `Hubspot2Teamwork/` — pre-MVP project; some patterns reusable
