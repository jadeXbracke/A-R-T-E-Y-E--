# ART EYE — Multidimensional Market Analysis

**Prepared:** August 2026 · **Subject:** ART EYE (`art-eye/`), a Sydney exhibition
agenda, venue register and art-going record · **Status of product at time of
writing:** live on Supabase, deployed at
`jadexbracke.github.io/D-I-S-APP-/`, 143 venues and 61 verified exhibitions in
the register, social layer (follows, feed, comments, DMs, notifications) shipped.

> **How to read this.** Every number is tagged. **[S]** = sourced to a named
> third party (see §14). **[R]** = measured from this repository. **[M]** =
> modelled by me from stated assumptions — these are estimates, not findings,
> and the assumptions are written out so you can disagree with them and rerun
> the arithmetic. Where a figure is commercially confidential (e.g. Art Guide
> and Art Almanac rate cards are quote-only), I say so rather than inventing a
> number.

---

## 1. Executive summary

ART EYE is a well-built product sitting in a market with an awkward shape: the
**demand is real and growing, but the willingness to pay in a single city is
structurally small.** The analysis below reaches four conclusions.

**1. The listings business is a commodity with rich incumbents and a near-zero
price.** Art Almanac (running since 1974), Art Guide Australia, Ocula, Time Out,
Broadsheet, Concrete Playground (1.6m monthly users, acquired by Vinyl Group in
2025) **[S]** and the City of Sydney's own What's On all publish Sydney
exhibition listings for free. Bloomberg Connects gives away guides to 1,500+
institutions on a philanthropic budget **[S]**. Nobody wins this on coverage
alone, and no consumer pays for it.

**2. The defensible asset is the record and the social graph, not the agenda.**
The thing ART EYE has that none of the above has is a *personal, cumulative,
private-then-social history of what you saw and what you thought of it* —
Letterboxd's mechanic applied to exhibitions. That asset appreciates: a user
with 60 logged shows cannot switch. A user with 60 saved listings can. This is
the only part of the product with a moat.

**3. Sydney alone caps out at roughly A$120k–250k of annual revenue, even
executed well.** Modelled bottom-up in §5 and §8 from ~300k engaged
gallery-goers **[M]** and ~60 commercially-motivated venues **[R]**. That is a
strong one-person business and a poor venture. The venture-scale path is the
social layer taken to other cities and eventually internationally — the same
route Letterboxd took to 21m members on a A$19–49/yr subscription **[S]**.

**4. The economics are unusually forgiving, which changes the recommendation.**
Infrastructure run-rate is on the order of a few thousand dollars a year **[R]**
and the venue register maintains *itself* through the validation and discovery
pipeline. ART EYE is default-alive. The correct strategy is therefore not to
chase a big number early, but to **compound density in one scene cheaply until
the social graph is liquid**, then decide between the lifestyle ceiling and the
international play from a position of evidence rather than hope.

**Recommendation: narrow the positioning from "Sydney's exhibition agenda" to
"the record of what you've seen" — the Letterboxd wedge — and win inner-Sydney's
contemporary and ARI scene completely before adding a second city.** The 90-day
plan is in §13.

---

## 2. What ART EYE actually is today

Grounded in the repository, not the pitch. **[R]**

| Dimension | Current state |
| --- | --- |
| Register | 143 venues: 104 galleries, 23 museums, 16 ARIs |
| Programme | 61 web-verified exhibitions |
| Coverage discipline | Venues carry `opening_hours` + `hours_checked` — staleness is shown, not hidden |
| Freshness | Weekly `validate-venues`, monthly `discover-venues`, weekly digest; jobs **propose**, the owner approves in an Owner Inbox — no autonomous writes |
| Imagery | Press images sourced from the venue's own `og:image` with `image_source` provenance; venue photos freely licensed or uploaded |
| Consumer loop | Browse agenda → **Want to see** → mark **seen** with rating + reflection → **Curator** profile |
| Social layer | Follows w/ requests + privacy, discover & friends feeds, trending, comments with @mentions and replies, likes, DMs with media, notification centre, block/report, account deletion |
| Supply-side self-serve | Venue accounts claim and manage their page (photo, links, hours); submissions route through admin approval; RLS prevents self-approval and self-featuring |
| Extras | Fairs register, guides, search across register + agenda, Google Maps directions, Reel/TikTok out-links, Ken Burns / video heroes |
| Platform | Expo / React Native — iOS, Android and web from one codebase; currently shipped as web |
| Cost base | Supabase + GitHub Pages + capped Anthropic pipeline calls (30/run) |

