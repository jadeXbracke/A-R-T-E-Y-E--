# ART EYE — Multidimensional Market Analysis

**Prepared:** August 2026 · **Scope:** Sydney-first, Australia-wide, global-city optionality
**Subject:** ART EYE — *"your eye on the art world"* — an editorial agenda + visit-logging social
network for gallery and museum exhibitions.

---

## 0. Executive summary

ART EYE is not a listings app that added social features. It is a **memory graph for exhibition-going**
— the Letterboxd pattern applied to visual art — that happens to need a listings layer to function.
That distinction decides almost everything downstream: who the competitors are, why the moat is
durable, and why the obvious revenue model is the wrong one to chase first.

**Six findings:**

1. **The demand-side market is real but thin in one city.** Roughly 1.1m Sydney adults attend a
   visual-arts exhibition in a given year; only ~165k are frequent enough (3+ visits/year) to want a
   log. A realistic 3-year capture is 3,000–10,000 registered curators. That is a *community*, not
   a market — and it is exactly the right size to prove the mechanic.

2. **The supply-side revenue ceiling in Sydney is ~A$100k/year.** 143 venues, of which perhaps 85
   have any marketing budget at all, against a gallery sector whose flagship fair has seen sales
   fall from A$23m (2022) to A$16m (2025). Monetising Sydney venues is a rounding error that costs
   the product its neutrality. **Do not lead with it.**

3. **The defensible asset is the register, not the app.** 143 verified Sydney venues with
   coordinates, hours (date-stamped), websites, Instagram handles and a self-validating freshness
   pipeline is 18 months of work that a competitor cannot vibe-code in a weekend. Everything else in
   the product is reproducible; this is not.

4. **The real competitor is Instagram, not Art Guide.** Nobody chooses between ART EYE and Ocula.
   They choose between opening ART EYE and scrolling the gallery accounts they already follow.
   Positioning must attack the failure mode of that behaviour: *you saw it, you forgot it, you have
   no record.*

5. **Value accrues at network scale, in the comparable set.** Letterboxd went from 1.7m users (2020)
   to 30m+ (2026) and from a ~US$50–60m valuation to a reported ~US$250m ask — on a category with the
   same structure as this one (finite catalogue, repeat consumption, opinion as the unit of content).
   The visual-arts version of that is a multi-city network, not a Sydney utility.

6. **The largest near-term risk is operational, not competitive.** A `docs/` rebuild without
   Supabase credentials silently reverts the live site to demo mode and makes every user's account
   local-only and disposable. A single mis-run build destroys the exact asset (the log history) that
   the entire strategy depends on. This is a business risk, not a devops footnote.

**Strategic verdict:** run Sydney as a **density experiment**, not a revenue experiment. The decision
gate is not "can we charge galleries?" — it is **"do 500 people in one city log 3+ visits a quarter
and follow 5+ people?"** If yes, the Melbourne clone is a template and the category is a network. If
no, ART EYE is a beautifully-made city guide and should be run as one, at near-zero cost, forever.

---

## 1. What has actually been built (asset inventory)

Market analysis is worthless if it prices a product that doesn't exist. It does.

| Layer | State | Strategic weight |
| --- | --- | --- |
| **Register** | 143 Sydney venues (museums / galleries / ARIs) — address, suburb, lat-long, website, Instagram, opening hours + `hours_checked` date | **Core moat.** 126/142 with websites, 112 with Instagram |
| **Agenda** | Curated exhibition listings, hero carousel, curated strips, districts, search across shows/artists/venues/suburbs | Table stakes, well-executed |
| **Curation** | Want-to-see watchlist; mark-as-seen with rating + written reflection | **The product.** The proprietary data |
| **Social graph** | Follows (public/private + requests), friends feed, discover feed, trending posts, likes, threaded comments, DMs between mutuals, "who else saw this" | The retention engine |
| **Supply-side tooling** | Venue claim + self-service management, submissions with host approval, RLS-enforced permissions | Two-sided market plumbing, already in place |
| **Freshness pipeline** | Weekly venue validation, monthly discovery, press-image `og:image` sourcing, all *proposal-only* into an owner inbox | **Cost advantage.** Curation at ~1 FTE-hour/week |
| **Fairs** | National art-fair register (Sydney Contemporary, DAAF, CIAF) with verified dates | Expansion beachhead |
| **Distribution** | Web export via GitHub Pages; push notifications wired but native-only | **The gap** — no App Store presence |

Two observations a competitor would kill for, and one liability:

- The pipeline **never writes autonomously** — every proposal lands in a human approval inbox. This is
  the correct architecture for a trust product in a sector that is acutely sensitive to being
  scraped, mis-credited, or automated over.
