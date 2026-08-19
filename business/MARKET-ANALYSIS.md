# ART EYE — Multidimensional Market Analysis

**Prepared:** August 2026 · **Scope:** Sydney beachhead, Australian expansion, global-city optionality
**Status of product:** live on Supabase, web build deployed via GitHub Pages, App Store readiness work committed

---

## 1. Executive summary

ART EYE is further along than its category peers realise. It is not a listings page with an app
wrapper — it is three products fused: **a verified venue register** (143 Sydney venues), **an
editorial exhibition agenda**, and **a Letterboxd-style social logging layer** (follow, feed,
likes, threaded comments, DMs between mutual follows, private profiles, blocking, push). Very few
art-discovery products anywhere carry all three, and none in Australia.

**The central finding of this analysis:** the defensible asset is not the app's design or its
social features — both are copyable. It is the **self-validating venue register and the freshness
pipeline behind it**. Exhibition data decays weekly; every competitor in this space either
degrades into staleness or burns unsustainable human editorial hours. ART EYE has automated
research-and-propose jobs with a human approval gate. That is a structural cost advantage in the
one dimension where this category always fails.

**The central constraint:** Sydney alone cannot carry a venture-scale business. Honest ceiling
modelling (§7) puts total addressable annual revenue for a Sydney-only ART EYE at roughly
**A$0.3–0.7M**, split across a consumer subscription and a venue-side tier. That is a viable
independent business, but it is a ceiling, not a runway. The strategy that fits the asset is:
**win Sydney decisively as proof, then export the pipeline city by city**, where the same
machinery multiplies 8–15×.

**The most time-critical recommendation:** Sydney Contemporary runs **3–6 September 2026** at
Carriageworks — roughly two weeks out. It drew a record 26,440 visitors in 2025, and it is the
single densest concentration of ART EYE's exact target user in the Australian calendar year.
It is already in the app's fair register. Treating it as the launch moment is worth more than
any six months of ambient acquisition (§8).

**The most serious gap:** there is **no analytics instrumentation anywhere in the codebase**.
Retention — the only metric that determines whether this is a business or a hobby — is currently
unmeasurable. This must be fixed before the launch push, not after.

---

## 2. Product baseline — what actually exists

Assessed from the codebase, not from the pitch.

| Dimension | Evidenced state |
| --- | --- |
| **Register** | 143 Sydney venues — 104 galleries, 23 museums, 16 ARIs — with address, lat/long, website, Instagram, opening hours + `hours_checked` verification date |
| **Link coverage** | 126/142 venues with website, 112 with Instagram (Jul 2026 completion pass) |
| **Agenda** | ~61 web-verified exhibitions, editorial hero carousel, curated strips, curator's picks |
| **Social layer** | Follow/follower with private-profile approval, activity feed, likes, threaded comments (one level), mentions, DMs gated to mutual follows, notification centre, push |
| **Trust & safety** | Blocking (symmetric effect), reporting, account deletion, RLS enforced server-side |
| **Supply-side tooling** | Venue accounts claim and manage their page; public submission form; host approval queue with typed rejection reasons |
| **Automation** | `validate-venues` (weekly), `discover-venues` (monthly), `discover-exhibitions`, `enrich-images`, `queue-digest` — all propose-only, owner approves in-app |
| **Geography model** | Districts: East, Inner West, North, Greater Sydney, Day Trips |
| **Fairs** | Sydney Contemporary, Darwin Aboriginal Art Fair, Cairns Indigenous Art Fair — verified 2026 dates |
| **Segmentation, built-in** | Profile types: collector, enthusiast, student, artist, gallery professional |
| **Monetisation** | **None.** No payment, subscription, or paywall code exists |
| **Analytics** | **None.** No event tracking of any kind |

Two observations matter strategically. First, the **profile-type field is a latent segmentation
and pricing asset** — the app already asks users to self-identify into the exact five segments
that have different willingness-to-pay. Nothing currently uses this. Second, the **approval
gate on every automated proposal** is what makes the pipeline trustworthy; it is also the
throughput bottleneck the moment the register spans more than one city (§10).

---

## 3. Market sizing

### 3.1 Demand side — audience

