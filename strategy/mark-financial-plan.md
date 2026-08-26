# MARK — Financial Plan & Growth Strategy

**Prepared:** August 2026 · **Currency:** AUD unless stated (FX assumption A$1.00 = US$0.65)
**Fiscal year:** Australian FY, ending 30 June. FY27 = 1 Jul 2026 – 30 Jun 2027.

> **Scope note.** This plan is written for **MARK** — the product in this
> repository, shipping today under the working name ART EYE: a mobile-first
> network where people find exhibitions, save what they want to see, and keep a
> permanent record of what they saw. The plan assumes MARK is that product taken
> to market under its own verb. Every number below is a modelled assumption, not
> an observed result; §7 states the drivers so any of them can be re-run.

---

## 1. Executive summary

MARK is building the **permanent record of cultural attendance** — starting with
the one category where a record is genuinely scarce.

A film can be watched again forever. An exhibition runs for six weeks and is then
gone for good. That single asymmetry is the whole thesis: it makes a log of
exhibitions *unreproducible* (nobody can retroactively build yours), it makes
discovery *urgent* (see it before it closes), and it produces the one dataset the
art sector has never had — **verified, attributed attendance**.

That dataset is why MARK can monetise where comparable consumer logging apps
cannot. Letterboxd has 26M+ members and earns roughly US$0.50 per member per year
because it has no supply side to sell to. MARK's venue register — 137 verified
Sydney venues, an owner-managed venue account, and a review-queued submission
pipeline — is already built into the product. Galleries and museums will pay for
audience attribution at a modelled A$1,715 blended ACV against a A$450 acquisition
cost: **a 22× LTV/CAC business sitting underneath a consumer network.**

**The plan in one line:** win Sydney's exhibition audience completely on
near-zero capital, convert that density into venue subscriptions, then repeat the
density playbook city by city — and only then extend the verb from art to
everything else people attend.

### Headline numbers (base case)

| | FY27 | FY28 | FY29 | FY30 | FY31 |
|---|---:|---:|---:|---:|---:|
| Registered users (end) | 12,000 | 65,000 | 260,000 | 850,000 | 2,400,000 |
| Paying venues (end) | 22 | 95 | 300 | 780 | 1,850 |
| **Revenue** | **A$34k** | **A$155k** | **A$599k** | **A$1.95m** | **A$5.47m** |
| Gross margin | 46% | 53% | 66% | 74% | 79% |
| **EBITDA** | **(A$70k)** | **(A$486k)** | **(A$916k)** | **(A$1.69m)** | **(A$2.29m)** |
| Headcount (end FTE) | 1.5 | 4 | 9 | 22 | 48 |

Cumulative capital required across the five years: **A$5.5m**, of which the first
A$120k is non-dilutive. EBITDA breakeven in FY32 on the base case; FY30 on the
bear case, which never leaves Australia and is profitable precisely because it
stays small.

### What this plan is honest about

The art-only path is a **A$5–20m revenue business** — excellent, ownable, and
bootstrappable. It is not, by itself, "something big." Getting to venture scale
requires the second act in §4.6: MARK becoming the log for *everything you
attend*, at which point the comparable is no longer a gallery guide but
Letterboxd. The plan sequences both and refuses to start with the second one.

---

## 2. What already exists

Capital efficiency in FY27 depends on this being real, so it is worth stating
precisely. The following is shipped, not planned:

| Asset | State |
|---|---|
| iOS/web app | React Native + Expo, five tabs (Agenda, Venues, Feed, Saved, Curator), live at the public URL |
| Backend | Supabase (Postgres + RLS), live since Aug 2026 — 15 tables incl. `venues`, `exhibitions`, `user_visits`, `user_watchlist`, `follows`, `direct_messages` |
| Venue register | **137 verified Sydney venues** (galleries, museums, ARIs) with address, suburb, geo, website, Instagram |
| Programme data | 61 verified exhibitions; a scraping/validation pipeline (`validation_runs`, `venue_review_queue`) |
| Social layer | Feed, follows, likes, comments with replies & mentions, DMs between mutual follows, notification centre, push |
| Supply-side tooling | Venue accounts with self-serve venue management; submission → review queue → publish |
| Host desk | Full admin CRUD over venues, exhibitions, submissions, feedback — no SQL required |
| Trust & safety | Block, report, account deletion — App Store submission prerequisites, already built |
| Brand | Ink `#131211` on white, custom ARTEYE wordmark, Archivo hairline system, print-ready variants |