- **Imagery ethics are codified**: exhibition covers show the show, never the building; press images
  come from the venue's own `og:image` with provenance recorded; no footage is ever hotlinked. In a
  sector where image rights are the single most common reason a gallery refuses a partner, this is a
  commercial asset disguised as a style rule.
- **Liability:** the product's distribution is a static web export. Push notifications — the only
  mechanic that reliably converts "want to see" into "went" — are inert on web.

---

## 2. Market definition

ART EYE sits at the intersection of four markets, and is mispriced if measured in only one:

```
              CULTURAL DISCOVERY                    SOCIAL CATALOGUING
        (Time Out, Broadsheet, Art Guide)      (Letterboxd, Goodreads, Untappd)
                        \                            /
                         \                          /
                          ▼        ART EYE         ▼
                         /                          \
                        /                            \
             ART-WORLD MEDIA                   VENUE AUDIENCE TOOLS
           (Ocula, Artsy, Art Almanac)      (CRM, mailing lists, Eventbrite)
```

- **Primary market — social cataloguing of visual art.** Currently *unoccupied* in any language or
  city. This is the claim.
- **Secondary market — city cultural discovery.** Crowded, low-margin, ad-funded, and being
  consolidated (Concrete Playground acquired by Vinyl Group for up to A$5.5m).
- **Adjacent market — art-world media/commerce.** Ocula and Artsy monetise *transactions* (Artsy
  gallery representation runs to hundreds of USD/month). ART EYE deliberately does not sell art —
  which forfeits the largest revenue pool but buys editorial independence.
- **Adjacent market — venue audience tooling.** The highest-ACV option, and the one nobody in
  Australian visual arts serves well.

---

## 3. Market sizing (bottom-up)

### 3.1 Demand side — Sydney

| Layer | Derivation | Size |
| --- | --- | --- |
| Greater Sydney population | ABS estimate, 2026 | ~5.5m |
| Adults 15+ | ~82% of population | ~4.5m |
| **TAM** — attends visual arts/craft ≥1×/yr | ~25% attendance rate (Creative Australia NAPS series; assumption, see §14) | **~1.1m** |
| **SAM** — frequent attenders (3+/yr), smartphone-first, actively seek what's on | ~15% of TAM | **~165k** |
| **SOM** — 3-year realistic capture | 2–6% of SAM | **3.3k–10k registered** · 1.5k–4k MAU |

**Sensitivity:** at a 20% attendance rate the TAM is 900k; at 30% it is 1.35m. The SOM band does not
move materially — the binding constraint is acquisition, not population.

**Tourism overlay:** Sydney drew 3.6m international visitors (YE Jun 2025, 84.6m nights, A$12.7bn
spend) and 63.6m domestic visitors to NSW (YE Mar 2026). Cultural tourists are a *high-intent, zero-
retention* segment: valuable for session volume and venue-facing traffic claims, near-worthless for
the social graph. Treat as a discovery-surface argument (SEO/web), never as a MAU strategy.

### 3.2 Demand side — national and network

| Market | Est. addressable frequent attenders | Notes |
| --- | --- | --- |
| Sydney | ~165k | Beachhead |
| Melbourne | ~180k | Denser gallery culture per capita; Art Guide's home market |
| Brisbane / Perth / Adelaide / Hobart | ~140k combined | MONA effect in Hobart is outsized |
| **Australia total** | **~485k** | Realistic ceiling for a single-country consumer play |
| Comparable global-city network (20 cities) | 5–8m | The Letterboxd-shaped outcome |

### 3.3 Supply side — revenue-addressable venues

| Segment | Sydney count | Willingness to pay | Notes |
| --- | --- | --- | --- |
| Major institutions (AGNSW, MCA, Powerhouse, White Rabbit…) | ~8 | Low per-seat, high partnership | AGNSW passed 2m visitors post-Sydney Modern; they have marketing teams and don't need you |
| Commercial galleries | ~70 | **Medium — the actual buyer** | Under margin pressure; fair sales down 30% since 2022 |
| ARIs / artist-run | ~40 | Near zero | Subsidise them; they are the *content* and the *early adopters* |
| Museums, regional, institutional-adjacent | ~25 | Low | Grant-funded, slow procurement |
| **Addressable paying venues, Sydney** | **~85** | | |
| **Addressable paying venues, national** | **~300** | | |

**Revenue ceiling maths (supply side):**

- Sydney: 85 venues × ~40% conversion × A$1,200/yr ARPA ≈ **A$41k ARR**
- Sydney at saturation (85 × 100% × A$1,200) ≈ **A$102k ARR** — the theoretical maximum
- National: 300 × 40% × A$1,200 ≈ **A$144k ARR**, +~30% from campaign/featured placement ≈ **A$190k**
- Consumer membership, national, at 50k registered × 3% × A$29 ≈ **A$44k ARR**

