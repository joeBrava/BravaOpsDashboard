# Sales Dashboard — Visual Design Spec

**Date:** 2026-06-02
**Status:** Approved (visual direction)
**Scope:** Look-and-feel only — the visual design system and the Pipeline page layout for the Phase 2 sales dashboard. **No functionality, data, or auth in this spec.** Backend/data wiring is specced separately later.

> Naming note: this is the visually-rich sales dashboard described under "Phase 2" in `README.md`. We started it now because it's where look-and-feel matters most. The Phase 1 automation (QBO → HubSpot → Slack) and its admin settings page are unaffected.

---

## 1. Goal

Define a branded, professional look for the sales dashboard that deliberately avoids the generic "AI" aesthetic (neon gradients, glow, default purple-on-black). The design is anchored in the **Brava Brands / Biz Bricks** identity (style guide slides 7–8) and echoes the **businessbricks.com** feel: premium-meets-playful, neutral-forward, generous whitespace, card-based, rounded corners, subtle shadows.

Approved direction: **"Cockpit on cream"** — a deep-purple left sidebar (app shell) over a warm, slightly-neutral cream canvas, with white cards whose status is signalled by a colored left-edge.

---

## 2. Brand tokens

Colors sampled directly from the brand guide (slide 8, 60/30/10 rule). Saved as `.superpowers/brand/palette.json`.

### Primary (≈60% — purple + neutrals)
| Token | Hex | Use |
|---|---|---|
| `--purple` | `#7B43C4` | Primary actions, links, active states, logo |
| `--purple-deep` | `#5D279E` | Sidebar, hover/pressed, headings accents |

### Anchor neutrals
| Token | Hex | Use |
|---|---|---|
| `--navy` | `#002755` | Reserve / deep accent (used sparingly) |
| `--gray-dark` | `#50555B` | Body text, secondary labels |
| `--gray-mid` | `#A2A6AA` | Muted/meta text |
| `--gray-light` | `#D9D8D6` | Inactive dots, dividers, default card edge |
| `--ink` | `#23232A` | Primary heading/text color |
| `--cream` | `#F6F3ED` | App canvas background (v2 — slightly neutralized) |
| card / surface | `#FFFFFF` | Cards, top inputs |

### Secondary (≈30%) & Tertiary (≈10%) — used as **functional status colors only**
| Token | Hex | Semantic meaning |
|---|---|---|
| `--lime` | `#C2D500` | **Paid / unlocked / on-track** |
| `--gold` | `#FFCC00` | **Pending / awaiting / warning** |
| `--red` | `#F8384B` | **Blocked / unpaid** |
| `--coral` | `#FE647C` | Red alt (softer emphasis) |
| `--teal` | `#00AFAA` | **In production / informational** |

**Status tint pairs** (pill background / text), tuned for legibility:
- Paid: bg `#F1F5CE` / text `#5C6A00`
- Pending: bg `#FFF1C9` / text `#876A00`
- Blocked: bg `#FFE1E5` / text `#C20F2B`
- In production: bg `#D7F4F2` / text `#00726E`

**Discipline:** purple + neutrals dominate; lime/gold/red/teal appear only as status accents (dots, pills, card edges, stat icons). This 60/30/10 restraint is what keeps the bright brand colors from reading as "neon."

---

## 3. Typography

- **Display / headings:** Plus Jakarta Sans (700–800), tight letter-spacing (`-0.02em`) on large headings.
- **Body / UI:** Inter (400–600).
- Fallback stack: `system-ui, -apple-system, sans-serif`.
- Scale (approx): page title 1.5rem/800 · section heading 1rem/700 · deal name 1.02rem/700 · body 0.88rem · meta 0.78rem · uppercase labels 0.7rem with `0.04em` tracking.

---

## 4. Shape, depth & spacing conventions

- **Radius:** cards 15px · stat cards 15px · inputs/buttons 10–11px · pills & chips 999px (full).
- **Shadow:** soft and low — cards `0 4px 14px rgba(50,35,80,.05)`; app shell `0 18px 50px rgba(40,25,70,.16)`. No hard or neon glows.
- **Borders:** 1px warm-neutral hairlines (`~#EEE8DF`) on surfaces against cream.
- **Spacing:** generous; ~22–26px page padding, 12–14px gaps between cards/stats.
- **Status left-edge:** 5px colored border on the left of each deal card.

---