**Read-through.** This is materially more than a listings app. The submission
approval flow, RLS-enforced host control, the self-validating register and the
full social stack are the expensive parts of a two-sided marketplace, and they
already exist. What has *not* been built is any monetisation surface at all —
there is no pricing, payments or subscription code anywhere in `art-eye/src` **[R]**.
That is the single largest gap between the product and a business.

---

## 3. Market definition

ART EYE sits at the intersection of three markets that behave very differently.

1. **Cultural discovery / what's-on media.** Large audience, advertising-funded,
   consumer pays nothing, incumbents are media companies. Low margin, high reach.
2. **Personal logging & taste-graph social.** Letterboxd, Goodreads, Beli,
   Untappd, Strava. Small ARPU, enormous retention, network effects, and the
   only category here that has produced durable independent businesses.
3. **Arts-sector SaaS / marketing services.** Galleries and institutions paying
   for audience reach, insight and admin. Small number of buyers, real budgets,
   slow sales cycles.

ART EYE currently *builds* in (1), has its moat in (2), and must *monetise*
mostly in (3). Recognising that these are three different markets — with
different customers, price points and metrics — is the central strategic
discipline this document argues for.

---

## 4. Demand-side analysis

### 4.1 The macro picture is favourable

- **74% of Australians attended at least one live arts event or festival in the
  year to 2025 — the highest since the survey began in 2009, equivalent to 15.4m
  people. 98% engage with the arts in some way.** Creative Australia, *Creative
  Transformations: Results of the National Arts Participation Survey*, released
  June 2026. **[S]**
- **Art-gallery and museum attendance sits in the low-to-mid 20% range of people
  aged 15+.** ABS, *Attendance at Selected Cultural Venues and Events*. The most
  recent full release is dated; treat as a floor rather than a current reading. **[S]**
- **Cost is a growing barrier to arts attendance** — the headline finding of the
  2025 survey **[S]**. A free app that surfaces free exhibitions is aligned with
  the direction of the market, not against it.
- **Art Gallery of NSW passed 2 million visitors** across the expanded Naala Badu
  / Naala Nura campus **[S]** — the single largest concentration of qualified art
  audience in the country, physically walkable from most of ART EYE's register.
- **Sydney received 63.6m domestic and 3.9m international visitors** (year ended
  March 2026), with NSW visitor spend at a record $59.4bn **[S]**.
- **NSW is committing $1.21bn to arts and culture in the 2026–27 budget**,
  including $26.8m for the Creative Communities package and $29.1m for the
  24-Hour Economy Commissioner **[S]**. Public money is flowing toward exactly
  the audience-development problem ART EYE solves — relevant to §8(E).
- **The Biennale of Sydney's 25th edition (Mar–Jun 2026) topped Time Out's list
  of the world's best exhibitions for 2026**, across five venues including AGNSW
  and White Bay Power Station **[S]**. A once-in-a-cycle demand spike.

### 4.2 Sydney audience pyramid

Modelled from Greater Sydney's adult population (~4.6m aged 15+) and the ABS
attendance band, with a frequency distribution assumed from general
cultural-participation shape. **[M]**

| Segment | Definition | Est. size | Value to ART EYE |
| --- | --- | --- | --- |
| Annual attenders | ≥1 gallery/museum visit per year | ~1.0–1.1m | Top of funnel; poor retention |
| **Regulars** | 3–9 visits/year | ~265k | **Core target** |
| **Scene** | 10+ visits/year; artists, students, gallerists, collectors, critics | ~50k | **Beachhead — highest density, lowest CAC** |
| Cultural tourists | Visiting Sydney, culture-motivated | ~600–780k/yr | High volume, near-zero retention, no logging behaviour |

**Serviceable audience (Regulars + Scene): ~300k.** **[M]**

### 4.3 Jobs to be done

| Segment | Job | Currently solved by | ART EYE's edge |
| --- | --- | --- | --- |
| Scene | "What's opening this week that I shouldn't miss, including the ARIs?" | Instagram + mailing lists + word of mouth | **Only complete register including 16 ARIs; not pay-to-list** |
| Scene | "What have I seen this year? What did I think?" | Nothing / notes app / camera roll | **The record — no substitute exists** |
| Regulars | "I have Saturday free in Paddington — what's on within walking distance?" | Google, Time Out, Broadsheet | Map + suburb + one-tap directions |
| Regulars | "What are people whose taste I trust actually going to?" | Instagram stories | **Follow graph + friends feed + trending** |
| Tourists | "Best art in Sydney this week" | Time Out, hotel concierge, TripAdvisor | Weak — this is a media, not app, job |
| Venues | "How do I reach people who actually attend?" | Instagram, mailing list, paid listings | Claimed page + qualified, intent-signalled audience |