| Layer | Estimate | Basis |
| --- | --- | --- |
| Australians attending arts annually | 74% of population — highest since 2009 | Creative Australia National Arts Participation Survey, 2025 |
| Gallery visits nationally | ~11M/year — more attended than AFL | Creative Australia / Artfacts |
| AGNSW visitors | 2,032,098 (2023–24) | Institutional reporting |
| MCA visitors | 859,386 (2022–23), −15% vs 2019 | Institutional reporting |
| Greater Sydney adults | ~4.3M | ABS-derived |
| **Sydney adults visiting a gallery ≥1×/year (SAM)** | **~1.1–1.3M** | ~25–30% national gallery-going rate applied to Sydney adults |
| **High-frequency art-goers, 3+ shows/year (SOM core)** | **~120,000–180,000** | ~10–14% of the annual-visitor pool; this is the population that logs |
| Sydney tourists/year | ~15M (3.9M international) | Destination NSW, YE Mar 2026 |

The **120k–180k high-frequency core** is the honest target. A logging product is not used by
someone who sees one blockbuster a year; it is used by the person who sees a show most weeks.
Letterboxd reached ~17M users against a global cinema audience in the billions — sub-1%
penetration of the casual pool, but near-total capture of the passionate core. ART EYE should
model the same shape: **a small denominator, captured deeply**, not a large one captured thinly.

Tourists are a real but distinct segment — high intent, zero retention. They should be monetised
through discovery and guides, never counted in retention metrics.

### 3.2 Supply side — venues

| Metric | Value | Source |
| --- | --- | --- |
| Art galleries & museums, Australia | A$2.6bn market, 1,078 businesses (2026) | IBISWorld |
| Business count trend | −2.7% YoY; −1.5%/yr over 5 years | IBISWorld |
| Market growth | −0.1% in 2026; 0.4% CAGR 2021–26 | IBISWorld |
| New-art sales, Australia | **down 25–30% over recent years** | Australian Commercial Galleries Association |
| Global art market | US$59.6bn in 2025, +4% YoY but 9% below 2023 | Art Basel/UBS 2026 |
| Global online art sales | US$9.2bn, **−11%**, lowest since 2019 | Art Basel/UBS 2026 |
| Sydney Contemporary sales | A$16m (2025), 4th consecutive annual decline (from A$23m in 2022) | The Art Newspaper |
| Sydney Contemporary attendance | **26,440 — a record**, against falling sales | The Art Newspaper |

