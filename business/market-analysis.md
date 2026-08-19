# ART EYE — Multidimensional Market Analysis

**Prepared:** 19 August 2026 · **Subject:** ART EYE (`jadexbracke/D-I-S-APP-`) — Sydney exhibition
agenda and gallery-going social network · **Horizon:** FY27–FY29

---

## How to read this document

Every quantitative claim is tagged:

| Tag | Meaning |
| --- | --- |
| **[F]** | **Fact** — externally sourced and cited in [Sources](#sources). |
| **[A]** | **Audit** — measured directly from this repository at the commit above. |
| **[E]** | **Estimate** — modelled here. Assumptions are stated inline; treat as a planning figure, not a finding. |

The analysis runs across nine dimensions. Each closes with a **verdict** and a
**confidence** rating. The strategic synthesis is in §10; the 90-day plan is in §11.

---

## 1. Executive summary

ART EYE is a Sydney-first exhibition agenda with a Letterboxd-style logging and social layer:
browse what is on, save to *Want to see*, mark *seen* with a rating and a reflection, and build a
public record on a *Curator* profile — with follows, a friends' activity feed, likes, comments and
direct messages on top **[A]**.

The product is materially further along than a prototype. It carries a hand-verified register of
**143 Sydney venues** (104 galleries, 23 museums, 16 artist-run initiatives), 61 verified
exhibitions, an editorial tiering system, a host control desk, venue self-service accounts, and a
nine-function AI discovery-and-enrichment pipeline whose proposals are gated behind human approval
**[A]**.

**The central finding is a scale mismatch, not a product problem.**

The product is good enough to win its category. The category, drawn at Sydney's borders, is too
small to be a venture business:

- **The demand ceiling is real but modest.** ~915,000 Greater Sydney adults attend visual arts
  more than once a year **[E]**, but the achievable three-year registered base for a single-metro,
  unfunded consumer app is **25,000–60,000** **[E]** — benchmarked against ArtRabbit, which after
  roughly a decade operating *globally* reports 215,000 users across web, newsletter and app **[F]**.
- **The transaction layer everyone else monetises does not exist here.** Most Sydney gallery entry
  is free, and ART EYE does not sell artworks. That structurally forecloses the two proven models
  in this space: the ticketing take-rate (Fever, DICE, Eventbrite) and the marketplace commission
  (Artsy, Ocula). Revenue must come from **attention, tools and data** — a harder, slower sale.
- **The arithmetic is unforgiving.** Sydney alone, executed well, is a **A$245k/year** business by
  FY29 in the base case **[E]** — high-margin and genuinely viable for one or two people, but not
  venture-scale.

**The unlock is the pipeline, not the audience.** The nine Supabase edge functions that discover
venues, discover exhibitions, validate facts, enrich press images and generate venue stories are
the most strategically valuable asset in the repository — not because they improve Sydney, but
because they drive the **marginal cost of adding a city toward zero** **[A]**. A city register that
would take an editor months to assemble by hand is what the incumbents (Art Almanac, print since
1974; Art Guide Australia) sell as their moat. ART EYE can manufacture one.

**Recommendation: Option B, sequenced through Option A** (§10). Spend twelve months proving a single
dense city — social density, first venue payers, one anchor institutional partnership — then use the
pipeline to add Melbourne at near-zero marginal cost. Do not pursue multi-city expansion before the
Sydney retention curve flattens above zero.

**The single largest gap between the product as built and the thesis it needs to prove is
distribution.** ART EYE ships today as a web export on GitHub Pages. EAS build configuration and
bundle identifiers exist, but there is no evidence in the repository of a shipped App Store or Play
Store listing **[A]**. A habit product — one whose entire value compounds through repeat logging —
without a home-screen icon and reliable push notifications cannot build the habit it is designed
around. This is the first thing to fix, ahead of any growth activity.

**Second largest gap: there is no analytics instrumentation of any kind in the dependency tree
[A].** Retention is the only metric that matters for this product, and it is currently unobservable.

---

## 2. Dimension 1 — Demand: who goes to galleries in Sydney, and how often

### 2.1 The top-down frame

| Layer | Figure | Basis |
| --- | --- | --- |
| Greater Sydney population | 5.64m | ABS ERP, June 2025 **[F]** |
| Adults (15+) | ~4.6m | ~82% of population **[E]** |
| Australians attending any live arts event, 2025 | 74% (15.4m people) | Creative Australia, highest since 2009 **[F]** |
| Visual arts & craft attendance (Victorian proxy) | 40% | National Arts Participation Survey, state results **[F]** |
| Sydney adults attending visual arts ≥1×/yr | **~1.7m** | 4.6m × ~37% (band: 30–40%) **[E]** |

The macro signal is genuinely favourable. Arts attendance in Australia is at its **highest recorded
level since the survey began in 2009** **[F]**, and 98% of Australians engage with the arts in some
form **[F]**. Demand is not the constraint.

### 2.2 The frequency segmentation — where the product actually lives

Annual reach is the wrong denominator. ART EYE is a **logging** product: its value compounds only for
people who visit often enough for a record to feel worth keeping. Segmenting the ~1.7m by frequency
**[E]**:

| Segment | Visits/yr | Share of adults | Sydney adults | Fit with ART EYE |
| --- | --- | --- | --- | --- |
| **Devotees** | 6+ | ~6% | ~275,000 | **Core.** A log is meaningful; social feed has substance. |
| **Regulars** | 2–5 | ~14% | ~640,000 | **Reachable.** Agenda is useful; logging is thin but plausible. |
| Occasional | 1 | ~17% | ~780,000 | Poor. Blockbuster-driven; will not return to an app. |
| Non-attending | 0 | ~63% | ~2.9m | Out of scope. |

**SAM (Serviceable Available Market) = Devotees + Regulars ≈ 915,000 Sydney adults [E].**

### 2.3 The reachable share

Consumer discovery apps in a single metropolitan area, without paid acquisition, do not convert
large fractions of their SAM. The relevant benchmark is ArtRabbit: **215,000 users across website,
newsletter and app** after roughly a decade operating across many international cities **[F]**.
Sydney is one city.

| Scenario | FY29 registered | FY29 MAU | % of SAM |
| --- | --- | --- | --- |
| Bear | 12,000 | 2,500 | 1.3% |
| **Base** | **30,000** | **9,000** | **3.3%** |
| Bull | 60,000 | 21,000 | 6.6% |

All **[E]**. The base case assumes App Store distribution shipped, push notifications working, and
one anchor institutional partnership driving awareness.

### 2.4 The cost tailwind — an underexploited asset

**60% of Australians cite cost as the biggest barrier to arts attendance, and more than half missed
events they wanted to attend because of cost [F].**

This is the most actionable demand finding in the document, and ART EYE is already sitting on the
data to exploit it. The venue schema carries a `free_entry` flag **[A]**. The overwhelming majority
of Sydney's commercial galleries and ARIs are free to enter — a fact that the cost-barrier
population does not know, because "art gallery" reads as "ticketed museum."

**A "Free this weekend" surface is the highest-leverage acquisition feature available**, and it is
close to already built. It converts the sector's single biggest stated barrier into the product's
single clearest promise, and it is a promise no ticketing-economics competitor can profitably make.

> **Verdict:** Demand exists, is at a historic high, and is well-segmented by the product's own
> design. The constraint is not appetite — it is that the deeply-engaged core in one city is
> ~275,000 people. **Confidence: High** on direction, **Medium** on the frequency split (modelled
> from a Victorian visual-arts proxy, not a Sydney-specific measurement).

---

## 3. Dimension 2 — Supply: the venues, and whether they can pay

### 3.1 The register as built

| Venue type | Count | Share |
| --- | --- | --- |
| Gallery | 104 | 73% |
| Museum | 23 | 16% |
| Artist-run initiative (ARI) | 16 | 11% |
| **Total** | **143** | |

All **[A]**. Venues additionally carry editorial category tags (institution, public, commercial,
ARI, First Nations, event, day trip, auction) and an editorial weight tier from 1 to 4 **[A]**.

**This register is the most defensible asset in the business** (§8). It includes lat/long, opening
hours with a `hours_checked` verification date, founded year with an `entry_checked` date, website,
Instagram handle and free-entry status **[A]**. No competitor publishes Sydney at this resolution,
and critically, none of them cover ARIs and First Nations spaces with the same seriousness as blue-chip
commercial galleries.

### 3.2 The sector's financial condition

The supply side is under real strain, and this cuts both ways:

- **National industry revenue: A$2.6bn (2026), growing 0.4% annualised** over the five years to
  FY26 — effectively flat in real terms **[F]**.
- **Business count: 1,078, declining at a 1.5% CAGR since 2021** **[F]**. The sector is
  consolidating, not expanding.
- **Sydney Contemporary — the market's bellwether — has now seen four consecutive years of declining
  sales:** A$23m (2022) → A$21m (2023) → A$17.5m (2024) → **A$16m (2025)**, despite record
  attendance of 26,440 and 116 exhibitors **[F]**.
- **ARIs and non-commercial spaces are closing** under rent and property pressure, offset partially
  by the City of Sydney's A$35.6m annual cultural investment and its creative spaces program
  (Firstdraft, Alaska, 107 Projects) **[F]**.

The Sydney Contemporary divergence is the key datum: **attendance up, sales down.** Galleries are
getting bodies through doors and not converting them. That is precisely the problem an attendance
platform is positioned to speak to — but it also means the budget available to pay for solving it is
shrinking.

### 3.3 Willingness to pay

| Payer class | Sydney count **[E]** | Realistic price | Rationale |
| --- | --- | --- | --- |
| Blue-chip commercial galleries | ~25 | A$99–149/mo | Have marketing budgets; already advertise in Art Almanac / Art Guide. |
| Mid-tier commercial galleries | ~50 | A$49–79/mo | Price-sensitive; need a demonstrated referral before paying. |
| Auction houses | ~15 | A$149–249/mo | Highest budgets; but audience fit is collectors, not attendees. |
| Public institutions & museums | ~20 | A$300–500/mo | Buy audience-development, not listings; slow procurement, large cheques. |
| ARIs & First Nations spaces | ~33 | **A$0 — free forever** | No budget. Their presence is what makes the register credible. |

**Total realistic payer pool: ~90–110 venues in Sydney [E].**

> **Verdict:** The supply side is well-mapped and strategically covered, but financially stressed
> and numerically small. Ninety payers at A$79/month is A$85k/year at 100% penetration — which will
> never happen. **Venue SaaS is a credibility and retention product, not the revenue engine.**
> **Confidence: High** on the register; **Medium** on price points (no pricing research conducted —
> see §11).

---

## 4. Dimension 3 — Competition

### 4.1 The map

Two axes matter: **what the platform is for** (transacting art vs. attending it) and **who
generates the content** (publisher vs. community).

```
                        TRANSACTIONAL
                              │
              Artsy ●         │        ● Auction houses
                              │          (Smith & Singer, Menzies,
              Ocula ●         │           Deutscher + Hackett)
                              │
  PUBLISHER ─────────────────┼───────────────────── COMMUNITY
                              │
     Art Almanac ●            │      ● ArtRabbit
     Art Guide AU ●           │
     Time Out / Broadsheet ●  │           ★ ART EYE
                              │
     Google Maps ●            │      ● Instagram
                              │
                        ATTENDANCE
```

**ART EYE occupies the empty quadrant: attendance-focused and community-generated.** That is a real
position, and it is unoccupied in Australia. It is not, however, unoccupied globally.

### 4.2 Threat assessment

| Competitor | What they are | Threat | Why |
| --- | --- | --- | --- |
| **Instagram** | Where galleries actually publish | **Critical — but not defeatable** | Every venue's real audience lives here. ART EYE cannot win a head-on fight and should not try. |
| **ArtRabbit** | Global attendance platform, 215k users **[F]** | **High** | Relaunched its app in June 2026 with saved shows, interactive maps, followed artists and venues, and **personal art stats** **[F]** — the logging wedge. If they add a social graph and enter Australia, ART EYE's differentiation narrows to editorial depth. |
| **Art Guide Australia / Art Almanac** | Incumbent AU listings; Almanac in print since 1974, 1,700-artist database **[F]** | **Medium (High on B2B)** | Weak product, no logging, no social — poor consumer competitors. But they **own the gallery advertising relationship**, which is the exact budget ART EYE must capture. |
| **Google Maps** | Where "gallery near me" happens | **Medium** | Owns the navigational query. Cannot be beaten; can be complemented (the app already builds Maps deep-links **[A]**). |
| **Time Out / Broadsheet / Concrete Playground** | General lifestyle "what's on" | **Medium** | Vastly larger traffic; captures the casual searcher. Shallow on art — no ARIs, no First Nations spaces, no tiering. |
| **Artsy / Ocula** | Global transactional / editorial-commercial | **Low** | Different job. Selling artworks, not organising a Saturday. |
| **Eventbrite / Humanitix** | Ticketing | **Low** | Sydney gallery entry is mostly free; there is no ticket to sell. |

### 4.3 The Instagram question — the most important strategic call

Instagram is not a competitor to displace. It is **the distribution layer ART EYE must sit on top
of.** Galleries will not stop posting there, and audiences will not stop discovering there.

The product already understands this instinctively: venues store an `instagram` handle, and both
venues and exhibitions carry a `reel_url` for Instagram Reels and TikToks **[A]**. This is the
correct architecture. The strategic articulation should be explicit:

> **Instagram tells you a show exists. ART EYE tells you it is open on Saturday, free to enter,
> twelve minutes from the last one, and that three people you follow rated it.**

That is a genuine complement, not a substitute — and it is a defensible pitch to venues, who
currently have no way to know whether an Instagram post produced a visit.

> **Verdict:** ART EYE holds a real, unoccupied position in the Australian market and a credible
> one globally. The primary threat is ArtRabbit's international scale reaching Australia before ART
> EYE reaches density; the primary commercial obstacle is Art Almanac and Art Guide's incumbency
> with gallery advertising budgets. **Confidence: High.**

---

## 5. Dimension 4 — Product & capability audit

Measured directly from the repository **[A]**:

| Layer | Status | Notes |
| --- | --- | --- |
| **Agenda & discovery** | Strong | 143 venues, 61 exhibitions, editorial tiering, area groupings (City, East, Inner West, North, Greater Sydney, Day Trips), map, search, filters (opening/closing soon, museums/galleries/ARIs). |
| **Logging & curation** | Strong | Want-to-see watchlist, seen + 1–5 rating + written reflection, Curator profile, visit counts. **This is the differentiated core.** |
| **Social graph** | Strong (built) / Unproven (used) | Follows with private-profile approval, blocking, activity feed, likes, threaded comments, mentions, DMs restricted to mutual follows, notification centre, push. |
| **Editorial** | Strong | Curated guides by artists, gallerists and editors; curator's picks; venue stories; hero carousel. |
| **Venue self-service** | Strong | Venue accounts manage their own page, photos, links, hours; submit exhibitions into a review queue. |
| **Host control** | Strong | Full admin desk over venues, exhibitions and submissions, double-gated by UI role and Postgres RLS. |
| **Content pipeline** | **Exceptional** | Nine edge functions: `discover-venues`, `discover-exhibitions`, `validate-venues`, `enrich-images`, `enrich-press-images`, `image-candidates`, `venue-stories`, `queue-digest`, `send-push`. Proposals carry evidence URLs and confidence scores, and are **never applied without owner approval**. |
| **Fairs** | Thin | 3 fairs (Sydney Contemporary, Darwin Aboriginal Art Fair, Cairns Indigenous Art Fair). Framed as international; currently domestic-only. |
| **Analytics** | **Absent** | No analytics library in the dependency tree. Retention is unobservable. |
| **Store distribution** | **Absent** | Web export on GitHub Pages. `eas.json` and iOS/Android bundle IDs (`com.arteye.app`) are configured, but no shipped store listing is evidenced. |
| **Monetisation** | **Absent** | No pricing, billing, subscription or payment code anywhere in the repository. |

### 5.1 The three gaps that matter

1. **Distribution.** A logging habit needs a home-screen icon and push. A PWA on a project-pages URL
   gets neither reliably. This is the binding constraint on every demand projection in §2.
2. **Instrumentation.** The only metric that determines whether this business exists is **logged
   visits per active user per month**. It is currently unmeasurable.
3. **The empty-feed problem.** A social feed with a few hundred users in one city is a room with
   nobody in it. The mitigation is already built — curated guides by named artists, gallerists and
   editors **[A]** — but it must be *the* seeded feed strategy, not a secondary feature.

> **Verdict:** The product is substantially complete and, in the content pipeline, genuinely
> distinctive. Every remaining gap is a distribution or measurement gap, not a feature gap.
> **Confidence: High** (measured directly).

---

## 6. Dimension 5 — Economics & monetisation

### 6.1 The structural constraint

Two proven models in adjacent categories are **unavailable** to ART EYE:

- **Ticketing take-rate** (Fever, DICE, Eventbrite) — foreclosed, because most Sydney gallery entry
  is free. The product's own `free_entry` flag documents this **[A]**.
- **Marketplace commission** (Artsy, Ocula) — foreclosed, because ART EYE does not transact
  artworks and moving into sales would put it in direct conflict with the galleries it needs as
  suppliers.

What remains is **attention, tools and data.** This is a slower, more relationship-dependent revenue
base. It should be planned for as such.

### 6.2 The five viable lines, ranked by near-term cash

| # | Line | FY29 base **[E]** | Effort | Notes |
| --- | --- | --- | --- | --- |
| 1 | **Institutional & fair partnerships** | A$100,000 | Medium | 4 × ~A$25k. Anchor tenants: AGNSW (2.4m visitors in 2025 **[F]**), MCA, Carriageworks / Sydney Contemporary (26,440 attendees **[F]**). **Largest near-term cheques and the strongest credibility signal.** |
| 2 | **Venue subscriptions** | A$52,000 | High | ~24 commercial @ A$99/mo + ~5 institutions @ A$400/mo. Free forever for ARIs. |
| 3 | **Consumer subscription (Patron)** | A$54,000 | Low | 30,000 registered × 4% × A$45/yr. High margin, brand-affirming, small. |
| 4 | **Destination & city partnerships** | A$40,000 | Medium | Destination NSW, City of Sydney (A$35.6m annual cultural spend **[F]**). Art-tourism itineraries. |
| 5 | **Data & insight** | A$0 (FY29) | Low now | Attendance and interest signals sold back to venues. **Needs scale first — do not attempt before ~15k MAU.** |
| — | Affiliate / ticketing | ~A$0 | — | Structurally unavailable. Do not build. |

### 6.3 Three-year scenarios (Sydney-led)

| | FY27 | FY28 | FY29 |
| --- | --- | --- | --- |
| **Bear** — Sydney only, no venue traction | A$8k | A$35k | **A$85k** |
| **Base** — Sydney dense + Melbourne partial | A$25k | A$110k | **A$245k** |
| **Bull** — 4 cities, 2 anchor partners, 1,800 paid consumers | A$45k | A$240k | **A$620k** |

All **[E]**.

### 6.4 The cost structure — the genuinely good news

Direct operating cost at these volumes is very low: Supabase, Expo/EAS and hosting land around
**A$1,200–3,000/year**, plus perhaps **A$3,000–6,000/year** in AI inference for the discovery and
enrichment pipeline **[E]**. Contribution margin exceeds 90%.

**The binding constraint is founder time, not capital.** That reframes the entire strategic question
(§10): ART EYE does not need funding to survive. It needs funding only if it chooses to be large.

> **Verdict:** Revenue must come from partnerships first and tools second, with consumer
> subscription as a high-margin garnish. Sydney alone supports a real, profitable
> A$150–250k/year independent business — and nothing more. **Confidence: Medium** (pricing is
> unvalidated; the partnership line depends on relationships not yet in evidence).

---

## 7. Dimension 6 — Go-to-market

### 7.1 The cold-start sequence

This is a two-sided product, and the sides do **not** need to be solved simultaneously. Supply is
already solved — the register exists **[A]**. That is an enormous head start and should be spent
deliberately.

**Phase 1 — Density before breadth (months 0–6).**
Do not add cities. Do not add venues. Make the Sydney feed feel inhabited. Target: **500 people who
log at least one visit a month.** The mechanism is editorial — commission curated guides from named
Sydney artists, gallerists and curators (the feature is built) and let the guide be the reason
someone opens the app for the first time and the social feed be the reason they open it the eighth.

**Phase 2 — Monetise the relationship, not the traffic (months 6–12).**
Land **one** anchor institutional partnership. It matters more as a reference than as revenue: it is
what converts the venue sale from cold outreach into an inbound conversation.

**Phase 3 — Replicate the city (months 12–24).**
Only now run the pipeline against Melbourne. The strategic claim of this business is that adding a
city costs near-zero; Phase 3 is where that claim is either proved or falsified.

### 7.2 Channel assessment

| Channel | Verdict | Reasoning |
| --- | --- | --- |
| **Venue Instagram cross-posting** | **Primary** | 143 venues each with an audience; a curated guide featuring a gallery is a thing that gallery will happily share. Zero CAC. |
| **Editorial guides by named figures** | **Primary** | Solves the empty-feed problem *and* the acquisition problem with one asset. |
| **Anchor institutional partnership** | **Primary** | AGNSW alone drew 2.4m visitors in 2025 **[F]**. |
| Art fairs (Sydney Contemporary, Sept) | Secondary | 26,440 highly-qualified attendees in four days **[F]**. A hard date to build toward. |
| Universities (COFA/UNSW, NAS, SCA) | Secondary | The `student` profile type already exists **[A]**. Cheap, high-density, seasonal. |
| Paid social | **Avoid** | CAC cannot be recovered against a A$45/yr consumer ARPU. |
| SEO / general listings | **Avoid** | Time Out and Broadsheet have already won this query. |

> **Verdict:** GTM should be editorial and relationship-led, not paid. Supply is solved; the entire
> effort goes to density in one city. **Confidence: High** on sequence, **Medium** on timing.

---

## 8. Dimension 7 — Moat & defensibility

Ranked by durability:

1. **The verified register (Strong, and available now).** 143 Sydney venues with type, editorial
   category, editorial tier 1–4, coordinates, hours + verification date, founded year +
   verification date, free-entry status, website and Instagram **[A]**. Rebuilding this by hand is
   months of work. The `hours_checked` / `entry_checked` discipline is the actual moat — not the
   list, but the *freshness guarantee*.

2. **The pipeline (Strong, and strategically decisive).** Nine edge functions that discover,
   validate and enrich, with evidence URLs, confidence scores and mandatory human approval **[A]**.
   This converts a fixed editorial cost per city into a near-zero marginal one. **It is the reason
   this business could be larger than Sydney.**

3. **Editorial taste & coverage (Medium-strong).** The tiering system, and the decision to cover
   ARIs and First Nations spaces alongside blue-chip galleries, is a legitimacy asset that a
   listings aggregator cannot fake. Australian arts audiences are acutely sensitive to who gets
   left out.

4. **Brand (Medium).** The ARTEYE wordmark as a bespoke image asset, ink `#131211` on white, thin
   hairlines, no other colours **[A]**. Disciplined and distinctive in a category of visual noise.

5. **The social graph (Weak today, strongest if it ever compounds).** Follows, feeds, DMs and
   mutual-follow gating are all built **[A]**, but a graph with no density has no switching cost.
   This is the highest-ceiling, lowest-current-value asset. Letterboxd is the proof that it can
   become the whole company: 30m+ members by June 2026 (up 10m in a year), valued at ~US$50m in
   2023 and reportedly seeking ~US$250m in a 2026 sale process **[F]**.

> **Verdict:** Two genuinely strong moats today (register, pipeline), one potentially decisive one
> tomorrow (graph). **Confidence: High.**

---

## 9. Dimension 8 — Risk & compliance

| # | Risk | Severity | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| 1 | **No store distribution** — habit product without home-screen presence or reliable push | **Critical** | Certain (present) | Ship iOS via EAS. Config already exists **[A]**. Highest-priority action. |
| 2 | **Cold-start / empty feed** | **Critical** | High | Editorial guides as the seeded feed. Do not open a second city first. |
| 3 | **Single-market revenue ceiling** (~A$245k FY29 base) | High | High | The pipeline. Prove Melbourne replication in FY28. |
| 4 | **ArtRabbit enters Australia** or adds a social graph | High | Medium | Their June 2026 relaunch already ships personal art stats **[F]**. Defend on editorial depth and the social layer; move fast on density. |
| 5 | **Incumbent B2B lock-in** (Art Almanac / Art Guide own gallery ad budgets) | Medium | High | Do not compete on listings advertising. Sell measurable attendance attribution — a thing print cannot offer. |
| 6 | **Content freshness / trust** — wrong dates or hours destroy trust irrecoverably | High | Medium | Already mitigated by `hours_checked` / `entry_checked` and the human-approval gate **[A]**. Publish the freshness guarantee as a user-facing promise. |
| 7 | **Demo-mode reversion** — rebuilding `docs/` without Supabase credentials silently reverts the live site to browser-local storage, destroying user data | **Critical** | Low (controls in place) | Documented in `CLAUDE.md`; CI workflow holds credentials. **Do not hand-build.** Add a post-deploy assertion that the build stamp is present. |
| 8 | **Key-person concentration** — one host/admin account; role settable only in the database | Medium | Certain | Acceptable now. Document a succession path before any partnership contract. |
| 9 | **UGC moderation & privacy** — DMs, comments, private profiles, mentions, blocking, user photos | Medium | Medium | Blocking, mutual-follow DM gating and a feedback/report inbox are built **[A]**. Before scale: a published moderation policy, a Privacy Act–compliant privacy policy, and a documented takedown process. Store distribution will require these anyway. |
| 10 | **Sector contraction** — flat industry revenue, 1.5% annual decline in business count, four straight years of falling fair sales **[F]** | Medium | High | Reinforces partnerships-over-SaaS. Budget shrinkage is a sector-wide fact, not a sales objection to overcome. |

> **Verdict:** No existential product risk. The critical risks are distribution (fixable in weeks)
> and cold-start density (fixable in months). The strategic risk is the single-market ceiling.
> **Confidence: High.**

---

## 10. Dimension 9 — Strategic options & synthesis

### 10.1 Scorecard

| Dimension | Market attractiveness | ART EYE's position | Confidence |
| --- | --- | --- | --- |
| Demand | ●●●○○ Historic-high attendance, small deep core | ●●●●○ Segmentation built into the product | High |
| Supply | ●●○○○ Financially stressed, consolidating | ●●●●● 143 venues, best-in-market coverage | High |
| Competition | ●●●●○ Unoccupied quadrant in AU | ●●●●○ Real position; ArtRabbit is the threat | High |
| Product | — | ●●●●○ Complete but undistributed, unmeasured | High |
| Economics | ●●○○○ No transaction layer to tax | ●●○○○ No monetisation built | Medium |
| GTM | ●●●●○ Zero-CAC channels available | ●●●○○ Supply solved, demand unproven | Medium |
| Moat | — | ●●●●○ Register + pipeline are genuinely strong | High |
| Risk | — | ●●●○○ Two critical but fixable gaps | High |

### 10.2 The three options

**Option A — Sydney-deep independent.**
Target A$150–250k/year, one to two people, >90% margin. Low risk, fully self-funding, achievable
without outside capital. **Ceiling: it never becomes more than this.**

**Option B — Pipeline-led multi-city rollup.**
Prove Sydney, then use the discovery pipeline to add Melbourne, Brisbane and Auckland at near-zero
marginal cost, then international art cities. Target A$1–2m by FY31. Requires App Store
distribution, analytics, and probably a small raise. **The pipeline is what makes this credible
rather than aspirational.**

**Option C — Build the strategic asset.**
Build the definitive Australian art-attendance dataset and audience, and sell to an incumbent
(Art Almanac's publisher, Ocula, ArtRabbit, a fair operator, or a media/tourism group). Letterboxd
is the pattern: ~US$50m in 2023 to a reported ~US$250m ask in a 2026 auction run by LionTree, with
Netflix, Paramount, Sony and multiple private-equity firms at the table **[F]**. Taste-graph assets
in culture verticals command real multiples.

### 10.3 Recommendation

**Pursue Option B, sequenced through Option A.**

Option A is not a lesser ambition — it is the *first twelve months of* Option B, and it is
self-funding. Spend those months proving exactly three things:

1. **Retention.** Logged visits per active user per month, flat or rising over six months. If this
   curve decays to zero, the social thesis is false and the correct product is a very good listings
   site — a decision worth reaching quickly and cheaply.
2. **Willingness to pay.** Ten paying venues, at any price. The number matters less than the fact.
3. **Replication cost.** Melbourne's register assembled by pipeline, measured in operator-hours. If
   it is under 40 hours, Option B is real. If it is over 200, it is not.

Option C remains available throughout and is *strengthened*, not compromised, by executing B — the
register, the pipeline and the graph are precisely the assets an acquirer would be buying.

**Do not raise capital before those three proofs.** The cost structure does not require it, and
raising against unproven retention prices the company on hope.

---

## 11. The 90-day plan

| # | Action | Why | Success measure |
| --- | --- | --- | --- |
| 1 | **Ship to the App Store** (and Play) via the existing EAS config | Every demand projection assumes a home-screen icon and working push | Listing live; push delivery >90% |
| 2 | **Instrument retention** — a lightweight analytics layer | Retention is currently unobservable; it is the only metric that decides the business | D1/D7/D30 and logged-visits-per-MAU dashboards live |
| 3 | **Ship "Free this weekend"** | Converts the sector's #1 stated barrier (cost, 60% **[F]**) into the product's clearest promise, using the `free_entry` data already held | Feature is the top non-home entry point |
| 4 | **Commission 6 editorial guides** from named Sydney artists, gallerists and curators | Solves empty-feed and acquisition with one asset; feature already built | 6 published; each cross-posted by its author |
| 5 | **Open the anchor-partner conversation** — AGNSW, MCA, Carriageworks | Largest near-term cheque; the reference that unlocks the venue sale | 3 conversations opened, 1 proposal issued |
| 6 | **Run 15 venue pricing interviews** | Every price in §6 is modelled, not validated | Validated price points for two tiers |
| 7 | **Publish privacy, moderation & takedown policies** | Required for store review; required before any institutional contract | Published and linked in-app |
| 8 | **Time-box a Melbourne pipeline dry run** | Falsifies or proves the entire Option B thesis for the cost of a week | Operator-hours to a 100-venue register, measured |

### KPI dashboard

| Metric | Today | 90-day target | FY29 base **[E]** |
| --- | --- | --- | --- |
| Registered users | Unmeasured | 2,000 | 30,000 |
| Monthly active users | Unmeasured | 600 | 9,000 |
| **Logged visits / MAU / month** | Unmeasured | **1.5** | **2.5** |
| D30 retention | Unmeasured | 20% | 30% |
| Venues in register | 143 **[A]** | 160 | 400 (multi-city) |
| Paying venues | 0 | 5 | 29 |
| Paying consumers | 0 | 40 | 1,200 |
| Annual revenue | A$0 | A$10k run-rate | A$245k |

---

## 12. Bottom line

ART EYE has built the hard part. The register is real, the pipeline is genuinely distinctive, the
editorial position is defensible, and the product occupies a quadrant nobody in Australia holds.
Demand is at a historic high and the sector's own bellwether shows exactly the problem this product
addresses — **attendance rising while sales fall.**

The two things standing between the product as built and the business it could be are neither
expensive nor conceptual: **it is not on a phone, and it is not measured.** Both are weeks of work.

The strategic question is narrower than it looks, and it resolves to a single number: **logged
visits per active user per month.** If that number holds above two, the social graph compounds, the
data product becomes sellable, and the pipeline turns one city into ten. If it decays toward zero,
ART EYE is an excellent listings publication with an unusually good database — a real business,
worth A$150–250k a year, but a different one.

Six months of instrumented operation in one dense city will answer it. Nothing should be raised,
expanded or committed until it does.

---

## Sources

**External**

- [The Art Basel and UBS Global Art Market Report 2026 — Art Basel](https://www.artbasel.com/stories/the-art-basel-and-ubs-global-art-market-report-2026?lang=en) — global sales US$59.6bn in 2025 (+4%); dealer US$34.8bn; auction US$20.7bn; US 44% share; 2022 peak US$68.1bn.
- [Art Basel & UBS Art Market Report 2026 (full PDF, Arts Economics)](https://theartmarket.artbasel.com/download/The-Art-Basel-and-UBS-Art-Market-Report-2026-by-Arts-Economics.pdf)
- [Art Galleries & Museums in Australia — Market Size, IBISWorld (2026)](https://www.ibisworld.com/australia/market-size/art-galleries-and-museums/644/) — A$2.6bn industry; 0.4% annualised growth to FY26.
- [Art Galleries & Museums in Australia — Number of Businesses, IBISWorld (2026)](https://www.ibisworld.com/australia/number-of-businesses/art-galleries-museums/644/) — 1,078 businesses; −1.5% CAGR 2021–26.
- [More Australians attending arts than ever, but cost is a growing barrier — Creative Australia](https://creative.gov.au/news-events/news/more-australians-attending-arts-ever-cost-growing-barrier) — 74% attendance (15.4m people), highest since 2009; 60% cite cost; 98% engage.
- [The National Arts Participation Survey: State and Territory Results — Creative Australia](https://creative.gov.au/research/national-arts-participation-survey-state-and-territory-results) — 40% Victorian visual arts & craft attendance (used as proxy).
- [The world's 100 most visited art museums in 2025 — The Art Newspaper](https://www.theartnewspaper.com/2026/03/31/exclusive-the-worlds-100-most-visited-museums-in-2025-new-museums-a-big-hit-with-visitors) — AGNSW 2.4m visitors, 2025.
- [Sydney Contemporary art fair sees fourth year of decline in sales — The Art Newspaper](https://www.theartnewspaper.com/2025/09/24/sydney-contemporary-art-fair-sees-fourth-year-of-declining-sales) — 26,440 attendees; A$16m sales; 116 exhibitors; prior years A$17.5m / A$21m / A$23m.
- [ArtRabbit App Relaunches as the Complete Companion for Exploring Art and Cities — ArtRabbit](https://www.artrabbit.com/network/features/2026/june/artrabbit-app-relaunches-as-the-complete-companion-for-exploring-art-and-cities) — June 2026 relaunch; maps, saved shows, followed artists/venues, personal art stats.
- [The New York Times Named ArtRabbit a Leading Art Discovery Platform — ArtRabbit](https://www.artrabbit.com/network/features/2025/november/the-new-york-times-named-artrabbit-a-leading-art-discovery-platform-heres-why-that-matters) — 215,000 users across web, newsletter and app.
- [Art Almanac — About Us](https://www.art-almanac.com.au/almanac/about-us/) — established 1974; 11 issues/year; 1,700-artist database.
- [Art Guide Australia](https://artguide.com.au/)
- [Letterboxd Sale: As Corporate Buyers Circle, An Underdog Bidder Surfaces — Deadline](https://deadline.com/2026/07/letterboxd-sale-instrinsic-underdog-bidder-1236980779/) — ~US$250m ask; LionTree-run auction; Netflix, Paramount, Sony, RedBird, TPG.
- [Letterboxd Sale Talks Are Heating Up — IndieWire](https://www.indiewire.com/news/business/letterboxd-sale-talks-heating-up-1235204624/) — 30m+ members June 2026, +10m in a year; ~US$50m valuation in 2023.
- [The ongoing impact of gentrification on artist run spaces — ArtsHub](https://www.artshub.com.au/news/features/the-ongoing-impact-of-gentrification-on-artist-run-spaces-255827-2359681/) — City of Sydney A$35.6m annual cultural investment; Firstdraft, Alaska, 107 Projects.
- [Why are so many commercial galleries closing? — ArtsHub](https://www.artshub.com.au/news/news/why-are-so-many-commercial-galleries-closing-254259-2357036/)
- [Sydney Population — Population Australia](https://www.population.net.au/sydney-population/) — Greater Sydney 5.64m (ABS ERP, June 2025).
- [Australian Art Sales Digest](https://www.aasd.com.au/) — Australian and New Zealand auction records.

**Internal (repository audit, `85dfff3`)**

- `art-eye/supabase/venues_seed.sql` — 143 venues (104 gallery / 23 museum / 16 ARI).
- `art-eye/supabase/exhibitions_seed.sql` — 61 verified exhibitions.
- `art-eye/src/lib/types.ts` — domain model: profile types, venue tiering, social graph, DMs, notifications, proposals.
- `art-eye/src/lib/fairs.ts` — 3 art fairs.
- `art-eye/src/lib/areas.ts` — 6 Sydney editorial districts.
- `art-eye/supabase/functions/` — 9 edge functions (discovery, validation, enrichment, digest, push).
- `art-eye/package.json`, `art-eye/app.json`, `art-eye/eas.json` — Expo/React Native stack; `com.arteye.app`; no analytics or billing dependencies.
- `CLAUDE.md` — demo-mode vs. live-mode build constraint; branding rules.