**The strongest, least-contested job on this list is the second one.** It is also
the only one where the competitive set is *nothing*.

### 4.4 The behavioural risk

Instagram is not a weak substitute; it is the incumbent behaviour. **91.3% of a
surveyed Gen Z cohort use Instagram to search for exhibition information, and 87%
of surveyed art buyers used Instagram to find new artists in 2020 (up from 48% in
2016)** **[S]**. Any honest analysis has to concede that ART EYE's discovery job
is being adequately served by a free app everyone already has open.

This is precisely why the **record** matters. Instagram cannot tell you what you
saw in March. It has no state, no history, no rating, no personal archive. ART
EYE should compete where Instagram is structurally incapable of following, not
where it is merely mediocre.

---

## 5. Supply-side analysis

### 5.1 The register, segmented commercially **[R] + [M]**

| Venue type | Count | Has a marketing budget? | Will pay for reach? |
| --- | --- | --- | --- |
| Commercial galleries | 104 | Roughly half meaningfully | **Yes — the paying core, ~50–60** |
| Museums / public institutions | 23 | Yes, but centrally managed | Rarely for listings; possibly for **audience insight** |
| ARIs | 16 | Effectively none | **No — must stay free, permanently** |

**Addressable paying venues in Sydney: ~50–60.** **[M]** This is the hard
ceiling on any venue-subscription line and it is small enough that the entire
market can be sold by one person, by hand, in a quarter — which is both the
constraint and the opportunity.

### 5.2 What the incumbents charge

Art Guide Australia and Art Almanac both publish media kits **on request only**;
neither lists public rates **[S]**. I have deliberately not modelled a specific
competitor price. What can be said with confidence:

- Art Almanac has sold monthly print listings to this exact customer base since
  1974, 11 issues a year **[S]** — a five-decade proof that Australian galleries
  *do* pay for exhibition listings.
- The price point is set by print economics, and the buyer is habituated to
  paying for a listing rather than for a result.

**Implication:** the willingness to pay exists and is proven. The differentiator
ART EYE can sell against it is *measurability* — "37 people saved your show, 12
marked it seen" is something a print listing has never been able to say.

### 5.3 Supply is already solved — an unusual position

Most two-sided marketplaces die on the supply side. ART EYE's is already
populated (143 venues, 61 shows) and, critically, **self-maintaining**: weekly
validation, monthly discovery of new spaces, evidence required by database
constraint, cost-capped, with an owner-approval gate **[R]**. The marginal cost
of keeping the supply side accurate is close to zero and does not scale with
usage.

**This is the single most under-valued asset in the product** and the reason a
second city is cheap to add later.

---

## 6. Competitive landscape

### 6.1 The field

| Competitor | What it is | Strength | Where ART EYE wins |
| --- | --- | --- | --- |
| **Art Almanac** | Monthly print + web listings since 1974 **[S]** | Habit, trust, gallery relationships | Mobile-native; free; ARIs; personal record |
| **Art Guide Australia** | National listings + editorial | Editorial authority, SEO | Real-time state, social, map |
| **Ocula** | Global contemporary platform, Sydney exhibition pages **[S]** | International prestige, vetted gallery membership | Local completeness; ARIs; non-commercial spaces |
| **Artsy** | Global marketplace + fair coverage | Scale, transactions | Not a transaction product; local depth |
| **Time Out Sydney** | What's-on media | Reach, tourist trust | Depth beyond the top 10; no editorial gatekeeping |
| **Broadsheet / Concrete Playground** | Lifestyle media; CP reports 1.6m monthly users, acquired by Vinyl Group 2025 **[S]** | Enormous reach, ad sales machine | Art-specific; personal state |
| **City of Sydney What's On** | Council listings | Free, official | Geography limited to LGA; no personal layer |
| **Bloomberg Connects** | Free guides to 1,500+ institutions, philanthropically funded **[S]** | Free forever, institution-grade | In-gallery guide ≠ city-wide discovery or record |
| **Smartify** | 2m active users, 14m tours, funded early 2025 **[S]** | Scale, AI recognition | Same — a companion, not a diary |
| **Instagram** | The actual incumbent behaviour **[S]** | Universal, free, where galleries already post | No memory, no state, no archive |
| **Letterboxd** | 21m members; Pro A$/US$19/yr, Patron $49/yr **[S]** | Proves the model | Not a competitor — the template |