**Conclusion:** a fully-executed, national, best-case ART EYE-as-listings-business tops out around
**A$250–500k ARR**. That is an excellent one-person business and a poor venture case. The
venture-shaped outcome is only reachable through the network path (§11, Scenario C).

---

## 4. Demand-side analysis: who actually uses this

Macro conditions are the best they have been since the survey began: **74% of Australians attended a
live arts event in the past year (15.4m people) — a record**, and **98% engage with the arts in some
form**. But two counter-signals matter more for product decisions than the headline:

- **Cost is now the dominant barrier — 60% cite it, and over half missed something they wanted to
  see.** Gallery-going is the *cheapest* serious cultural consumption in the country: most
  commercial galleries and ARIs are free. ART EYE's agenda is a free-culture discovery surface at
  precisely the moment cost is pushing audiences out of ticketed art forms. **This is the single
  strongest tailwind available and it is currently unstated in the product's positioning.**
- **Visual arts attendance remains below pre-COVID levels** even as live arts hit records. The
  category is under-served, not over-served — which is opportunity, but also means demand must be
  *created*, not merely captured.
- **Cultural-identity participation jumped from 32% (2022) to 40% (2025)**, and one in three
  Australians attended a First Nations arts event. The register already carries the fairs
  (DAAF, CIAF) that serve this. Under-exploited.

### 4.1 Segments

| # | Segment | Size (Syd) | Behaviour | Value to ART EYE | Priority |
| --- | --- | --- | --- | --- | --- |
| **1** | **The Logger** — art-school-adjacent, 24–38, goes to openings, has opinions, already uses Letterboxd | ~15k | 2–6 shows/month, posts, follows | **Highest.** Supplies the content that retains everyone else | **P0** |
| **2** | **The Saturday Curator** — professional, 30–55, 1–2 shows/month, plans weekends | ~90k | Saves, rarely posts, high retention if reminded | Volume + the audience venues pay for | **P1** |
| **3** | **The Cultural Tourist** — 3.6m international p.a., in-market 4–9 days | ~1.2m sessions | One session, high intent, zero return | Traffic, SEO, venue-facing reach | **P2** |
| **4** | **The Sector** — artists, curators, gallerists, students, writers | ~8k | Professional necessity; check daily | Credibility + supply-side flywheel | **P0** |
| **5** | **The Institution Member** — AGNSW/MCA members, 45+ | ~60k | Loyal to venue, not to app | Low — already owned by the venue | P3 |

**The strategic read:** Segments 1 and 4 are ~23k people who between them *make the app worth
opening for segment 2*. Acquisition spend targeted at segment 2 before segments 1 and 4 are dense is
money set on fire — the feed will be empty, and an empty feed in a social product is worse than no
feed at all.

### 4.2 The jobs-to-be-done

| Job | Today's solution | Why it fails | ART EYE's answer |
| --- | --- | --- | --- |
| "What's on that's worth my Saturday?" | Instagram, word of mouth | Algorithmic, not comprehensive, no dates | Agenda + curated picks |
| "I want to remember what I saw and what I thought" | Camera roll, nothing | Photos aren't a record; reflections are lost | **Mark-as-seen + reflection = the product** |
| "What do people whose taste I trust rate?" | DMs, group chats | Ephemeral, unsearchable | Friends feed, ratings, "who else saw this" |
| "Is it open right now, and how do I get there?" | Google, venue site | Hours are stale everywhere | Date-stamped hours + one-tap directions |
| "Show my exhibition to the right people" (venue) | Instagram, mailing list | Reach collapsed; list is expensive | Free listing → claimed page → paid reach |

---

## 5. Supply-side analysis: the venue market

A two-sided market with an unusually favourable asymmetry: **the supply side has already been
acquired without their participation.** All 143 venues are listed, accurate and live. Venues opt
*in* to control, not in to exist. This inverts the classic cold-start problem — there is no empty
marketplace, only an unclaimed one.