**This table contains the single most important strategic signal in the analysis.** Attendance is
at a record while sales fall four years running. Audience is growing; transaction value is
shrinking. A product that monetises *transactions* (Artsy's model) is fighting the tide. A product
that monetises *attention and attendance* is swimming with it. ART EYE, which never touches a
sale, is positioned on the right side of that divergence — and should say so explicitly to
venues, because it reframes the spend from "sales channel" (which they are cutting) to
"foot traffic" (which they are protecting).

The corollary is a hard constraint on pricing: a sector with sales down 25–30% and a shrinking
business count **will not absorb aggressive B2B pricing**. Venue-side revenue must be modest,
near-frictionless, and clearly tied to visits.

### 3.3 Revenue TAM — the honest ceiling

**Sydney, consumer side.** 150k core art-goers. Realistic reach at maturity 20–30% (30k–45k
users). Freemium conversion benchmarks sit at **2–5%**, high performers 6–8%. At 35,000 users,
4% conversion, A$40/yr: **≈ A$56,000/yr**.

**Sydney, venue side.** 104 commercial galleries + 16 ARIs are the realistic paying pool
(museums have their own channels; ARIs have no money). At 30% adoption of a A$50–80/month
venue tier: **≈ A$25,000–35,000/yr**. ARIs should be free permanently — they are content supply
and community credibility, not revenue.

**Sydney, other lines.** Fair partnerships, sponsored guides, institutional data/insight
reporting: **A$50,000–150,000/yr** at maturity, lumpy and relationship-dependent.

> **Sydney-only ceiling: ≈ A$0.3–0.7M/yr at maturity.**
> Melbourne, Brisbane, Adelaide, Perth, Auckland roughly **4–5×** this. Adding a tier of
> international art cities where the same pipeline runs (Berlin, Lisbon, Copenhagen, Seoul —
> deliberately *not* London/NY, see §6) takes it to **8–15×**.

The number is the strategy. Sydney is the proof, not the prize.

---

## 4. Audience segmentation

The app's own `ProfileType` enum is the correct segmentation. Each segment has a different job,
retention driver, and willingness to pay — and none of this is currently exploited.

| Segment | Job to be done | Retention driver | WTP | Priority |
| --- | --- | --- | --- | --- |
| **Enthusiast** | "What's worth seeing this weekend?" | Feed + friends' logs | Low–Med | **Core — the volume** |
| **Student** | Cheap cultural life; coursework; peer scene | Social graph, ARIs | Very low | **Core — the density** |
| **Artist** | See peers' work; be seen; track the scene | Being followed; ARI coverage | Low | **Core — the credibility** |
| **Gallery professional** | Competitive awareness; who's showing what | Register completeness | **High** | **Monetisable — the margin** |
| **Collector** | Deal flow, primary-market awareness | Curated picks, openings | **Highest** | **Monetisable — the margin** |
| *Tourist (unmodelled)* | "3 days in Sydney, what's on?" | None — single session | Med (one-off) | Guides, not subscription |

**Strategic read.** The three low-WTP segments are not a problem to be solved — they *are* the
product. Enthusiasts, students and artists generate the logs, reviews and social graph that make
the app worth opening. Collectors and gallery professionals then pay for access to a living map
of the scene that only exists because the first three populate it. This is the classic
**subsidised-core / monetised-periphery** structure, and it is the only pricing architecture
consistent with the sector's financial stress.

Practical consequence: **never paywall logging, saving, or the feed.** Paywall depth — export,
history, advanced search, alerts, insight.

---

## 5. Competitive landscape

### 5.1 Direct — art listings

| Player | Strength | Weakness ART EYE exploits |
| --- | --- | --- |
| **Art Guide Australia** | The incumbent. Print + online authority, national reach, editorial trust, decades of gallery relationships | Magazine-first. Listings are a directory, not a habit. No social graph, no personal record, weak mobile product |
| **Ocula** | Sleek international product, strong gallery partnerships, real Sydney coverage | Global and blue-chip-skewed. Thin on ARIs and small commercial galleries — precisely Sydney's living scene. Trade-facing, not visitor-facing |
| **ArtRabbit** | Closest philosophical peer — city guides, walking tours, saved shows; relaunched Jun 2026 | Editorially managed in London/Berlin/NY/LA. **Not Sydney.** A direct competitor if it ever expands — and a validation of the model |
| **Artsy** | Enormous inventory, gallery subscriptions + commission | A marketplace. Monetises transactions in a market where online sales fell 11% to a post-2019 low. Wrong side of the divergence |

### 5.2 Adjacent — general "what's on"

**Time Out Sydney, Broadsheet, Concrete Playground.** These are the real incumbents for the
casual question "what's on this weekend?" They have far greater reach and SEO dominance, and they
publish periodic curated art round-ups. But art is one vertical among food, film, music and
nightlife; coverage is editorial, episodic and shallow — eight shows a season, never 143 venues
with verified opening hours. They win the casual query; they cannot serve the person seeing a
show a week. **Do not fight them on reach. Beat them on depth and recency.**

### 5.3 The actual competitor: Instagram

Sydney's art scene already coordinates on Instagram. Galleries post openings there; audiences
discover there. It is free, universal, and has the artists already. ART EYE cannot displace it
and should not try. It wins on the three things Instagram is structurally bad at:

1. **Chronology and completeness** — an algorithmic feed cannot tell you what closes Sunday.
2. **Persistence** — Instagram has no personal record of what you saw and what you thought.
3. **Discovery beyond who you follow** — the 104-gallery long tail is invisible on Instagram unless you already know it exists.

The app's existing **one-tap-out pattern** (Website / Instagram / Reel links, Google Maps
directions, nothing embedded or scraped) is exactly right: it treats Instagram as a destination
rather than a rival, which keeps venues cooperative.

### 5.4 Analogues — the model being executed

**Letterboxd** is the proof case and it has recently become spectacular. ~17M users; acquired 60%
by Tiny in 2023 at a **US$50–60M** valuation; reportedly valued near **US$250M** in the 2026
auction drawing Netflix, Paramount and Sony — roughly **5× in under three years**. Revenue is
modest relative to valuation (estimates A$8–19M), monetised through Pro/Patron tiers, programmatic
advertising, and an industry-facing "HQ" tier. **The value is in the graph and the cultural
position, not the ARPU.**

This validates ART EYE's architecture almost exactly — including the industry-facing tier, which
maps to gallery professionals and collectors. It also validates the patience required: Letterboxd
was founded in 2011 and took over a decade to reach that position.