**Implication for the model.** The product cost of FY27 is roughly zero. Nearly
all of the first year's spend is acquisition and content, not engineering. Very
few pre-seed companies get to start the clock here.

**The one named liability.** Per `CLAUDE.md`, a `docs/` rebuild without Supabase
credentials silently reverts the live site to demo mode, where every visitor's
data becomes local-only and disposable. For a company whose entire asset is an
accumulating record, that is a business risk, not a build risk. It belongs in the
risk register (§11, R7) and needs a CI guard before any paid acquisition begins.

---

## 3. Market

### 3.1 Bottom-up, Sydney (the only market that matters in FY27)

| Step | Figure | Source / basis |
|---|---:|---|
| Greater Sydney adults | 4.3m | ABS resident population |
| Attend a gallery or museum at least annually | ~1.1m | ~26% adult attendance, Creative Australia participation data |
| **Frequent attenders** (3+ visits/yr — the loggable habit) | **~220k** | 20% of annual attenders |
| Exhibiting venues, Greater Sydney | ~300 | 137 verified in-product + ARIs, project spaces, pop-ups |

Sydney SOM at maturity: 220k frequent attenders × 45% network penetration ≈ **99k
engaged users**, plus ~180 monetisable venues. At blended maturity ARPU (§6.3)
that is roughly **A$1.0m of annual revenue from Sydney alone** — which is the
number that makes the city-by-city playbook work.

### 3.2 Serviceable market — twelve cities

Sydney, Melbourne, Brisbane, Auckland, London, New York, Los Angeles, Berlin,
Amsterdam, Paris, Toronto, Tokyo. Selected for gallery density, English-or-adjacent
programme metadata, and an existing habit of paid cultural attendance.

- Frequent gallery attenders across the twelve: **~15m**
- Exhibiting venues across the twelve: **~18,000**
- SAM at modelled maturity ARPU: **A$95m consumer + A$31m venue SaaS ≈ A$126m**

### 3.3 Total addressable market

The art-only TAM is disciplined and finite: ~1,078 gallery and museum businesses
operate in Australia (IBISWorld, 2026), and the count is *declining* ~2.7% a year.
A plan that depends on Australian galleries growing is a bad plan.

The real TAM is the verb, not the vertical. Cultural attendance logging across
art, film, live music, theatre, and dining is a **>100m-user category** — Letterboxd
alone holds 26M+ members on film. At A$10 blended annual ARPU that is a **>A$1bn**
revenue TAM. MARK earns the right to address it by first proving the loop in the
hardest, densest, most supply-constrained vertical.

---

## 4. Competition and the differentiation thesis

### 4.1 The field

| | What it is | What it proves | Where it is open |
|---|---|---|---|
| **Letterboxd** | 26M+ members; film logging; Pro US$19/yr, Patron tier; reportedly evaluating acquisition offers (2026) | Taste-identity + lists + share cards is the strongest organic growth engine in consumer software | No supply side, no local layer, no commerce. ~US$0.50/member/yr |
| **Beli** | Restaurant ranking; 75m+ ratings; ~US$5.3m raised; 45 staff | **Pairwise ranking** beats star ratings — better data, better habit, more fun | No venue monetisation; US-centric; no editorial authority |
| **Artsy / Artnet** | Merged under Beowolff Capital (2026); primary + secondary market data | The money in art is in transactions and data | Collector-facing, not visitor-facing. Nobody opens it on a Saturday |
| **Bloomberg Connects** | 1,500+ institutions; free; philanthropy-funded | Institutions will adopt a shared free platform | Owns *inside* the venue. Owns nothing *between* venues. No record, no social layer |
| **Fever / Dice / Eventbrite** | Experience ticketing | Take-rate at scale is real | Transactional. No memory, no identity, no reason to return between purchases |
| **Instagram / Google Maps** | The actual default | This is who you are really competing with | Neither keeps a *record*. A saved post is not a log |

### 4.2 The five wedges