### 6.2 Positioning

Two axes matter: **coverage completeness** (does it include ARIs and small
commercial spaces, or only advertisers and majors?) and **personal state** (does
the app remember you?).

```
                    high personal state
                            ▲
                            │
              ART EYE ●     │
                            │     ● Letterboxd (different vertical)
                            │
   complete ◄───────────────┼───────────────► curated / partial
   coverage                 │                   coverage
                            │
   Art Almanac ●            │     ● Ocula   ● Artsy
   City of Sydney ●         │     ● Time Out  ● Broadsheet
   Instagram ●              │     ● Bloomberg Connects
                            │
                            ▼
                     low personal state
```

**ART EYE occupies an empty quadrant.** Empty quadrants are either an
opportunity or a graveyard; §7 and §9 test which.

### 6.3 Moat assessment

| Candidate moat | Strength | Verdict |
| --- | --- | --- |
| Complete verified register | Medium | Replicable in ~3 months by a funded competitor; but nobody has bothered in 50 years |
| Self-maintaining pipeline | **Medium-high** | Genuine engineering asset; lowers marginal cost of every new city |
| Personal logged history | **High** | Compounds monotonically; direct switching cost |
| Social graph | **High, if liquid** | Worthless below critical density — this is the risk, see §11 |
| Editorial design / brand | Medium | Real differentiation in a category of ugly listings, but not defensible alone |
| Venue relationships | Medium | ~60 accounts; personal, slow to build, slow to lose |

---

## 7. Porter's five forces

| Force | Intensity | Reasoning |
| --- | --- | --- |
| **Threat of substitutes** | **Very high** | Instagram, Google, gallery mailing lists — all free, all entrenched **[S]** |
| **Buyer power (consumers)** | **Very high** | Zero switching cost at install; infinite free alternatives; will not pay for listings |
| **Buyer power (venues)** | **High** | ~60 buyers total; each can walk; free alternatives exist |
| **Competitive rivalry** | Medium | Fragmented, none doing the record; incumbents are media firms not product firms |
| **Supplier power** | Medium | Apple/Google take 15–30%; Supabase, Expo, Anthropic all substitutable; **content supply is self-generated, which neutralises the usual risk** |
| **Threat of new entry** | Medium-low | Low technical barrier but poor prize; the reason nobody has built it is that the Sydney-only economics do not attract funded teams — the same reason ART EYE can hold it |

**Synthesis:** this is a structurally unattractive market for a *funded* entrant
and a structurally *defensible* one for a low-cost incumbent. That asymmetry is
the strategic core of the whole analysis.

---

## 8. Business model options, priced and ranked

All figures **[M]**, at a Year-3 base case of ~36,000 registered users and
~13,000 monthly actives in Sydney (derivation in §9).

### A. Consumer subscription — *supporting, not primary*
Letterboxd-style: free core, paid tier for stats, unlimited lists, year-in-review,
export, badge. Benchmark freemium conversion is a **2.18% median**, with strong
niche communities reaching 4–6% **[S]**.

- 36,000 registered × 3% × A$29/yr = **A$31k gross → ~A$25k net** of store fees.

**Verdict:** never funds the business in one city; ship it anyway, because it
proves willingness to pay and the marginal cost is one Stripe integration.

### B. Venue subscription — *primary recurring line*
Claimed page, promoted placement, audience insight, submission priority.

- 40 paying venues × A$79/mo = **A$38k/yr**.
- Sensitivity: 25 venues @ A$49 = A$15k; 60 venues @ A$99 = A$71k.

**Verdict:** the most reliable line, the slowest to build, and the one that
requires the founder to personally sell ~60 relationships. Do not price above
A$99/mo — the buyer's anchor is a print listing.

### C. Fair, festival and institutional campaigns — *highest near-term yield*
Sydney Contemporary (114 exhibitors, 500+ artists, 25k+ visitors, >$138m in
sales since launch **[S]**), Biennale of Sydney 2026 **[S]**, Vivid, Art Month,
AGNSW and MCA exhibition launches.

- 3–4 campaigns/yr at A$5k–15k = **A$20k–50k/yr**.

**Verdict:** **start here.** Lumpy but immediate, requires no consumer scale to
justify, and each campaign delivers the audience spike that seeds the social
graph. This is the fastest path to first revenue.

### D. Audience insight for institutions
"Who saved your show, who came, what they rated it, where else they go." Sell to
the 23 museums and larger galleries at A$2k–5k/yr.

- 5 institutions = **A$10k–25k/yr**.