**Venue economics right now (why they will and won't pay):**

- Sydney Contemporary — the sector's bellwether — turned over **A$16m in 2025, down from A$17.5m
  (2024), A$21m (2023) and A$23m (2022)**: a fourth consecutive year of decline, on **record
  attendance of 26,440**. Read that carefully: *more people, less money.* Galleries are not short of
  eyeballs; they are short of buyers.
- **Implication:** selling "reach" to a commercial gallery in 2026 is selling them the thing they
  already have too much of. Selling **qualified intent** — who saved your show, who visited, who
  came back — is selling them the thing they measurably lack. Position the paid tier as
  **audience intelligence**, not advertising.
- ARIs and non-commercial spaces have no budget and must stay free permanently. They are also where
  segment 1 lives. Their listings are a cost of goods, not a lost sale.

**Supply-side conversion ladder (already built, currently under-activated):**

```
LISTED (143)  →  CLAIMED (venue account)  →  MANAGED (photo, hours, links, reels)
      ↓                    ↓                              ↓
  zero effort      email/verification pass          self-serve, free
                                                            ↓
                                              INSIGHTS TIER (paid, ~A$79–149/mo)
                                        saves · visits · demographics · benchmark vs district
```

The claim rate is the leading indicator of every supply-side dollar that follows. **Target: 30% of
active-show venues claimed within 6 months.**

---

## 6. Competitive landscape

### 6.1 Direct and adjacent competitors

| Player | What it is | Strength | Weakness vs ART EYE | Threat |
| --- | --- | --- | --- | --- |
| **Instagram** | Where the art world actually lives | Universal; venues post here first | No agenda, no dates, no record, algorithmic | **Highest — it's the default** |
| **Art Guide Australia** | Bimonthly magazine + national listings, est. 2000, ~60k FB following | Trusted, editorial depth, national coverage, sector relationships | Publication-shaped: no personal log, no social graph, no follow model | **High (incumbency)** |
| **Art Almanac** | Australia's longest-running monthly gallery guide | Comprehensiveness, sector default | Print-first, no personal layer | Medium |
| **Ocula** | International contemporary art platform, 200+ vetted galleries | Blue-chip network, advisory revenue | Global/commercial, not city-agenda; collector-facing | Low (different buyer) |
| **Artsy** | Global marketplace, millions of users | Scale, transactions | Sells art; galleries pay to be there; not a diary | Low (different market) |
| **Time Out Sydney / Broadsheet / Concrete Playground / Urban List** | City guides | Huge audiences, ad sales machines | Art is one vertical of twelve; no depth, no log | Medium (attention, not function) |
| **Sydney Art Guide / What's On (City of Sydney)** | Listing directories | Free, official | Static, no product | Low |
| **Bloomberg Connects / Smartify** | In-gallery audio/AR guides | Institutional relationships | *Inside* the venue; complementary, not competing | **Partner, not rival** |
| **Museum's own app/newsletter** | Single-venue loyalty | Owns the member | Single venue by definition | Low |
| **Letterboxd** | The proof the mechanic works — 30m+ members, 96.4m reviews and 701m films logged in 2024 alone | — | Different vertical | **Template, not threat** |

### 6.2 Positioning map

```
                        PERSONAL / SOCIAL (a record of you)
                                      ▲
                     Letterboxd ●     │        ● ART EYE
                                      │
     GLOBAL / COMMERCIAL ◀────────────┼────────────▶ LOCAL / EDITORIAL
                                      │
              Artsy ●   Ocula ●       │   ● Art Guide  ● Art Almanac
                                      │   ● Time Out   ● Broadsheet
                                      ▼
                        PUBLISHED / ANONYMOUS (a record of what's on)
```

**The whole upper-right quadrant is empty.** No incumbent has a reason to enter it: Art Guide's
business is advertising against editorial, and a personal log adds no ad inventory; Time Out's is
scale across verticals, and depth in one vertical dilutes it; Artsy's is transactions, and a diary
of free exhibitions monetises nothing. **The quadrant is empty because it is unattractive to
everyone who could take it — which is the best possible reason for it to be empty.**

### 6.3 What a well-funded fast-follower could and could not copy

| Copyable in a weekend | Copyable in a quarter | Not copyable in a year |
| --- | --- | --- |
| The UI, the type system, the tab structure | Watchlist, ratings, feed, follows | **143 verified venues with checked hours and geodata** |
| Listings scraped from venue sites | Push notifications, submissions | **Venue trust — the honest-sourcing rules and approval flow** |
| An AI enrichment script | A submission approval queue | **The accumulated log history of real users** |

The moat is the register plus the log. Both compound with time; neither can be bought.

---

## 7. Porter's Five Forces

| Force | Intensity | Analysis |
| --- | --- | --- |
| **Threat of substitutes** | 🔴 **High** | Instagram + Google Maps + a group chat does 70% of the job for free and requires no new habit. The 30% it cannot do (the record, the ratings, the friend graph) must be made *visible* fast or the substitute wins by inertia. |
| **Buyer power (venues)** | 🔴 **High** | Free listings exist everywhere; venue budgets are shrinking; no venue *needs* ART EYE in year one. Mitigation: never sell reach, sell intelligence; keep listing free forever. |
| **Buyer power (consumers)** | 🟡 Medium→Low | Zero switching cost at signup; but every logged visit raises exit cost. After ~15 logged visits the user is holding a record that exists nowhere else. **Retention is a function of log depth — instrument it.** |
| **Supplier power (content/data)** | 🟡 Medium | Venues own the press images and the facts. Mitigated by: `og:image` sourcing with provenance, Wikimedia-licensed venue photos, per-show tonal placeholders so a missing image never breaks the page, and a pipeline that proposes rather than takes. |
| **Threat of new entrants** | 🟡 Medium | Technically trivial to build the app; practically hard to build the register and earn the sector's trust. A funded entrant (a Time Out vertical, an Art Guide product hire) is the credible scenario — 12–18 month head start. |
| **Competitive rivalry** | 🟢 **Low** | Nobody currently competes for "log what you saw." The category is uncontested; the *attention* is not. |

**Net:** structurally attractive on rivalry and entrant risk, structurally hostile on substitutes and
supplier/buyer power. This is the profile of a product that wins on **habit formation**, not on
features or price.

---

## 8. PESTEL

| | Factor | Direction | Implication |
| --- | --- | --- | --- |
| **P** | National Cultural Policy / Creative Australia; Create NSW funding; NSW 24-hour economy strategy; Powerhouse Parramatta opening (largest museum in the state, 18,000+ sqm) | ▲ Favourable | Grant-fundable as cultural infrastructure. Western Sydney is a live, growing, under-covered district — **register coverage there is a strategic gap.** |
| **E** | Cost-of-living: 60% cite cost as the barrier to arts attendance; art-market sales declining (A$23m→A$16m at Sydney Contemporary) | ▲ for product / ▼ for revenue | Free exhibitions gain share as ticketed arts price people out — but the buyers you'd bill are under pressure. **Reinforces: delay monetisation.** |
| **S** | Record 74% arts attendance; visual arts still below pre-COVID; cultural-identity participation 32%→40%; logging/rating culture normalised by Letterboxd and Goodreads | ▲ Strongly favourable | The behaviour ART EYE requires is now culturally pre-installed in under-40s. First Nations arts coverage is both an ethical obligation and an engagement opportunity. |
| **T** | Expo/React Native cross-platform; LLM-assisted data enrichment; Supabase RLS; push notifications | ▲ Favourable | The AI pipeline lets one person maintain a register that historically needed an editorial team. **This is the actual unfair advantage.** |
| **E** | Low-carbon, local, walkable cultural consumption | ▲ Mild | Useful in grant narratives; not a consumer message. |
| **L** | Privacy Act 1988 + APPs (and the 2024–26 reform tranche); image copyright and moral rights; App Store review; platform ToS on scraping | ⚠️ Manageable | Social features (DMs, follow requests, private profiles) mean **you now hold personal data** — a privacy policy, data-retention position and deletion path are compliance requirements, not nice-to-haves. Image provenance tracking already puts you ahead of most listings sites. |

---

## 9. Business model architecture

### 9.1 Revenue options, ranked by (fit × timing)

| # | Model | Revenue potential | Time to revenue | Risk to product | Verdict |
| --- | --- | --- | --- | --- | --- |
| **1** | **Venue insights tier** — saves, visits, repeat rate, district benchmark, at A$79–149/mo | A$40k Syd → A$190k nat. | 12–18 mo (needs data volume) | Low — venues never touch the feed | ✅ **Primary, but not yet** |
| **2** | **Featured placement** — clearly-labelled campaign slots per exhibition, A$300–1,500 | +30% on (1) | 12 mo | **Medium — this is where editorial trust dies** | ⚠️ Only with hard labelling and a cap |
| **3** | **Consumer membership** — A$29/yr for stats, lists, export, year-in-review | A$44k @ 50k users | 24 mo+ | None | ✅ Later, at national scale |
| **4** | **Institutional / tourism partnerships** — Destination NSW, City of Sydney, Create NSW, festival tie-ins | A$20–80k per engagement | 6–12 mo | Low | ✅ **Fastest real money; pursue now** |
| **5** | **Grants** — Create NSW, Creative Australia, City of Sydney innovation/cultural grants | A$10–60k, non-dilutive | 3–9 mo | None | ✅ **Do this first** |
| **6** | **Sector data product** — anonymised attendance/interest benchmarks sold to peak bodies, councils, funders | A$50–150k | 24 mo+ | Low, if genuinely anonymised | 🔭 Highest-ACV long game |
| **7** | Ticketing / commission on art sales | High | — | **Fatal to neutrality** | ❌ Reject |

### 9.2 The sequencing argument

The instinct is to monetise the 143 venues because they are *there*. The maths in §3.3 says the
entire Sydney venue market is worth less than a single institutional partnership, and charging early
costs you the thing that makes the partnership possible: **being the neutral, complete record of what
is on in Sydney.** Completeness is the product. A paywalled or pay-to-appear agenda is not a record;
it is a directory, and directories are worth what Art Almanac is worth.

**Sequence: grants → institutional partnership → venue insights → consumer membership.**

---

## 10. Unit economics and KPI framework

### 10.1 Cost base (current)

Near-zero marginal cost: Supabase free/low tier, GitHub Pages hosting, Expo tooling, and an LLM
enrichment pipeline hard-capped at 30 Claude calls per run. **Estimated run cost: A$50–200/month at
current scale.** This is the single most under-rated fact in the analysis — it means the *bear case
is survivable indefinitely*, and time is an ally rather than a burn-rate enemy.

Costs that appear with scale: Apple Developer (A$150/yr), Supabase Pro (~A$40/mo) past free tier,
Resend, push infrastructure, and — the real one — **editorial time**, which the proposal pipeline
compresses but does not eliminate.

### 10.2 KPI tree

```
NORTH STAR:  Visits logged per active curator per month     (target: ≥2.0)
                                │
        ┌───────────────────────┼───────────────────────┐
   ACQUISITION              ACTIVATION                RETENTION
        │                       │                          │
  · installs / signups    · % who log a first        · D30 curator retention (≥35%)
  · % from venue          visit within 7 days        · median follows per user (≥5)
    referral (target 25%)   (target ≥40%)            · % with ≥15 logged visits
  · organic search /      · % who follow ≥3          · feed items seen per session
    tourist sessions        people in week 1         · save→visit conversion (≥25%)
                                │
                          SUPPLY HEALTH
                    · % of Sydney shows listed within 7 days of opening (target ≥90%)
                    · venue claim rate (target 30% of active-show venues @ 6mo)
                    · register freshness: median days since hours_checked (<120)
                    · proposals approved / rejected ratio (pipeline precision)
```

**The liquidity threshold to prove or disprove:** ~500 active loggers in one city, each following
≥5 others, producing ≥2 logs/month. Below that the friends feed is empty and the product is a
listings app wearing a social costume. **This number is the whole thesis — measure it above all
else.**

---

## 11. Strategic scenarios (3-year)

### Scenario A — "The Sydney Utility" (base case, ~50%)

Register stays best-in-city; 2–4k registered users; social graph never reaches liquidity; revenue
from one or two institutional partnerships and a handful of venue subscriptions. **~A$30–60k/yr,
near-zero cost, indefinitely sustainable, one-person operation.** Not a failure — a durable,
respected piece of Sydney cultural infrastructure with an owner who controls it entirely.

### Scenario B — "The National Guide" (~30%)

Melbourne and Brisbane cloned off the Sydney template; ~15–25k registered; venue insights tier
converts nationally; ~A$150–250k ARR. Requires: a second person on editorial/partnerships, a native
app in both stores, and a repeatable city-launch playbook. Competes head-on with Art Guide and must
win on product, not coverage.

### Scenario C — "The Network" (~20%, the only venture-shaped outcome)

Liquidity is proven in Sydney, the mechanic travels, and the product goes global-city: London,
New York, Berlin, Tokyo, Seoul, Mexico City. Revenue mixes membership, institutional partnerships
and sector data. The comparable is explicit and recent: **Letterboxd — ~US$50–60m in 2023, a reported
~US$250m ask in 2026, on 30m+ members.** Visual art is a smaller category than film, but exhibitions
are *time-boxed and local*, which makes the data more valuable per user, not less.

**Gate between A/B and C:** the 500-logger liquidity test in §10.2, measured within 9 months of a
native launch. Do not fund a Melbourne launch before it passes.

---

## 12. SWOT

| **Strengths** | **Weaknesses** |
| --- | --- |
| 143-venue verified register with hours, geo, links — genuinely hard to replicate | **No App Store presence**; web export only, so push (the core re-engagement loop) is dead |
| Full social stack already shipped (follows, feed, likes, comments, DMs, privacy) | Single-city, single-operator; host approval is a throughput bottleneck by design |
| Self-validating AI freshness pipeline with human-in-the-loop — editorial quality at ~zero cost | No revenue, no pricing page, no venue-facing sales motion |
| Distinct, disciplined design identity (image wordmark, Archivo/Cormorant/Plex, single red accent) | Zero brand awareness outside a personal network |
| Ethical sourcing rules that pre-empt the sector's #1 objection | Analytics/instrumentation for the KPI tree not evidenced in the codebase |
| Effectively zero burn — can wait out a slow market | Demo-mode rebuild hazard can destroy user data silently (§13) |

| **Opportunities** | **Threats** |
| --- | --- |
| Empty upper-right quadrant — no social cataloguing product exists for visual art, anywhere | **Instagram inertia** — the substitute is free, universal and already habitual |
| Record 74% arts attendance + 60% priced out of ticketed arts → free galleries gain share | Art Guide or Time Out ships a "log your visits" feature with a 60k-follower distribution advantage |
| Cultural tourism at 3.6m international visitors/yr — high-intent discovery traffic | Gallery sector margin compression (fair sales −30% since 2022) suppresses willingness to pay |
| Grant funding as cultural infrastructure (Create NSW, Creative Australia, City of Sydney) | Press-image licensing dispute with a major venue → reputational + legal exposure |
| Powerhouse Parramatta + Western Sydney growth = an under-covered district to own early | Key-person risk: register curation, approvals and code all sit with one person |
| First Nations arts engagement up 32%→40%; fairs register already in place | Privacy obligations grow with the social graph (DMs, private profiles, minors) |

---

## 13. Risk register

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| R1 | **Demo-mode rebuild** — `docs/` exported without Supabase credentials silently reverts the live site to local-only storage; every user account and log becomes disposable | Medium | **Critical** | Never hand-build; rely on `deploy-pages.yml`. **Add a CI guard that fails the build when the env vars are absent** rather than falling back to demo — a loud failure is strictly better than a silent one |
| R2 | Social graph never reaches liquidity | **High** | High | Instrument the 500-logger test; seed density via the opening-night circuit before broad acquisition |
| R3 | No native app → push notifications inert → save→visit conversion stays low | High | High | Ship to TestFlight/App Store; this is the highest-leverage engineering item in the plan |
| R4 | Incumbent (Art Guide / Time Out) copies the log mechanic | Medium | High | Compound the register and log history; move to a second city before they finish their first |
| R5 | Press-image rights dispute | Low | Medium-High | Provenance is already recorded per image; publish a takedown path and an image-sourcing policy page |
| R6 | Key-person dependency | **High** | High | Document the register schema and approval SOP; the pipeline already reduces the editorial load |
| R7 | Privacy/compliance gap on DMs, private profiles, potential under-18 users | Medium | Medium | Privacy policy, retention schedule, account deletion, age gate before any paid marketing |
| R8 | Venue churn / stale register | Medium | Medium | Already mitigated — weekly validation + `hours_checked` surfaced in the UI so staleness is visible, not silent |
| R9 | Monetising too early destroys perceived neutrality | Medium | High | Keep listings free permanently; label any paid placement unmistakably; cap paid slots |

---

## 14. Assumptions and methodology

**Method:** bottom-up sizing from population and published attendance rates; competitive analysis
from public positioning and business models; supply-side counts from ART EYE's own register (143
distinct venue slugs in `venues_seed.sql`); financial models built from stated benchmarks, marked as
estimates throughout.