**W1 — Scarcity is the retention engine.** A film log is a list of things that
still exist. An exhibition log is a list of things that don't. This makes MARK's
record structurally more valuable than Letterboxd's *per entry*, and it makes the
highest-value push notification in the category possible: *"Three shows on your
Saved list close this weekend."* No competitor can send that, because no
competitor's inventory expires.

**W2 — Verified supply, not scraped supply.** Letterboxd inherits TMDB. MARK
*owns* its register — 137 hand-verified venues, a review queue, and venue accounts
that maintain their own pages. Exhibition metadata is genuinely messy: no
standard, no ISBN, no release date, changing weekly. That mess is the moat.
Whoever does the unglamorous verification work owns the category, and it does not
compound for a competitor who starts two years later.

**W3 — Two-sided from day one.** The venue account is already in the product.
Every logged visit is attribution a gallery has never had — *which shows brought
people back, which suburbs they came from, which artists drove saves*. This is a
22× LTV/CAC business (§6.2), and it is precisely the layer Letterboxd cannot add
without building a register and a sales organisation from nothing.

**W4 — Editorial voice as a go-to-market weapon.** Ink on white, hairline rules,
letter-spaced Archivo caps, a custom wordmark. This is not decoration. Consumer
apps that look like consumer apps do not get a gallery director to return an
email; things that look like publications do. The design system is the reason
supply says yes, and supply is the reason the audience shows up.

**W5 — Density over reach.** Win >60% of Sydney's frequent attenders and >70% of
its venues before opening city two. A thin global product has a bad feed and an
unsellable venue proposition. A dense city product has both. This is the Beli and
early-Uber pattern, not the Letterboxd pattern.

### 4.3 On the name

The product's core interaction is already, literally, **MARK AS SEEN**. Naming
the company after the verb its users perform is the strongest position available:
it converts the brand into a habit ("did you mark it?"), it survives the category
expansion in §4.6 without a rebrand, and it is a claim no gallery guide can make.
Letterboxd named itself after a *format*. MARK names itself after the *act*.

### 4.4 Explicitly not competing on

Ticketing inventory (partner, don't build), art sales (Artsy owns it, and it
corrupts the editorial position), in-gallery audio guides (Bloomberg Connects gives
it away free — integrate, don't rebuild), and general event listings (Fever's
scale game is unwinnable and off-brand).

### 4.5 The optimisation borrowed from each

| Borrowed from | Applied to MARK |
|---|---|
| Letterboxd | Typographic share cards; public lists as identity; an annual review — **but only once logs are dense enough to be worth sharing** |
| Beli | Pairwise ranking ("better than the last show you saw?") instead of stars — ordinal data, higher completion, more addictive |
| Strava | Supply side pays (venues, fairs, festivals), never the audience's core loop |
| Untappd | Venue check-in as a zero-CAC physical acquisition channel |
| Bloomberg Connects | Institutions adopt free shared infrastructure — so make MARK's venue free tier genuinely excellent |

### 4.6 The second act

From FY30, once three-plus cities are dense, extend the verb: theatre, live music,
film at cinemas, restaurants — anything with a date, a place, and a closing night.
The data model already supports it (`venues`, `exhibitions`, `user_visits`,
`guides` are category-agnostic in all but naming). This is the transition from a
A$5m art business to a A$50m+ cultural-attendance network, and it is the only
version of this plan that is genuinely "big."

**It must not be started early.** Broadening before density is the single most
common way apps in this category die.

---

## 5. Business model

Five streams, deliberately sequenced. The consumer network is the *asset*; the
venue and commerce layers are the *engine*.

| # | Stream | Starts | Price | Gross margin |
|---|---|---|---|---:|
| S1 | **Venue subscriptions** (B2B SaaS) | FY27 | Free / Plus A$79 mo / Institution A$399 mo | 88% |
| S2 | **MARK PRO** (consumer) | FY27 | A$39/yr annual-only | 80% (after 15% store fee) |
| S3 | **Commerce** — ticketed shows, fairs, tours | FY28 | 6–8% take | 92% (net) |
| S4 | **Partnered guides** — sponsored editorial | FY27 | A$15–60k per programme | 70% |
| S5 | **Attendance intelligence** — anonymised benchmarking | FY29 | A$20–120k per licence | 90% |

### 5.1 Why venue SaaS leads