**Strava** contributes the follow/private-profile/mutual-DM structure ART EYE already implements.
**Untappd** shows the venue-side pattern: free consumer app, paid tier for the venues that appear in it.

### 5.5 Competitive verdict

There is no product in Sydney doing what ART EYE does. Art Guide owns authority but not habit;
Ocula owns the top end but not the scene; Time Out owns reach but not depth; Instagram owns
attention but not structure. **The gap is real and currently unoccupied.** It is also
undefended — the barrier is data freshness and social liquidity, both of which take time rather
than capital, which is precisely why moving now matters.

---

## 6. Positioning

> **ART EYE is the record of what you've seen and the map of what's on — for people who see art often.**

Three positioning disciplines follow, each with a real cost:

**Depth over breadth.** 143 verified venues including ARIs, not eight editorial picks. The cost
is maintenance burden — which is exactly what the pipeline exists to absorb.

**Record over feed.** The Curator profile is the retention engine. A user with 40 logged shows
cannot leave. The cost is a slow start: the product is weakest on day one and strongest in year
three.

**Attendance over transaction.** Never touch a sale. Sidesteps the 11% online-sales decline,
keeps galleries non-defensive, and avoids competing with the venues who are the supply.

**On expansion sequencing:** when the time comes, expand into cities that are *underserved*, not
prestigious. ArtRabbit already occupies London, Berlin, New York and LA. Melbourne, Brisbane,
Auckland, then second-tier international art cities are where the pipeline's cost advantage
converts into an unoccupied position. Entering London to compete with an entrenched editorial
operation would spend the advantage rather than use it.

---

## 7. Business model

Sequencing matters more than selection. Monetising before retention is proven destroys the
social liquidity the whole model depends on.

### Phase 1 — Free, instrumented (0–9 months)
Everything free. Ship analytics **first**. Prove W4 and W12 retention and log frequency. There is
no legitimate pricing decision available before this data exists.

### Phase 2 — Venue tier (9–18 months)
Free claimed listing for all 143 venues, forever — the register must stay complete, and a paywalled
directory is a broken directory. Paid **VENUE+** at **A$49–79/month**: featured placement in
district feeds, opening-night push to users who saved the venue, visitor analytics (aggregate and
anonymised — the individual watchlist/visit rows are already RLS-protected from venue accounts and
must stay that way), multiple images and video, priority submission review.

Sell it as foot traffic, never as sales. Given the sector's condition, expect resistance; price
accordingly and keep ARIs free permanently.

### Phase 3 — Consumer Pro (12–24 months)
**A$4.99/month or A$39/year.** Full visit history and export, advanced search and saved searches,
opening-night alerts by district or artist, year-in-review, early access to guides, no ads ever.
Free tier keeps unlimited logging, saving, feed, follows and DMs — permanently.

Benchmarks: freemium converts 2–5% (6–8% top quartile); trial models convert far better
(8–12% typical, 45.7% for 17–32 day trials). **Use a 30-day trial, not a hard paywall** — hard
paywalls convert better on paper (12.1% median) but would strangle the social graph.

### Phase 4 — Institutional & partnerships (18 months+)
Sydney Contemporary and fair partnerships; sponsored curated guides (clearly labelled); insight
reporting to institutions and councils on attendance patterns — a genuinely valuable dataset that
currently does not exist in Australia. This is where a Sydney-only business breaks its ceiling,
and where the honest-sourcing and privacy discipline already in the codebase becomes a commercial
asset rather than a constraint.

### Explicitly rejected
- **Marketplace / commission** — wrong side of the sales decline; makes galleries adversaries.
- **Ticketing** — 60% of Australians already cite cost as the main attendance barrier (up from 55% in 2022); most Sydney gallery shows are free. Adding a fee to free culture is value-destructive.
- **Display advertising in the feed** — destroys the editorial tone that is the product's whole differentiation.
- **Selling user-level data** — irrecoverable trust loss in a small scene where reputation travels fast.

---

## 8. Go-to-market

### 8.1 Immediate — Sydney Contemporary, 3–6 September 2026

Two weeks out. 26,440 attendees in 2025, 116 exhibitors, and an audience that is *definitionally*
the target user — they paid to spend a day looking at art. It is already in the fair register.