**Assumptions requiring validation (in order of how much the conclusions move if wrong):**

1. **25% visual-arts attendance rate** — drawn from the Creative Australia National Arts
   Participation Survey series. The 2025 wave's *artform-level* visual-arts figure was not directly
   retrievable at time of writing (source PDF unreachable). Sensitivity tested at 20–30% in §3.1;
   the SOM band is insensitive to it. **Verify against the 2025 NAPS artform factsheet.**
2. **15% of attenders are "frequent" (3+ visits/yr)** — inference from category behaviour, not
   measured. This directly sets the SAM. **Highest-value assumption to test**, and testable cheaply
   from the app's own logs once ~200 users exist.
3. **A$1,200/yr venue ARPA** — inferred from small-business SaaS norms and sector budget pressure.
   Untested; no price has been put to any venue.
4. **~85 revenue-addressable Sydney venues** — segmentation of the 143-venue register by type and
   commercial status; directionally sound, not audited line by line.
5. **Greater Sydney ~5.5m / adults 15+ ~82%** — standard ABS-order estimates, not a fetched figure.

**What this analysis deliberately does not claim:** any figure for ART EYE's current users, sessions,
or retention. No analytics data was available in the repository. Every user-side number here is a
market estimate, not a measurement — and the first recommendation of §15 is to make that untrue.