**Verdict:** highest strategic value per dollar — it makes ART EYE
infrastructure rather than media. Requires enough usage to be non-embarrassing,
and rigorous privacy handling (aggregate only; §11).

### E. Grants and cultural funding
NSW is deploying $1.21bn to arts and culture in 2026–27, incl. $26.8m Creative
Communities and $29.1m to the 24-Hour Economy Commissioner **[S]**; Creative
Australia and City of Sydney also fund audience development.

- Realistic: **A$10k–50k non-dilutive**, 6–12 month cycles.

**Verdict:** genuinely fits the mandate (audience development, access, Western
Sydney reach, night-time economy). Materially under-exploited today.

### F. Explicitly rejected
- **Transactions / ticketing** — most Sydney exhibitions are free; no take rate exists.
- **Art sales commission** — puts ART EYE in Ocula/Artsy's fight with none of their supply.
- **Display advertising** — needs 10× the audience to earn a fraction of (C).
- **Paid consumer wall on listings** — kills the top of funnel against free incumbents.

### Ranked sequence
**C → E → B → D → A.** Campaigns for cash now, grants for runway, venue subs for
recurring base, insight to become infrastructure, consumer subs last as proof.

---

## 9. Market sizing

### 9.1 TAM / SAM / SOM **[M]**

| | Definition | Size |
| --- | --- | --- |
| **TAM** | All annual gallery/museum attenders in Greater Sydney | ~1.0–1.1m people |
| **SAM** | Regulars + Scene (3+ visits/yr) | **~300k people** |
| **SOM (3yr)** | Realistic capture, organic-led | **~36k registered / ~13k MAU** |

### 9.2 Adoption path, base case **[M]**

| | Registered | MAU | Paying venues | Revenue (A$) |
| --- | --- | --- | --- | --- |
| Year 1 | 6,000 (2% of SAM) | 1,800 | 12 | 25k–45k |
| Year 2 | 18,000 (6%) | 6,000 | 25 | 60k–100k |
| Year 3 | 36,000 (12%) | 13,000 | 40 | **A$115k–135k** |

Year-3 build: campaigns A$35k + venue subs A$38k + insight A$15k + consumer subs
A$25k + grants (excluded from run-rate, treated as one-off).

### 9.3 The ceiling, stated plainly

| Scenario | Sydney-only Y3 revenue | Interpretation |
| --- | --- | --- |
| Bear | A$25k–40k | Passion project; register still valuable |
| **Base** | **A$115k–135k** | Sustainable one-person business |
| Bull | A$200k–250k | Excellent outcome; still one salary + costs |

**Adding Melbourne, Brisbane, Adelaide, Perth and Hobart multiplies the base by
roughly 2.5× → A$300k–600k by Year 5 [M]** — because the pipeline makes each new
city cheap, but the *selling* does not scale without headcount.

**The honest conclusion: no configuration of the Australian listings market
produces a venture-scale outcome.** Venture scale requires the Letterboxd path —
the record and the graph, internationally, on consumer subscriptions at 21m-member
scale **[S]**. That is a different, longer, and much less certain company. It is
a legitimate ambition, but it must be chosen deliberately, and it argues for
building the *record* well now even while revenue comes from campaigns and venues.

### 9.4 Cost base and the default-alive finding **[R] + [M]**

Supabase, GitHub Pages, Expo, and a cost-capped Anthropic pipeline put annual
infrastructure in the **low thousands of dollars**. Add A$99/yr Apple developer
and A$25 Google Play. With no paid marketing, the operating cost of keeping ART
EYE alive is **A$3k–6k/yr**.

At that cost base, break-even needs ~6 paying venues. **ART EYE cannot fail for
financial reasons — only for attention reasons.** This is the fact that should
drive strategy: optimise for *duration and compounding*, not for early scale.

---

## 10. Go-to-market

### 10.1 The real bottleneck is social liquidity, not supply

The agenda works for a single user on day one. The feed, trending, friends-who-
visited and DMs are worthless until enough people in the *same scene* are active.
A social feature at low density is worse than no social feature — it advertises
emptiness.

**Therefore: density before breadth. Win one scene completely.**

### 10.2 Beachhead: the inner-Sydney contemporary and ARI scene

~50k people **[M]**, geographically concentrated (Paddington, Woolloomooloo,
Chippendale, Redfern, Marrickville, Leichhardt — all already in the register **[R]**),
socially interconnected, high visit frequency, and **structurally under-served by
every incumbent because ARIs don't buy advertising** **[S]**.