## 5. Layout — the app shell ("cockpit")

Two-column shell:

```
┌──────────┬─────────────────────────────────────────────┐
│ SIDEBAR  │  TOPBAR (title + date · search · + New)      │
│ (purple) ├─────────────────────────────────────────────┤
│          │  STAT ROW (4 summary cards)                  │
│ logo     │                                              │
│ nav…     │  SECTION HEAD (h3 + filter chips)            │
│          │  DEAL CARDS (stacked list)                   │
│ profile  │  PAYMENT TOAST (recent payment)              │
└──────────┴─────────────────────────────────────────────┘
```

### 5.1 Sidebar (≈212px, `--purple-deep`, subtle vertical gradient to `#52218C`)
- **Logo lockup** at top: white rounded "brick" mark + "Biz Bricks" wordmark (white).
- **Grouped nav** with small uppercase section labels ("Workspace", "Team"):
  - Workspace: Pipeline (active), All deals, Invoices (with count badge)
  - Team: Team view, Settings
- **Nav item states:** default = 80% white; active = translucent white pill (`rgba(255,255,255,.15)`) + lime accent on the item icon.
- **Profile** pinned to bottom: avatar (initials) + name + role, divided by a faint top border.

### 5.2 Topbar
- Left: page title (`Your Pipeline`, 1.5rem/800) + sub-line (date · deal count).
- Right: search field (white, rounded) + primary `＋ New` chip (purple).

### 5.3 Stat row
- 4 stat cards: icon tile (tinted to match meaning) + big number + uppercase label.
- Examples: Active (purple), Ready to move (lime), Blocked (red), Paid yesterday (teal).

### 5.4 Section head + filters
- `h3` "Active deals" on the left; pill filter chips on the right (`All` active = purple, `Ready`, `Blocked`).

### 5.5 Deal card (the core component)
Horizontal card, status-colored left-edge, containing:
- **Row 1:** deal name (display 700) + status pill (paid/pending/blocked/in-production).
- **Milestone row:** inline chips for Design / P1 / P2, each with a colored dot (lime paid · gold pending · gray not-started · red unpaid) and a check/short label.
- **Context line (muted):** current location (`📍 …`) + next step, or the blocker (`⚠️ …`).
- **Action (right):** ghost `View` for healthy deals; solid purple `Send reminder` when action is needed.

### 5.6 Payment toast
- Full-width lime-tinted strip beneath the list highlighting a recent payment (`💸 Yesterday — … cleared ($…)`).

---

## 6. Deal status model (visual states)

The card's left-edge color, status pill, and milestone dots are driven by one of these states:

| State | Edge | Pill | Meaning |
|---|---|---|---|
| In production | lime | teal "In Production" | Design + P1 paid; project is being built |
| On-track / ready | lime | (contextual) | Payments current, can move forward |
| Awaiting payment | gold | gold "Awaiting P1/P2" | A required payment is unpaid but not yet stalled |
| Blocked | red | red "Blocked" | Design or first-50% unpaid; phase cannot start |

Milestone dot legend: **lime** = paid · **gold** = pending/unpaid-recent · **red** = unpaid/overdue · **gray** = not yet applicable.

---

## 7. Out of scope (for this spec)

- All data, API, auth, and state management (real deals, HubSpot/QBO/Teamwork sync, Clerk/NextAuth).
- The per-deal detail page, invoices page, settings page (only referenced in nav).
- Responsive/mobile breakpoints — desktop layout defined here; mobile to be specced when we build.
- Framer Motion micro-interactions (named in the stack; not designed yet).
- The Phase 1 admin settings page and the Slack DM/digest visuals.

---

## 8. Reference artifacts

- Approved mockup: `.superpowers/brainstorm/5224-1780418409/content/hybrid-v2.html`
- Direction exploration: `…/content/visual-directions.html` (A Clean Studio / B Branded Cockpit / C Warm Editorial)
- Sampled palette: `.superpowers/brand/palette.json`
- Brand guide source: `~/Downloads/StyleGuide_BravaBrands_REV260327.pdf` (slides 7–8)
- Website reference: businessbricks.com

---

## 9. Next steps

1. User review of this spec.
2. (When ready) Implementation plan for a static, non-functional Next.js + Tailwind build of the Pipeline page — translating these tokens into Tailwind theme config + shadcn components, with mock data. No backend.
3. Later phases: per-deal detail page, then data wiring.