---

## 15. Recommended actions (next 12 months)

| Horizon | Action | Why | Success measure |
| --- | --- | --- | --- |
| **0–30 days** | Add a build guard that **fails** the Pages export when Supabase env vars are missing | R1 is the only risk that can destroy the core asset instantly | CI fails loudly on a credential-less build |
| **0–30 days** | Instrument the §10.2 KPI tree (logs/user/month, follows, save→visit, D30) | Every strategic decision below is gated on numbers that don't exist yet | Dashboard with 4 core metrics live |
| **0–60 days** | Publish privacy policy, deletion path, image-sourcing/takedown policy | Compliance prerequisite for any marketing, App Store review, or venue partnership | All three pages live |
| **30–90 days** | **Ship the native iOS app** and turn on opening-reminder push | Push is the only mechanic that converts *saved* into *seen*; it is inert on web | App live; save→visit ≥25% |
| **30–90 days** | Reposition the top-of-funnel message on **free** + **record**, not "listings" | 60% cite cost as the barrier; galleries are free; nobody else is saying it | Message tested on landing page |
| **60–120 days** | Run the **opening-night density campaign** — recruit segments 1 and 4 (loggers + sector) at ARI and gallery openings | Liquidity is achieved by density in one social cluster, never by breadth | **500 active loggers, ≥5 follows median** |
| **90–180 days** | Venue claim campaign across the 143 (free, self-serve, no upsell) | Claim rate is the leading indicator of all supply-side revenue | 30% of active-show venues claimed |
| **90–180 days** | Apply for Create NSW / City of Sydney funding; open a Destination NSW conversation | Fastest non-dilutive money; validates the infrastructure framing | 1 grant submitted, 1 partnership meeting |
| **6–12 months** | Extend register coverage to **Western Sydney / Parramatta** ahead of Powerhouse Parramatta | An under-covered, growing district nobody owns yet | +25 venues west of the CBD |
| **9–12 months** | **Decision gate:** did the liquidity test pass? | Determines Scenario A vs B/C, and whether Melbourne is funded | Go / no-go, documented |
| **12 months+** | Only then: pilot the venue insights tier with 5 friendly galleries | Sell intelligence, never reach — and only once there's data worth selling | 3 of 5 convert at A$79–149/mo |

