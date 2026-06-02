# Phase 1 — Payment Tracking + Slack DMs

Detects invoice payments in QBO, writes status back to HubSpot deal properties, sends per-deal-owner Slack DMs in real time. Admin-toggleable per salesperson.

## Status

Brainstorm complete. Awaiting spec → plan → build.

## High-level architecture

```
QBO invoice paid
     ↓ webhook
n8n payment-detection workflow
     ↓
1. Verify webhook signature (Intuit signs payloads)
2. Fetch invoice details via QBO REST API
3. Determine paid milestone (-0 design / -1 P1 / -2 P2)
4. Write back to HubSpot deal property
5. Look up deal owner → settings → Slack ID
6. If opted-in: DM the owner
7. If Sales Manager exists: relay to manager feed
```

## Open design questions

See `../STATUS.md` for the full list.

## Build approach

Will likely extend the existing live n8n workflow `JA1et0DT7LnLEtdE` (HS→TW stage-2 + stage-7 + stage-8 chain) OR live as a sibling workflow that shares HubSpot/QBO credentials. To be decided during spec.

## Reference materials

- QBO v2 Custom Fields docs: see memory `reference_qbo_custom_fields_v2_enhancedAllCustomFields`
- QBO Webhooks setup: Intuit Developer dashboard → Webhooks tab
- Existing n8n M2 workflow patterns: `../../n8nAutomations/build/merged-workflow.ts`