If ART EYE is the only place all 16 ARIs appear alongside AGNSW, that is a
genuine reason to install it that no competitor can cheaply copy — they'd have to
list venues that will never pay them.

### 10.3 Channel plan, ranked by cost-per-engaged-user

1. **Venue-led distribution.** 143 venues, each with a mailing list and an
   Instagram. Give claimed pages away free for 12 months in exchange for one
   post/newsletter mention. Highest-intent traffic in the market, at zero cash cost.
2. **Opening nights.** The scene physically assembles several nights a week.
   Present, in person, with a QR code. Nothing converts a logging app better than
   logging the show you're standing in.
3. **Art schools.** NAS, UNSW A&D, SCA — dense cohorts of 10+/year attenders,
   annual intake, natural social clustering.
4. **Fair and festival campaigns.** Sydney Contemporary and the Biennale bring
   25k+ qualified people into a single window **[S]** — a seeding event, and
   revenue line (C), simultaneously.
5. **Editorial / SEO.** "Exhibitions in Sydney this week" is a durable,
   compounding, zero-marginal-cost query the register can answer better than
   anyone. Underused today.
6. **Paid social.** Last resort. Australian consumer installs at ~A$3–8 each
   would consume the entire cost base for a few thousand low-intent users.

### 10.4 Platform sequencing

Web is live; iOS should follow. The record and the mark-as-seen flow are
in-the-moment behaviours that need a home-screen icon and push notifications
(`expo-push` already shipped **[R]**). Web-only caps retention structurally.

### 10.5 Unit economics **[M]**

- Blended CAC via channels 1–3: **~A$0–2** cash, high founder-time cost.
- Value per engaged user: A$0.75/yr direct (consumer subs), but each engaged user
  raises the price defensibility of lines B and D.
- **The correct metric is not CAC:LTV. It is engaged users per venue relationship**
  — that ratio is what venue subscriptions are priced against.

---