---

## Sources

- [Creative Australia — More Australians attending arts than ever, but cost is a growing barrier (2025 National Arts Participation Survey)](https://creative.gov.au/news-events/news/more-australians-attending-arts-ever-cost-growing-barrier)
- [Creative Australia — Creative Transformations: Results of the National Arts Participation Survey](https://creative.gov.au/research/creative-transformations-results-national-arts-participation-survey)
- [ArtsHub — Cost a growing factor preventing arts participation, Creative Australia's national survey reveals](https://www.artshub.com.au/news/news/cost-a-growing-factor-preventing-arts-participation-creative-australias-national-survey-reveals-2861203/)
- [SBS News — Almost all Australians engage with the arts as attendance hits record high](https://www.sbs.com.au/news/article/almost-all-australians-engage-with-the-arts-as-attendance-hits-record-high/reoq061f3)
- [Art Gallery of NSW — Annual Report 2024–25 (NSW Parliament)](https://www.parliament.nsw.gov.au/tp/files/192250/2024-25%20Annual%20Report%20Art%20Gallery%20of%20NSW.pdf)
- [Data.NSW — In-person visits to NSW cultural institutions](https://data.nsw.gov.au/data/dataset/in-person-visits-to-nsw-cultural-institutions-xlsx)
- [The Art Newspaper — Sydney Contemporary art fair sees fourth year of declining sales](https://www.theartnewspaper.com/2025/09/24/sydney-contemporary-art-fair-sees-fourth-year-of-declining-sales)
- [ArtsHub — Was Sydney Contemporary a sales success? The numbers are in](https://www.artshub.com.au/news/opinions-analysis/was-sydney-contemporary-a-sales-success-the-numbers-are-in-2823105/)
- [Destination NSW — Sydney statistics](https://www.destinationnsw.com.au/insights/sydney-statistics)
- [Destination NSW — Connecting with visitors through culture](https://www.destinationnsw.com.au/newsroom/connecting-with-visitors-through-culture)
- [Art Guide Australia — FAQs](https://artguide.com.au/faq/)
- [Art Almanac](https://www.art-almanac.com.au/)
- [Ocula](https://ocula.com/)
- [US Chamber of Commerce — Artsy is making art collecting more achievable](https://www.uschamber.com/co/good-company/the-leap/artsy-art-buying-platform)
- [Deadline — Letterboxd sale: as corporate buyers circle, an underdog bidder surfaces](https://deadline.com/2026/07/letterboxd-sale-instrinsic-underdog-bidder-1236980779/)
- [IndieWire — Letterboxd sale talks are heating up](https://www.indiewire.com/news/business/letterboxd-sale-talks-heating-up-1235204624/)
- [Letterboxd — Wikipedia](https://en.wikipedia.org/wiki/Letterboxd)
- [Mumbrella — Urban List accused of misleading advertisers about audience size](https://mumbrella.com.au/urban-list-accused-of-misleading-advertisers-with-press-release-about-audience-size-333522)
- [Carriageworks — Sydney Contemporary 2025](https://carriageworks.com.au/events/sydney-contemporary-2025/)
