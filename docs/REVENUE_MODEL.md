# ART EYE — Revenue Model & Structure

*Your eye on the art world.* This document sets out how ART EYE makes money without
compromising the thing that gives it value: a trustworthy, editorial, ad-light agenda of
Sydney exhibitions. It covers the streams, the pricing, how they map onto the existing data
model, the rollout order, and the unit economics that make the numbers defensible.

Last updated: 2026-07-22 · Market: Sydney, AUD · Owner: @jadeXbracke

---

## 1. Principles (what we will and won't do)

ART EYE is a **two-sided, trust-first product**. Art lovers come for a clean, honest agenda;
venues come for the audience that agenda gathers. Every revenue decision protects that trust.

1. **The core agenda is always free and complete.** We never paywall *which shows exist* or
   *when they're on*. Discovery is the public good that grows the audience we later monetise.
2. **No display ad network.** No programmatic banners, no scraped placements. Money comes from
   people and venues who want to be here, clearly labelled when it's a paid placement.
3. **Paid placement is labelled and capped.** A promoted show is marked `SPONSORED` /
   `PARTNER` and can never outrank the editorial agenda's honesty (e.g. a closed show can't be
   promoted). Editorial picks (`is_featured`, curator's picks) are never for sale.
4. **Supply pays before demand.** Galleries and museums have budgets and get measurable value;
   they are the primary payer. Consumer subscriptions are a smaller, later, additive stream.
5. **Privacy is a feature, not inventory.** Individual watchlists/visits are never sold. Only
   privacy-preserving *aggregate* insight is ever a product (see §2.5).

---

## 2. Revenue streams

Five streams, in priority order. Streams **A** and **B** are the foundation; **C–E** layer on
once the audience and venue base are large enough to price them.

### A. Venue subscriptions (B2B SaaS) — primary

The supply side pays for a richer presence and for reach into a qualified, local, art-going
audience. Three tiers on top of a free claimed listing.

| Tier | Price (AUD) | Who it's for | What they get |
| --- | --- | --- | --- |
| **Listed** (free) | $0 | Every venue in the register | Public venue page, address + map, website/IG links, all their approved exhibitions in the agenda. This is the default and stays free forever. |
| **Claimed** | $29 / mo · $290 / yr | Small galleries & ARIs | Everything in Listed + owner account, self-serve exhibition submission, venue photo/video/reel, opening hours, "Claimed" tick, basic view stats. |
| **Pro** | $89 / mo · $890 / yr | Established commercial galleries | Everything in Claimed + up to 3 promoted-slot credits / mo, full analytics (saves, page views, "want to see" counts, direction taps), priority freshness pipeline, multiple concurrent exhibitions, verified badge. |
| **Institution** | $399 / mo · POA annual | Museums, art fairs, large galleries | Everything in Pro + always-on carousel eligibility, seasonal campaign support, co-branded curated guides, an editorial partner contact, aggregate audience insights (§2.5), multi-user accounts. |

Notes
- **ARIs and not-for-profits get Claimed at $0** (community rate) — they're editorial oxygen
  and rarely have budget. This is a deliberate cost, funded by the commercial tiers.
- Annual billing ≈ 2 months free; it's the default nudge for cash flow and retention.
- Free `Listed` venues are still fully discoverable — we never hold the audience hostage.

### B. Consumer membership — *ART EYE+* (freemium)

The demand side. Free tier is generous on purpose (it's the growth engine). Membership sells
depth for the committed collector/enthusiast, not access to the agenda.

| | Free | **ART EYE+** — $6.99 / mo · $49 / yr |
| --- | --- | --- |
| Browse full agenda, search, venue directory, maps | ✓ | ✓ |
| Save to *Want to see*, mark *Seen* with rating + reflection | ✓ | ✓ |
| Curator profile | ✓ | ✓ |
| Unlimited saves & log history | 60 saves | ✓ Unlimited |
| **Year in Review** + lifetime stats (shows seen, artists, venues, streaks) | — | ✓ |
| Private notes on shows + export your log (CSV / PDF) | — | ✓ |
| Early access to opening-night alerts & member events | — | ✓ |
| Personalised weekly "for you" agenda + closing-soon nudges | — | ✓ |
| Member-only guided gallery walks & talks (see §2.D) | discounted | included / priority |

- Positioning: **a membership for the art-going life**, closer to a museum membership than to
  a SaaS upsell. Founding-member annual price and a student rate ($29/yr) widen the top of funnel.
- Consumer revenue is modest early; its real job is **engagement and retention data** that make
  the venue analytics (Stream A) worth paying for.

### C. Promoted placements & campaigns (marketplace)

Discrete, labelled promotion — bought à la carte or drawn from Pro/Institution credits.

- **Promoted exhibition** — a show surfaces in the hero carousel rotation and the top of
  relevant filters for a fixed window. Marked `SPONSORED`. Priced by placement × duration
  (e.g. carousel week ≈ $180; filter-top week ≈ $60). Never shown for a closed show.
- **Opening-night push** — an opt-in push notification to nearby members who follow that
  venue/category, ahead of an opening (≈ $120 / send, frequency-capped per member).
- **Sponsored curated guide** — a partner-funded guide ("Sydney Contemporary week", a fair, a
  brand). Clearly bylined as a partner guide; editorial retains veto on inclusions. $2–15k per
  campaign depending on scope.

Guardrails: promoted inventory is capped as a share of each surface (e.g. ≤1 in 5 carousel
slots) so the app never *feels* sold. Auction/day-trip categories already exist in the data
model and are natural sponsored surfaces.

### D. Events & ticketing (commission)

ART EYE already gathers the exact audience venues want in a room. Turn that into events.

- **ART EYE guided walks / late-openings / artist talks** — we run or co-run small ticketed
  events; members get priority + a discount. $25–65 / ticket; venue keeps the space
  relationship, ART EYE takes the audience and a margin.
- **Ticketing pass-through for venues** — for ticketed exhibitions/openings, sell tickets
  in-app and take a **booking fee (~5–8% + $0.50)**. Reuses the one-tap-out pattern; can start
  as an affiliate link to the venue's existing ticketing before building native checkout.

### E. Insights & partnerships (later, high-margin)

- **Aggregate audience insights** for Institution venues and cultural bodies: which
  suburbs/segments a show drew, save-through vs. visit signals, seasonality — **always
  aggregated, never individual** (min cohort size enforced). Sold as a dashboard add-on or an
  annual report.
- **Tourism & cultural partnerships** — Destination NSW, City of Sydney, art fairs: sponsored
  city guides and "what's on" feeds. Grant/partnership funding also fits the not-for-profit
  side of the mission.

---

## 3. How this maps to the existing product

The current schema is already close — most of what a paid model needs is additive.

| Model concept | Existing hook | What's needed |
| --- | --- | --- |
| Who pays | `Role` (`user` / `venue_owner` / `admin`), `Venue.owner_user_id`, `is_claimed` | New billing state on the account/venue (plan, status, period). |
| Venue tier | `Venue.tier` ("editorial weight") — *keep separate* from the paid plan | Add a `plan` field; do **not** overload editorial `tier` with billing. |
| Promoted show | `Exhibition.is_featured` (editorial — stays free/manual) | Add a distinct `promotion` record (paid, labelled, time-boxed) so editorial picks and paid slots never collide. |
| Consumer limits | `WatchlistEntry`, `Visit` | Entitlement check (`maxSaves`) reads from the member's plan. |
| Analytics | page views, saves, direction taps already flow through the app | Aggregate + expose to Claimed/Pro/Institution venues. |
| Community rate | `VenueType = 'ari'`, `free_entry`, `category` | Auto-apply $0 Claimed to ARIs / not-for-profits. |

The typed plan and entitlement definitions live in
[`art-eye/src/lib/revenue/plans.ts`](../art-eye/src/lib/revenue/plans.ts) so the model is a
single source of truth the app can read (feature-gating) and a future billing integration
(RevenueCat for App Store consumer subs, Stripe for B2B invoicing) can map onto.

**Billing rails (recommendation):**
- **Consumer (ART EYE+):** Apple/Google in-app purchase via **RevenueCat** — App Store rules
  require IAP for digital consumer subscriptions; RevenueCat abstracts both stores + entitlements.
- **Venue B2B + campaigns:** **Stripe** (cards + invoices) — B2B SaaS sold outside the app
  store is permitted and avoids the 15–30% store cut on the higher-value tier.

---

## 4. Rollout (phased, lowest-risk first)

1. **Phase 0 — Instrument (now).** Ship analytics events (views, saves, direction taps) and the
   `plans.ts` entitlement layer *before* charging anyone. You can't sell analytics you don't
   collect, and you can't gate features you haven't defined.
2. **Phase 1 — Venue Claimed + Pro (Stream A).** The clearest value, the buyer with budget.
   Convert already-claimed venues first; they've shown intent. Target: paid venue base.
3. **Phase 2 — ART EYE+ (Stream B).** Launch membership once the log/curator features are
   worth paying for (Year in Review is the anchor). Founding-member annual pricing.
4. **Phase 3 — Promoted placements (Stream C).** Only once the audience is large enough that a
   slot is worth buying and the labelling/caps are built.
5. **Phase 4 — Events, ticketing, insights (D & E).** Higher-touch, higher-margin, and they
   compound on the audience and venue relationships built in 1–3.
6. **Phase 5 — City expansion.** The model is city-agnostic; Melbourne/Brisbane multiply
   Streams A–C on the same rails.

---

## 5. Unit economics (illustrative — replace with live data)

Rough, conservative Sydney-scale assumptions to sanity-check the model. **These are planning
figures, not results.**

**Venue side (Stream A)** — Sydney has ~140 venues in the register.
- Assume 90 claimable commercial venues; 35% reach a paid tier over 18 months → ~32 paying.
- Mix: 22 Claimed ($29), 8 Pro ($89), 2 Institution ($399) → ≈ **$2.1k MRR / $25k ARR** from
  subscriptions alone, before any campaign/promotion revenue.
- Near-zero marginal cost per venue (self-serve); gross margin > 85%.

**Consumer side (Stream B).**
- Assume 8,000 active free users at maturity; 4% convert to ART EYE+ → 320 members.
- Blended ~$55/yr (annual-weighted) → ≈ **$17.6k ARR**, *minus* ~15% store fee (RevenueCat +
  Apple small-business rate) → ≈ $15k net.

**Combined early target:** ≈ **$40k ARR** from subs, with Streams C–E as the growth lever on
top. The point of the model is that A carries the P&L while B compounds retention and B–E
compound on the audience — no single stream has to carry the product.

**Key levers to watch:** venue paid-conversion %, ART EYE+ free→paid %, promoted-slot fill
rate, and annual-vs-monthly mix (retention). Instrument these from Phase 0.

---

## 6. Risks & mitigations

| Risk | Mitigation |
| --- | --- |
| Paid placement erodes trust | Hard caps per surface, `SPONSORED` labelling, editorial picks never for sale, closed shows never promotable. |
| App Store takes 30% of consumer subs | Use small-business program (15%) + keep the high-value B2B tier on Stripe, outside IAP. |
| Venues won't pay in a thin market | Free `Listed` keeps everyone discoverable; charge only for reach + analytics that demonstrably move visits. Land Pro accounts on proven ROI. |
| ARIs priced out (mission risk) | $0 community Claimed rate for ARIs/not-for-profits, funded by commercial tiers. |
| Analytics = privacy concern | Only aggregate insight, enforced minimum cohort size; individual data never leaves the user. |
| Single-city ceiling | Rails are city-agnostic; expansion multiplies A–C without re-architecting. |

---

## 7. One-line summary

**Keep discovery free and honest; charge venues for reach and analytics, offer art lovers a
membership for depth, and layer labelled promotion, events, and aggregate insight on top —
in that order.**