- Ship a **Sydney Contemporary guide** in the app before 3 September: exhibitor list mapped to the venues already in the register, so a fair visitor can follow a gallery from booth to gallery page to its current show.
- QR at the fair → app; the strongest possible install context.
- Pre-brief the ~15–20 Sydney galleries already in the register who are exhibiting. They are at their most receptive during fair week.
- Post-fair, the guide becomes the acquisition asset that proves the venue-tier value proposition.

**This is the highest-leverage two weeks in the calendar and it is imminent.**

### 8.2 Supply-side first
Venues before users. A venue with a claimed, accurate page tells its own audience — 104 galleries
each with an Instagram following is a distribution network that costs nothing. Prioritise the 16
ARIs (most under-served, most enthusiastic, most culturally credible) and the mid-tier commercial
galleries. The blue-chips (Roslyn Oxley9, Sullivan & Strumpf) come last and follow the scene.

### 8.3 Cold-start
The feed is worthless below social density. Do not launch citywide-thin. Seed **district by
district** — Inner West first (highest ARI density, youngest audience, tightest scene), then East,
then North. A user should find people they know on day one, in one district, rather than a sparse
feed across five.

### 8.4 Editorial as acquisition
The curated-list infrastructure (artist / gallerist / editors' guides) already exists and is the
cheapest credible marketing this product has. A monthly guest-curated guide from a working artist
or gallerist earns the guest's audience and reinforces the editorial position that separates
ART EYE from a database.

---

## 9. Unit economics — scenarios at 24 months

| | Conservative | Base | Upside |
| --- | --- | --- | --- |
| Registered users | 6,000 | 18,000 | 40,000 |
| MAU (35%) | 2,100 | 6,300 | 14,000 |
| Pro conversion | 2% | 4% | 6% |
| Pro subscribers | 120 | 720 | 2,400 |
| Consumer revenue @A$39 | A$4,700 | A$28,000 | A$93,600 |
| VENUE+ (of ~120 eligible) | 10 | 28 | 45 |
| Venue revenue @A$65/mo | A$7,800 | A$21,800 | A$35,100 |
| Partnerships/guides | A$0 | A$25,000 | A$70,000 |
| **Total annual revenue** | **A$12,500** | **A$74,800** | **A$198,700** |

Cost base is genuinely low — Supabase, Expo/EAS, Resend, Anthropic API for the pipeline (already
cost-capped at 30 Claude calls per run), Apple developer account: **A$4,000–9,000/year** at these
volumes. The pipeline is the reason a 143-venue register does not require an editorial salary.

**Read this table honestly.** Even the upside case does not support a salary and a team. Sydney-only
ART EYE is a high-quality independent product with a real moat and modest revenue. It becomes a
business worth scaling only through **multi-city replication**, where the pipeline — the expensive
part, already built — is reused at near-zero marginal cost against a new register. Every strategic
decision should be tested against: *does this make the second city cheaper?*

---

## 10. Risk register

| # | Risk | Sev | Assessment & mitigation |
| --- | --- | --- | --- |
| R1 | **Social cold start** — feed empty, no reason to return | **Critical** | The single most likely failure mode. District-by-district seeding (§8.3); make the solo experience (agenda, saving, personal record) fully valuable with zero friends |
| R2 | **No analytics** — retention unmeasurable | **Critical** | Every decision here is unfalsifiable until fixed. Instrument before the Sept push |
| R3 | **Sector cannot pay** — sales down 25–30%, business count −2.7%/yr | High | Structural, not solvable. Price venue tier low; weight revenue toward consumer and partnerships; sell foot traffic, not sales |
| R4 | **Data decay** — stale hours/dates destroy trust faster than anything else | High | Largely mitigated by design: pipeline + `hours_checked` shown to users. Staleness is *visible* rather than silent — a genuine design strength |
| R5 | **Single-city ceiling** (§3.3) | High | Accept explicitly. Architect for multi-city now (the district model already generalises); resist Sydney-only feature depth that doesn't replicate |
| R6 | **Founder-bottleneck** — every proposal needs one owner's approval | High | Fine at 143 venues; breaks at 500+. Needs trusted-editor roles and confidence-based auto-approval before city two |
| R7 | **Instagram** absorbs the use case | Medium | Structurally unlikely (§5.3) — chronology, persistence and long-tail discovery are not Instagram's business |
| R8 | **ArtRabbit enters Australia** | Medium | Real, and they relaunched Jun 2026. Mitigation is speed and local depth — ARIs and small galleries they will not cover from London |
| R9 | **Art Guide builds a real app** | Medium | They have the relationships and brand; they have shown no product urgency in a decade. Their weakness is habit-formation, which is not a feature you ship |
| R10 | **Press-image provenance** — `og:image` sourcing | Medium | Mitigated by `image_source` provenance tracking and honest-sourcing rules already enforced. Add a documented takedown path before scaling |
| R11 | **Moderation load** in a small scene where people know each other | Medium | Blocking, reporting and private profiles already built — ahead of most products at this stage |
| R12 | **Demo-mode regression** wiping live data | Medium | Known and documented in CLAUDE.md; CI-enforced. Keep it enforced |
| R13 | **App Store rejection** | Low | Account deletion, blocking, reporting already implemented — the three most common rejection causes are handled |

---

## 11. Strategic options

**Option A — Sydney depth.** Perfect one city; consumer Pro + venue tier; stay independent.
Revenue A$50–150k/yr, low risk, culturally durable. *Fails to use the pipeline's real advantage.*

**Option B — Australian expansion (recommended).** Win Sydney through the fair and the 2026–27
season, then Melbourne (the most competitive art city, largest ARI scene), then Brisbane and
Auckland. The pipeline is the reason this is feasible for one operator. Revenue A$300k–1M at
3–4 years. *Requires solving R6 first.*

**Option C — Platform / data play.** Position as the attendance-data layer for Australian visual
arts, selling insight to institutions, councils and funders while the consumer app supplies the
data. Highest ceiling, highest execution risk, and it requires scale in users before the data has
value — so it is a *consequence* of Option B, not an alternative to it.

**Recommendation: B, holding C open.** The asset built is a replication machine; using it in one
city wastes it. But B is only credible after the Sydney beachhead proves retention — which
requires R2 fixed and the September fair executed.

---

## 12. Metrics that decide this

Instrument these **before** the September push. In priority order:

1. **W4 / W12 retention** — the only number that matters. Below 20% W4, nothing else in this document is actionable.
2. **Logs per active user per month.** Target ≥1.5. Below 1, this is a listings app, not a logging app, and the entire social thesis is wrong.
3. **Follows per user in first 7 days.** Target ≥3 — the strongest known predictor of retention in social-logging products.
4. **Saved → seen conversion.** Proves the app changes real-world behaviour; the single most saleable statistic to venues.
5. **Venue claim rate.** Target 40% of 143 within 6 months.
6. **Register freshness** — % of active venues verified within 90 days. The moat, quantified.
7. **Feed density** — % of users whose feed has ≥5 items/week. The cold-start early-warning signal.

---

## 13. Ninety days

| Weeks | Priority |
| --- | --- |
| **0–2** | **Analytics instrumentation (R2).** **Sydney Contemporary guide shipped and exhibitors mapped to register venues.** Brief exhibiting galleries |
| **3–4** | **Fair week 3–6 Sept.** QR acquisition, on-site presence, venue conversations at peak receptiveness |
| **5–8** | Post-fair retention read. Inner West density push. Venue claim campaign to ARIs + mid-tier galleries. First guest-curated guide |
| **9–12** | Retention verdict against §12 thresholds. If W4 ≥20%: build VENUE+ and start Melbourne register discovery. If below: fix the core loop and do not monetise |

---

## Sources

Creative Australia, *National Arts Participation Survey* (2025) · Creative Australia / Artfacts,
visual arts participation · IBISWorld, *Art Galleries & Museums in Australia* (2026) · Art Basel &
UBS, *Global Art Market Report* (2026) · The Art Newspaper, Sydney Contemporary sales (Sept 2025) ·
ArtsHub, gallery closures and Australian Commercial Galleries Association estimates · Destination
NSW, Sydney visitor statistics (YE Mar 2026) · Art Gallery of NSW and MCA institutional reporting ·
RevenueCat, *State of Subscription Apps* (2025/2026) and freemium conversion benchmarks ·
Deadline / PitchBook, Letterboxd valuation and sale process (2026) · ArtRabbit, app relaunch
(June 2026) · Artsy partner documentation · Museums & Galleries NSW, *Guess Who's Going to the
Gallery?* · ART EYE codebase, August 2026.

*Market figures are drawn from published sources as cited; segment sizing, revenue ceilings and
scenario models are analytical estimates built on those figures and stated assumptions.*