## 11. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| 1 | **Social features stay empty** — feed/DMs below critical density | **High** | **High** | Density-first (§10.2); hide social surfaces below a threshold; make the *solo* record complete and valuable alone |
| 2 | **Instagram remains good enough** for discovery | High | Medium | Don't fight it — compete on memory, which IG cannot do; use IG as a distribution channel not a rival |
| 3 | **Content staleness** — a wrong closing date breaks trust once, permanently | Medium | High | Already strong: `hours_checked` shown, weekly validation, owner-approval gate **[R]**. Extend the same discipline to exhibition end dates |
| 4 | **Press-image sourcing** — taking a venue's `og:image` is customary but not licensed | Medium | **High** | Get explicit permission in the venue claim terms; honour takedowns immediately; `image_source` provenance already recorded **[R]** |
| 5 | **Moderation and safety liability** — DMs, comments, mentions, possibly minors | Medium | High | Block/report/deletion already shipped **[R]**; add clear T&Cs, an age gate, a written moderation policy and a response SLA before marketing push |
| 6 | **Privacy** — visit histories are sensitive; insight product (D) must never expose individuals | Medium | High | Aggregate-only reporting with a minimum cohort size; RLS already prevents venues reading individual watchlist/visit rows **[R]**; state this publicly as a feature |
| 7 | **Key-person concentration** — one founder, one admin role | **High** | High | Document runbooks; the pipeline's autonomy already buys weeks of absence; consider a second trusted admin |
| 8 | **A funded incumbent copies the record** (Time Out, Broadsheet, Concrete Playground/Vinyl) | Low-medium | High | Speed and scene credibility; incumbents' ad model conflicts with listing non-paying ARIs |
| 9 | **Demo-mode regression** wipes live behaviour on a bad build | Low | **Critical** | Already documented and workflow-enforced **[R]**; keep the build stamp check in release routine |
| 10 | **Venue churn after free year** | Medium | Medium | Ship insight (D) *before* the free period ends so renewal is priced against evidence |
| 11 | **App Store rejection / 30% take** | Low | Medium | Web subscription path (Letterboxd's own strategy **[S]**) |
| 12 | **Market simply too small to sustain interest** | Medium | Medium | Accept it explicitly: at A$3–6k/yr cost, a small business is a legitimate outcome, not a failure |

---

## 12. SWOT

**Strengths** — Complete register including the 16 ARIs nobody else lists **[R]**;
self-maintaining, evidence-gated pipeline **[R]**; full social stack already
built; genuinely distinctive editorial design; near-zero cost base; owner is
inside the scene; multi-platform from one codebase.

**Weaknesses** — Zero monetisation surface in the product today **[R]**; single
city; single operator; web-only distribution so far; social features carry
empty-room risk; only 61 exhibitions live, so the agenda can look thin on a quiet
week; no analytics instrumentation evident for the metrics in §13.

**Opportunities** — Biennale of Sydney 2026 as a demand spike **[S]**; $1.21bn NSW
arts budget with explicit audience-development and night-time-economy funds **[S]**;
record arts attendance at a 16-year high **[S]**; cost-as-barrier trend favours a
free discovery tool **[S]**; no incumbent occupies the record quadrant; the
pipeline makes city #2 genuinely cheap.

**Threats** — Instagram's entrenched discovery behaviour **[S]**; free,
philanthropically funded museum apps at global scale **[S]**; well-capitalised
local media with far greater reach **[S]**; Australian art market flat at
~A$140–150m auction turnover **[S]**, capping sector ad spend; platform fee and
policy risk; founder-attention risk.

---

## 13. Recommendation and 90-day plan

**Strategic statement.** *ART EYE is the record of Sydney's art scene — the only
place that lists every venue including the ones that can't pay, and the only place
that remembers what you saw.* Lead with the record. Let the agenda be the reason
to open it and the record be the reason to keep it.

### Days 1–30 — instrument and sharpen
- Add analytics for the six metrics in §13.1. **Nothing below can be judged without them.**
- Rewrite the app's first-run and store copy from "Sydney's exhibition agenda" to the record positioning.
- Publish T&Cs, privacy policy, moderation policy and an age gate (risk 5, 6).
- Add explicit press-image permission to the venue claim terms (risk 4).
- Gate social surfaces behind a density threshold so no user meets an empty feed (risk 1).

### Days 31–60 — supply-side landgrab and first revenue
- Personally onboard 30 of the ~60 commercially-motivated venues; free claimed page for 12 months in exchange for one mention (§10.3).
- Pitch **two** fair/festival campaigns for the next 6 months — Biennale-adjacent and Sydney Contemporary (§8C). First invoice is the goal.
- Draft one grant application against Creative Communities or a City of Sydney audience-development stream (§8E).

### Days 61–90 — ship iOS and prove retention
- iOS release with push; drive installs from opening nights and the venue mentions already banked.
- Ship the free consumer stats/year-in-review surface — the thing that makes the record visible and shareable, and the future paid tier's substance.
- Deliver a first, aggregate-only insight report to three venues (§8D) — the artefact renewals will be priced against.

### 13.1 Metrics that decide everything

| Metric | 90-day target **[M]** | Why it is the one that matters |
| --- | --- | --- |
| **Marks-as-seen per active user per month** | **≥1.5** | The single leading indicator. Below 1, there is no record and no business |
| Week-4 retention | ≥25% | Distinguishes a tool from a novelty |
| Registered users in beachhead | 2,000 | Density threshold for social liquidity |
| Venues claimed | 30 of ~60 | Supply-side proof for lines B and D |
| Follows per active user | ≥3 | Below 3, switch the social features off |
| First revenue booked | A$5,000 | Proves someone will pay for *something* |

### 13.2 Decision gate at 6 months

- **Marks-as-seen ≥1.5/user/month and ≥25% W4 retention** → the record works. Commit to city #2 and begin the international-optionality build.
- **Retention holds but logging is <0.5** → it's a listings utility, not a record. Cut the social stack, keep the agenda, monetise via B/C/E, run it as a profitable small business.
- **Neither** → the free incumbents are sufficient. Preserve the register and the pipeline as the durable asset; stop investing in the consumer app.

**All three of those are acceptable outcomes.** The failure mode to avoid is
spending two more years building features without instrumenting which of the
three is true.

---

## 14. Sources

Third-party sources **[S]**:

- [Creative Australia — *Creative Transformations: Results of the National Arts Participation Survey* (released June 2026)](https://creative.gov.au/research/creative-transformations-results-national-arts-participation-survey)
- [Creative Australia — More Australians attending arts than ever, but cost is a growing barrier](https://creative.gov.au/news-events/news/more-australians-attending-arts-ever-cost-growing-barrier)
- [ArtsHub — Cost a growing factor preventing arts participation](https://www.artshub.com.au/news/news/cost-a-growing-factor-preventing-arts-participation-creative-australias-national-survey-reveals-2861203/)
- [ABS — Attendance at Selected Cultural Venues and Events, Australia](https://www.abs.gov.au/statistics/people/people-and-communities/attendance-selected-cultural-venues-and-events-australia/latest-release)
- [Art Gallery of NSW — Annual Report 2024–25](https://www.parliament.nsw.gov.au/tp/files/192250/2024-25%20Annual%20Report%20Art%20Gallery%20of%20NSW.pdf)
- [Data.NSW — In-person visits to NSW cultural institutions](https://data.nsw.gov.au/data/dataset/in-person-visits-to-nsw-cultural-institutions-xlsx)
- [Destination NSW — Sydney statistics](https://www.destinationnsw.com.au/insights/sydney-statistics)
- [Destination NSW — Record visitor expenditure for NSW](https://www.destinationnsw.com.au/newsroom/record-visitor-expenditure-for-nsw)
- [Limelight — NSW State Budget 2026: arts and culture](https://limelight-arts.com.au/news/nsw-state-budget-2026-arts-and-culture/)
- [Create NSW — Multiyear funding recipients (~$17m annual investment)](https://www.nsw.gov.au/departments-and-agencies/create-nsw/news/recipients-creatensw-multiyear-funding)
- [Museums & Galleries of NSW — Sector census and research](https://mgnsw.org.au/sector/resources/online-resources/research/nsw-museum-and-gallery-sector-census-and-survey/)
- [Art Almanac — About / advertising](https://www.art-almanac.com.au/almanac/about-us/) · [rate enquiries](https://www.art-almanac.com.au/almanac/advertising/)
- [Art Guide Australia — Advertising / media kit on request](https://artguide.com.au/faq/)
- [Ocula — Gallery membership](https://ocula.com/membership/) · [Sydney exhibitions](https://ocula.com/cities/australia/sydney-art-galleries/exhibitions/)
- [Concrete Playground — Advertise (audience figures)](https://concreteplayground.com/sydney/advertise)
- [Bloomberg Connects — Available guides](https://www.bloombergconnects.org/guides/)
- [Mooseum — Best museum apps 2026 (Smartify usage figures)](https://mooseum.app/blog/best-museum-apps)
- [Letterboxd — Paid subscriptions](https://letterboxd.com/about/pro/) · [Statista — Letterboxd subscribers](https://statista.com/statistics/1555400/number-letterboxd-subscribers-worldwide) · [Paddle — Letterboxd web monetisation case study](https://www.paddle.com/customers/letterboxd)
- [RevenueCat — State of Subscription Apps](https://www.revenuecat.com/state-of-subscription-apps) · [Business of Apps — Subscription trial benchmarks](https://www.businessofapps.com/data/app-subscription-trial-benchmarks/)
- [Australasian Leisure Management — Sydney Contemporary 2025 programme](https://www.ausleisure.com.au/news/sydney-contemporary-announces-2025-program-featuring-114-exhibitors-and-more-than-500-artists/) · [ArtsHub — Sydney Contemporary sales results](https://www.artshub.com.au/news/opinions-analysis/was-sydney-contemporary-a-sales-success-the-numbers-are-in-2823105/)
- [Time Out — World's best exhibitions 2026 (Biennale of Sydney)](https://www.timeout.com/australia/news/australia-will-host-three-of-the-worlds-best-exhibitions-in-2026-according-to-time-out-010426)
- [Statista — Art buyers using Instagram to discover artists](https://www.statista.com/statistics/1021992/popular-social-media-platforms-artist-discovery/) · [Analyzing the museum experience through the lens of Instagram posts (Gen Z survey)](https://boa.unimib.it/retrieve/e39773b7-bc33-35a3-e053-3a05fe0aac26/FP_revised_Curator_img.pdf)
- [Artprice — Contemporary Art Market Report 2025](https://imgpublic.artprice.com/pdf/the-contemporary-art-market-report-2025.pdf) · [Australian Art Sales Digest](https://www.aasd.com.au/)

Internal sources **[R]**: `art-eye/README.md`, `art-eye/supabase/setup_2_venues.sql`
(143 venues: 104 galleries, 23 museums, 16 ARIs), `art-eye/supabase/exhibitions_seed.sql`
(61 exhibitions), `art-eye/supabase/functions/*`, `art-eye/src/lib/api-types.ts`,
`art-eye/package.json`, `CLAUDE.md`.

### Methodology and limitations

Desk research only — no primary interviews with Sydney gallerists, no user survey,
no analytics from the live deployment (none appears to be instrumented **[R]**,
which is why §13 begins there). Competitor rate cards are quote-only and were not
obtained. ABS attendance data is from an older reference period and is used as a
floor. All **[M]** figures are estimates derived from the stated assumptions and
should be re-run as real usage data arrives. **The single largest source of error
in this document is the absence of any observed retention or logging data for ART
EYE itself** — §13.1 exists to remove that uncertainty within 90 days.