It is the only stream with an immediate, provable ROI conversation ("you had 340
marked visits last month; here is where they came from"), the only one that
compounds with density rather than with scale, and the only one no comparable
consumer app has built. It also funds the content operation that makes the
consumer product good — a genuine flywheel rather than a claimed one.

### 5.2 Venue tiers

- **Free** — listing, programme, photos, self-serve editing. Deliberately good; this is the register's completeness strategy, and it is how you reach 70% venue coverage in a city.
- **Plus (A$79/mo)** — attendance analytics, saves & visits by show, audience geography, unlimited images, "closing soon" push to people who saved you.
- **Institution (A$399/mo)** — multi-user, exhibition-level attribution reporting, API/calendar sync, featured placement in the Agenda, benchmarking against anonymised peer set, quarterly review.

The free tier's upgrade trigger is a **visible analytics teaser**: show the
gallery the top-line number and blur the breakdown. This is the single highest-
leverage pricing decision in the plan.

### 5.3 MARK PRO

Annual-only at **A$39** (≈US$25) — deliberately above Letterboxd's US$19, because
MARK's audience is smaller, wealthier, and buying a *record* rather than a
feature set. Annual-only removes monthly churn management entirely at this scale.
Pro carries: full statistics, unlimited saved lists, the exportable log, early
access to partnered programmes, no partner placements. **The core loop — find,
save, mark, follow — stays free forever.** Paywalling the log would kill the data
asset that the rest of the model depends on.

---

## 6. Unit economics

### 6.1 Consumer

| Driver | FY28 | FY31 | Note |
|---|---:|---:|---|
| Blended CAC | A$4.00 | A$6.00 | 65% organic in FY28 → 55% at scale |
| Free → Pro conversion | 5.5% | 7.0% | Letterboxd-class is low single digits; MARK's utility is higher |
| Blended revenue / MAU / yr | A$3.10 | A$6.50 | All five streams ÷ MAU |
| Average life | 3.2 yr | 3.5 yr | Art-going is a durable adult habit |
| Gross margin | 53% | 79% | Fixed content cost amortising |
| **LTV** | **A$5.26** | **A$17.75** | |
| **LTV / CAC** | **1.3×** | **3.0×** | |
| **CAC payback** | 15 mo | 11 mo | |

The FY28 ratio is below 1.5× and that is stated deliberately: **consumer
acquisition does not pay for itself in the early years.** It is not supposed to.
Paid consumer spend before FY30 is buying density for the venue sales motion, and
should be underwritten against venue ACV, not consumer LTV. This is the single
most important discipline in the operating plan.

### 6.2 Venue (the engine)

| Driver | Value |
|---|---:|
| Blended paid ACV at scale | A$1,715 |
| Tier mix (of all registered venues) | 60% free / 32% Plus / 8% Institution |
| CAC (founder-led, then inside sales) | A$450 |
| Gross margin | 88% |
| Logo churn | 15%/yr (galleries genuinely close — IBISWorld shows −2.7% business count p.a.) |
| Net revenue retention | 105% (tier upgrades offset logo churn) |
| **LTV** | **A$10,061** |
| **LTV / CAC** | **22.4×** |
| **CAC payback** | **3.2 months** |

### 6.3 Blended maturity ARPU per MAU per year

| Stream | A$/MAU/yr |
|---|---:|
| MARK PRO (7% × A$39) | 2.73 |
| Venue SaaS (1 paying venue per ~450 MAU) | 2.29 |
| Commerce (13% transact × A$50 × 7%) | 0.46 |
| Partnered guides | 0.62 |
| Attendance intelligence | 0.40 |
| **Blended** | **A$6.50** |

At a 35% MAU/registered ratio this is ≈A$2.28 per registered user per year —
roughly **4× Letterboxd's**, entirely because of the two streams Letterboxd
doesn't have.

---

## 7. Financial plan

### 7.1 Drivers

| Driver | FY27 | FY28 | FY29 | FY30 | FY31 |
|---|---:|---:|---:|---:|---:|
| Cities live (end) | 1 | 3 | 7 | 10 | 14 |
| Registered users (end) | 12,000 | 65,000 | 260,000 | 850,000 | 2,400,000 |
| MAU (end) | 4,200 | 23,000 | 91,000 | 300,000 | 840,000 |
| Average MAU | 2,300 | 13,600 | 57,000 | 196,000 | 570,000 |
| Pro conversion | 5.0% | 5.5% | 6.0% | 6.5% | 7.0% |
| Registered venues (end) | 137 | 420 | 1,100 | 2,600 | 5,600 |
| Paying venues (end) | 22 | 95 | 300 | 780 | 1,850 |
| Blended venue ACV | A$1,200 | A$1,380 | A$1,520 | A$1,650 | A$1,715 |

### 7.2 Revenue build (A$000)

| Stream | FY27 | FY28 | FY29 | FY30 | FY31 |
|---|---:|---:|---:|---:|---:|
| S1 Venue subscriptions | 13 | 76 | 281 | 825 | 2,127 |
| S2 MARK PRO | 4 | 29 | 133 | 497 | 1,556 |
| S3 Commerce | 2 | 5 | 24 | 99 | 337 |
| S4 Partnered guides | 15 | 45 | 120 | 350 | 900 |
| S5 Attendance intelligence | — | — | 40 | 180 | 550 |
| **Total revenue** | **34** | **155** | **599** | **1,951** | **5,470** |
| Venue SaaS as % of total | 38% | 49% | 47% | 42% | 39% |

### 7.3 P&L (A$000)

| | FY27 | FY28 | FY29 | FY30 | FY31 |
|---|---:|---:|---:|---:|---:|
| Revenue | 34 | 155 | 599 | 1,951 | 5,470 |
| Hosting & infrastructure | (6) | (22) | (70) | (185) | (430) |
| Store & payment fees | (1) | (6) | (25) | (90) | (285) |
| Content & photography | (12) | (45) | (110) | (240) | (420) |
| **Gross profit** | **16** | **82** | **394** | **1,436** | **4,335** |
| *Gross margin* | *46%* | *53%* | *66%* | *74%* | *79%* |
| People | (40) | (420) | (920) | (2,150) | (4,600) |
| Sales & marketing | (25) | (95) | (260) | (680) | (1,450) |
| G&A (legal, accounting, tools, insurance) | (20) | (53) | (130) | (300) | (570) |
| **EBITDA** | **(70)** | **(486)** | **(916)** | **(1,694)** | **(2,285)** |
| Cumulative EBITDA | (70) | (556) | (1,472) | (3,166) | (5,451) |

Note that FY27 people cost is A$40k of contractor time only — the founder is
unpaid, and the product is already built. Modelled EBITDA breakeven: **FY32**, at
roughly A$9.5m revenue and 62 FTE.

### 7.4 Headcount

| End of | FTE | Composition |
|---|---:|---|
| FY27 | 1.5 | Founder + part-time editorial/community |
| FY28 | 4 | + engineer, + venue partnerships, + editor |
| FY29 | 9 | + 2 eng, + 2 city leads, + designer, − |
| FY30 | 22 | + inside sales team, + data, + city leads ×4 |
| FY31 | 48 | + international ops, + platform eng, + BD |

Fully-loaded average A$135k (Sydney, incl. 12% super and on-costs); engineering
A$165k, editorial/ops A$105k.

### 7.5 Scenarios

| FY31 | Bear | **Base** | Bull |
|---|---:|---:|---:|
| Cities | 2 | 14 | 22 |
| Registered users | 180,000 | 2,400,000 | 7,200,000 |
| Pro conversion | 4% | 7% | 9% |
| Paying venues | 340 | 1,850 | 4,200 |
| Category expansion | none | begun FY30 | full from FY29 |
| **Revenue** | **A$1.6m** | **A$5.5m** | **A$19.3m** |
| EBITDA | +A$310k | (A$2.29m) | (A$3.1m) |
| Capital required | A$250k | A$5.5m | A$16m |
| Character | Profitable Australian business | Venture-track, pre-Series-A | Category-defining |

**The bear case is not a failure case.** A two-city, venue-SaaS-led MARK doing
A$1.6m at positive EBITDA with the founder in control is a genuinely good outcome,
and it is the floor the bootstrap-first capital strategy in §8 is designed to
protect. The plan's job is to make the base case reachable *without* betting the
bear case on it.

---

## 8. Capital plan

### 8.1 Sequence

**Stage 0 — now → Jun 2027 · A$120k · zero dilution.**
Founder capital A$40k; a Create NSW / Creative Australia project grant (the NSW
Arts and Cultural Funding Program is a A$7.7m annual pool); and the **R&D Tax
Incentive** — a 43.5% *refundable* offset for companies under A$20m turnover, worth
≈A$39k cash back on A$90k of eligible development. Non-dilutive money is the
cheapest money on this cap table and the product is already built. Use it.

**Stage 1 — Pre-seed, ~Sep 2027 · A$750k on A$4.5m post (16.7%).**
Unlock criteria, all of which must be true:
- 10,000 registered Sydney users
- 25 paying venues, ≥A$60k ARR
- D30 retention ≥28%, D90 ≥18%
- ≥3 marks per active user per month

Targets: Australian pre-seed funds (Startmate, Skalata, Antler, Black Nova, Tidal)
plus arts-adjacent angels — collectors, gallerists, ex-auction-house operators, who
bring supply-side introductions worth more than the cheque.

**Stage 2 — Seed, ~Oct 2029 · A$3.5m on A$18m post (19.4%).**
Unlock: A$750k ARR run-rate, three cities live, venue NRR ≥110%, blended LTV/CAC
≥3.0, one city proving the density model repeats outside Sydney.

**Stage 3 — Series A, FY32 · A$12m on A$60m post (16.7%).**
Only on evidence that the category expansion (§4.6) works. If it doesn't, don't
raise it — run the bear case profitably instead.

### 8.2 Dilution

| | Founder | ESOP | Pre-seed | Seed | Series A |
|---|---:|---:|---:|---:|---:|
| Today | 100.0% | — | — | — | — |
| Post pre-seed | 75.0% | 8.3% | 16.7% | — | — |
| Post seed | 57.8% | 12.0% | 12.9% | 17.3% | — |
| Post Series A | 47.4% | 13.0% | 10.6% | 14.2% | 14.8% |

Founder majority is retained through Series A. Preserving it is a real constraint
on the plan, not an afterthought — which is why Stage 0 is non-dilutive and why
Stage 1 is deliberately small.

### 8.3 Additional non-dilutive sources

- **R&D Tax Incentive** — recurring; ≈A$174k cash on A$400k eligible R&D in FY29.
- **Export Market Development Grant (EMDG)** — matched funding up to A$80k/yr, applicable from the first international city.
- **City of Sydney** cultural and business grants — small, but they carry institutional credibility that opens venue doors.
- **Institutional pilot fees** — charge for S5 pilots from the first one. Customer-funded R&D is better than grant-funded R&D.

### 8.4 Use of pre-seed funds (A$750k, 18 months)

| | A$ | % |
|---|---:|---:|
| Engineering (1 senior FTE, 18 mo) | 250k | 33% |
| Venue partnerships & inside sales | 165k | 22% |
| Content & editorial operations | 120k | 16% |
| Consumer acquisition (Sydney + Melbourne) | 130k | 17% |
| G&A, legal, App Store, insurance | 60k | 8% |
| Buffer | 25k | 4% |

---

## 9. Go-to-market: the density playbook

The playbook is fixed, repeatable, and run in this order in every city. Deviating
from the order is what kills marketplaces.

**Phase 1 — Supply (months 0–3).** Verify every venue by hand before launch. This
is already done for Sydney. Target ≥70% of the city's exhibiting venues listed and
accurate, ≥25% with a claimed venue account. No consumer marketing during this
phase.

**Phase 2 — Seed the record (months 2–5).** Fifty founding curators — critics,
artists, gallerists, arts writers, the people whose logs others want to read.
Hand-recruited, personally onboarded. The feed must be worth reading on day one or
retention never starts.

**Phase 3 — Physical acquisition (months 4–12).** The channel no competitor has:
a card at the gallery desk. A venue with a claimed account gets printed
MARK cards in the house style. Zero CAC, perfect intent, and it makes the venue an
acquisition partner rather than an acquisition target. **This is the single most
important channel in the plan** — and it exists only because MARK's inventory is
physical.

**Phase 4 — Editorial & search (months 6+).** Every exhibition page is an indexable
answer to "what's on in Sydney this weekend" — a query with durable volume and weak
incumbents. Publish weekly agenda guides; partner with arts media rather than
competing with them.

**Phase 5 — Monetise supply (months 9+).** Only once a venue can be shown its own
attendance number. The sales conversation is the data, not the software.

**Phase 6 — Open the next city (month 12+).** Only at ≥60% frequent-attender
penetration and ≥70% venue coverage.

### 9.1 Channel economics

| Channel | CAC | Share FY28 | Share FY31 |
|---|---:|---:|---:|
| Venue cards & in-gallery QR | ~A$0.60 | 22% | 14% |
| Organic / word of mouth / share cards | A$0 | 43% | 41% |
| Editorial & SEO | ~A$1.80 | 12% | 20% |
| Founding-curator networks | ~A$2.00 | 8% | 3% |
| Paid social (Meta, Reddit, Substack) | ~A$9.00 | 15% | 22% |
| **Blended** | **A$4.00** | | **A$6.00** |

---

## 10. The optimisation programme

Where the modelled numbers actually come from. Each lever names the metric it
moves.

### 10.1 Activation — target 35%

**Aha moment: three marks in the first seven days.** Users who reach it retain at
roughly 3× the rate of those who don't, in every comparable logging product.

- **Onboarding as retroactive logging.** First run asks *"which of these have you already seen?"* over a grid of the last twelve months' major Sydney shows. A new user leaves onboarding with a log of eight, not zero. This single screen is the highest-ROI unbuilt feature in the plan.
- Save → visit prompt: a push on the day a saved show opens, and again three days before it closes.
- No sign-up wall before browsing. Ask for the account at the first mark.

### 10.2 Retention — target D30 ≥ 30%, D90 ≥ 20%

- **Closing-soon alerts.** *"Three shows on your Saved list close this weekend."* Unique to expiring inventory; expected to be the highest CTR notification in the product.
- **Pairwise ranking** (from Beli). After marking, ask *"better than [the last show you saw]?"* — three taps produce an ordered personal canon. Ordinal data is dramatically better for recommendations than a 5-star scale, and completion rates are far higher.
- **Weekly agenda digest**, Thursday morning, personalised by followed venues and saved artists.
- **Follow-graph density.** Users following ≥5 accounts retain far better; make people-discovery a first-run step, not a settings page.

### 10.3 What to *delay*

The repo removed the month-streak stat and Year Wrapped (commit `e84b0e3`). That
was correct: a wrapped screen over an empty log is embarrassing and teaches users
the product is thin. **Reintroduce Year in Review in Nov FY29**, once median logs
exceed twelve entries — at which point it becomes the year's single largest
acquisition event, as it is for Letterboxd and Spotify. The same discipline applies
to streaks: gamifying attendance frequency is off-brand for an audience that values
discernment over volume. If streaks return at all, count *distinct venues*, not
consecutive weeks.

### 10.4 Monetisation optimisation

- **Venue free-tier teaser** — show the headline attendance number, blur the breakdown. Modelled to drive the majority of Plus conversions.
- **Annual-only Pro** — no monthly option; removes churn management, raises effective LTV ~20% versus a monthly plan at equivalent headline price.
- **Founding-member pricing** — first 1,000 Pro subscribers at A$29/yr locked for life. Cheap scarcity, strong signal, and a durable advocacy cohort.
- **Institution tier sold on the quarterly review**, not the feature list. The meeting is the product.
- **Commerce attach at the moment of intent** — the ticket link belongs on the exhibition page next to Save, not in a separate tab.

### 10.5 Cost optimisation

- Keep Expo/React Native — one codebase, three platforms; a native rewrite before FY30 would be a self-inflicted wound.
- Supabase to A$500/mo scale before any infrastructure re-architecture is warranted.
- Content cost is the real variable: drive it toward zero by making venue self-serve genuinely better than the alternative. Every venue that maintains its own page removes a marginal cost *and* adds a monetisable account. Target 60% self-maintained by FY30.
- Cap paid consumer spend at 20% of S&M until blended LTV/CAC ≥ 2.5×.

### 10.6 KPI tree

```
Revenue
├── Venue ARR ............ registered venues × paid % × ACV × (1 − churn)
│   └── driven by: city venue coverage, attendance data quality, NRR
├── Pro ARR .............. MAU × conversion × A$39
│   └── driven by: activation %, D30, logs per user
├── Commerce ............. MAU × transact % × basket × take
└── Guides + intelligence  partnerships closed × avg contract
```

### 10.7 Operating dashboard — reviewed weekly

Activation (3 marks / 7 days) · D30 & D90 · marks per active user per month ·
saves→visit conversion · venue coverage % by city · claimed venue accounts % ·
paid venue count & NRR · blended CAC by channel · LTV/CAC · gross margin ·
net burn · months of runway.

---

## 11. Risk register

| | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | **Cold start** — thin feed, no reason to return | High | High | Supply-first playbook (§9); 50 hand-recruited founding curators before any consumer spend |
| R2 | **Content freshness cost** scales linearly with cities | High | Medium | Venue self-serve + the existing scraping/validation pipeline; target 60% self-maintained by FY30 |
| R3 | **Key-person risk** — single founder | High | High | ESOP from pre-seed; document the host-desk operations; first engineering hire at Stage 1 |
| R4 | **Gallery sector contraction** (−2.7% business count p.a.) | Medium | Medium | Widen the register to ARIs, institutions, fairs, festivals; geographic diversification is the real hedge |
| R5 | **Platform fee & policy risk** (Apple 15–30%) | Medium | Medium | Web checkout for Pro; venue SaaS billed off-platform entirely — already the majority of revenue |
| R6 | **A well-funded incumbent copies the wedge** | Low | High | The register is 137 hand-verified venues and a review pipeline, not a feature. Sell the supply side early — a gallery under contract is a switching cost |
| R7 | **Data-integrity failure** — a `docs/` rebuild without Supabase credentials silently reverts the live site to demo mode | Medium | **Critical** | CI guard that fails the build when `EXPO_PUBLIC_SUPABASE_URL` is unset; smoke-test the build stamp post-deploy. **Required before any paid acquisition** |
| R8 | **Premature category expansion** dilutes the brand | Medium | High | Hard gate: no vertical beyond art until three cities clear the density thresholds |
| R9 | **Seasonality** — Sydney's calendar peaks Mar–May and Sep–Nov | High | Low | Model quarterly, not monthly; use troughs for venue sales and product work |
| R10 | **Consumer CAC never pays back** | Medium | High | Underwrite consumer spend against venue ACV until FY30 (§6.1); the 20% S&M cap is the control |

---

## 12. Operating plan — the next eighteen months

| Quarter | Objective | Exit criteria |
|---|---|---|
| **Q1 FY27** (Jul–Sep 26) | Ship the R7 CI guard; App Store submission; retroactive-logging onboarding | App live on the App Store; guard merged |
| **Q2 FY27** (Oct–Dec 26) | 50 founding curators; venue account claims | 40 claimed venue accounts; 1,500 registered users; D30 ≥25% |
| **Q3 FY27** (Jan–Mar 27) | Venue cards in galleries; pairwise ranking ships; first partnered guide | 4,000 users; A$15k guide revenue; 8 paying venues |
| **Q4 FY27** (Apr–Jun 27) | Launch venue Plus properly; grant applications lodged; R&D claim filed | 22 paying venues; A$34k FY27 revenue; A$39k R&D refund |
| **Q1 FY28** (Jul–Sep 27) | **Raise pre-seed**; first engineering hire | A$750k closed; 12,000 users; D30 ≥28% |
| **Q2 FY28** (Oct–Dec 27) | Melbourne supply build | Melbourne ≥70% venue coverage |
| **Q3 FY28** (Jan–Mar 28) | Melbourne consumer launch; commerce partnerships live | 3 cities; 40,000 users |
| **Q4 FY28** (Apr–Jun 28) | Brisbane; venue sales made repeatable without the founder | 95 paying venues; A$155k FY28 revenue; NRR ≥105% |

### Immediate next actions

1. **Merge a CI guard** that fails any `docs/` build with `EXPO_PUBLIC_SUPABASE_URL` unset (R7). This is a business-critical control, not a chore.
2. **Build retroactive onboarding** — "which of these have you already seen?" (§10.1). Highest-ROI unbuilt feature in the plan.
3. **Ship closing-soon notifications** (§10.2). The category's defining alert; the push infrastructure already exists.
4. **Register the R&D Tax Incentive claim** for FY26 development already performed. That is cash on work already done.
5. **Book twenty gallery meetings.** Not to sell — to show them their own attendance data. The product demo *is* the sales pitch, and it only works once the numbers are real.

---

*Modelled August 2026. All figures are assumptions, and the drivers in §7.1 are
the ones to argue with first.*
