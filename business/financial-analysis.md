# ART EYE — financial analysis and the route to a viable business

*Sydney, August 2026. All figures in AUD, excluding GST.*
*Model: [`business/model.py`](model.py) — every number in this document comes out of that
script and can be reproduced with `python3 business/model.py`.*

---

## 0. Executive summary

ART EYE already has the thing most startups spend years building: a verified supply side.
**143 Sydney venues** (104 galleries, 23 museums, 16 ARIs), 61 verified exhibitions, a
self-validating data pipeline and a live Supabase backend. That is the capital in this business.
The financial question is not whether there is a product, but whether anyone will pay for it.

The answer from the model: **yes — but not the audience.** In year 3 consumers contribute
A$23,119, or 8% of revenue. Galleries and museums contribute A$111,031 in subscriptions and
A$132,000 in campaigns: **80% of revenue between them**. Financially, ART EYE is not a consumer
app with a business sideline. It is a **B2B media and SaaS business with a consumer app as its
distribution channel.** Every dollar spent squeezing the consumer instead of deepening the venue
relationship is spent in the wrong place.

This version of the plan starts with **no staff at all**. Nobody is paid — not a contractor, not
the founder — until revenue clears a threshold. That single decision changes the shape of the
business:

| Base case | Year 1 | Year 2 | Year 3 |
| --- | ---: | ---: | ---: |
| Paying venues (end) | 43 | 82 | 114 |
| MAU (end) | 4,000 | 12,000 | 24,000 |
| **Revenue** | **A$27,019** | **A$131,113** | **A$302,117** |
| People cost | **A$0** | A$40,100 | A$182,200 |
| Other costs | A$16,660 | A$39,848 | A$76,402 |
| **EBITDA** | **A$10,359** | **A$51,165** | **A$43,515** |
| Cash (cumulative) | A$10,359 | A$61,525 | A$105,040 |

Four conclusions the rest of this document works through:

1. **The business needs A$1,522 to get going.** That is the deepest the cash position ever goes,
   in month 3. Break-even arrives in **month 4**, at 19 paying venues. There is no funding round
   to raise, no investor to answer to, and no runway to manage. That is an unusual position and it
   should be protected, not traded away.
2. **The first money the business pays out is the founder's own draw, in month 14** — after year 1
   has closed with A$10,359 in the bank. Year 1 is unpaid founder work. That is the real cost of
   this plan, and it should be stated plainly rather than hidden in a spreadsheet line.
3. **The biggest financial risk is internal.** Raising people cost 25% above what the thresholds
   allow turns year 3 EBITDA from +A$43,515 into **−A$2,035** — a A$45,550 swing on revenue that
   does not change by a cent. Nothing external in this model comes close.
4. **The outcome is a good small business, not a scale business** — unless the second city works.
   Sydney alone tops out at roughly 110 payable venues. Opening Melbourne in month 19 is not
   ambition; it is arithmetic.

---

## 1. What is already built

Before a single assumption, this is the factual starting position, taken from the codebase:

| Asset | Where it stands | What it means financially |
| --- | --- | --- |
| Venue register | 143 venues, verified, with address and lat/long | The sales list. This *is* the addressable Sydney market, already qualified. |
| Contact data | 126 websites, 112 Instagram handles | A cold-outreach channel that costs nothing to acquire. |
| Agenda | 61 verified exhibitions | The product is full. No cold-start problem at launch. |
| Data pipeline | `validate-venues`, `discover-venues`, `enrich-images` | Editorial cost stays flat while the register grows. This is why gross margin can hold above 90%. |
| Backend | Supabase live, RLS, host controls | No build spend is required before invoicing can start. |
| Distribution | Web (GitHub Pages) plus an iOS path | Web billing sidesteps the 15% app-store fee on subscriptions. |

The pipeline deserves a separate note. In a conventional listings publisher, editorial cost is
**variable with the number of venues**: more venues, more people checking opening hours. Here it is
largely **fixed** — the AI jobs sit in the infrastructure line at roughly A$140–400 a month. That
difference is why 114 venues in year 3 can be served by less than two FTE, and it is the only real
technological cost advantage this business has.

---

## 2. The market, from the bottom up

### 2.1 Supply side: who can actually pay?

No top-down estimate is needed. The register *is* the market.

| Segment | Count | Ability to pay | Addressable |
| --- | ---: | --- | ---: |
| Commercial galleries | 104 | Sell work, hold a marketing budget. The smallest fifth has nothing to spend. | ~83 |
| Museums / institutions | 23 | Budget exists, but procurement is slow and multi-signature. | ~15 (phased) |
| ARIs (artist-run) | 16 | Run on grants and volunteers. Structurally will not pay. | 0 (keep them free — they supply content) |
| **Sydney total** | **143** | | **~110** |

Expansion steps in the model: **Melbourne from month 19** (+125 addressable; comparable or greater
gallery density than Sydney) and **the rest of Australia from month 31** (+90: Brisbane, Perth,
Adelaide, Hobart). Total addressable by year 3: **325 venues**.

At A$49 for Studio and A$149 for Pro, the **theoretical ceiling** on Sydney subscription revenue is
about A$8,000 MRR — A$96,000 a year — at an unreachable 100% penetration. This is the hardest
constraint in the analysis: **subscriptions alone will never make this larger than a one-person
business.** Campaign revenue (§3.2) and the second city are not upside. They are the business case.

### 2.2 Demand side: how large is the audience?

| Layer | Estimate | Basis |
| --- | ---: | --- |
| Adults in Greater Sydney | ~4.3m | Population figure, indicative |
| Visit a gallery or museum annually | ~1.1–1.3m | Roughly 25–30% participation; **to be validated against ABS Cultural Attendance and Create NSW** |
| Frequent visitor (4+ per year) | ~130–160k | 12% of visitors; this is the real target |
| Realistically reachable (SOM, year 3) | 24,000 MAU | ~16% of frequent visitors |

> **A warning about this table.** These are order-of-magnitude estimates, not market research. They
> are deliberately conservative, and the business case barely leans on them — consumer subscriptions
> are 8% of year 3 revenue. Before any money goes into the demand side (paid acquisition,
> influencers), the two italicised sources need to actually be looked up. For venue revenue none of
> this matters: that stands or falls on the 143 names already in the register.

### 2.3 Competition, and why it sets the price

| Player | What it does | What it costs a gallery |
| --- | --- | --- |
| Art Almanac / Art Guide Australia | Print and web listings, advertising model | A$300–900 per ad |
| Instagram | Reach, but algorithm-dependent and fleeting | "free" plus time plus ad spend |
| Time Out / Broadsheet | Editorial mention, not purchasable | unaffordable or unreachable |
| Own newsletter | Only reaches people who already know the gallery | time |

So the relevant price comparison is **not another app** — it is the A$300–900 a gallery already
spends on an Art Almanac ad. Against that benchmark A$49 a month (A$588 a year) is cheap, which is
the intention in year 1. The price grid in §8.2 suggests there is room to move to A$69 later.

---

## 3. Revenue model: five streams, one centre of gravity

### 3.1 Venue subscriptions (SaaS) — the base

| Tier | Per month | For whom | What it includes |
| --- | ---: | --- | --- |
| **Claim** | free | everyone in the register | Venue page, submit shows, basic listing. Keeps the agenda complete. |
| **Studio** | A$49 | small commercial gallery | Statistics (saved / seen / click-throughs), photo and video background, Reel link, priority in the review queue |
| **Pro** | A$149 | established gallery, several spaces | Everything in Studio, plus curator's-pick eligibility, opening-night push, audience insight, multiple concurrent shows |
| **Institutional** | A$499 | museum, art fair | Everything in Pro, plus campaign placement, data export, editorial collaboration |

Design choices with financial consequences:

- **The free tier is inventory management, not generosity.** The agenda has to be complete or there
  is no audience, and with no audience there is nothing to sell. Never put a show behind the paywall.
- **Annual contracts at two months' discount** (assumption: 35% take it). That costs 5.8% of gross
  subscription revenue and buys cash up front plus demonstrably lower churn.
- **Bill subscriptions on the web, not in-app.** Avoids the 15% app-store fee; only Stripe's 1.9%
  applies. On A$111,031 of year 3 subscription revenue that is worth about A$14,500.

### 3.2 Media and campaigns — the growth engine

Paid placement inside the editorial agenda: a week in the hero carousel, a slot in the curated
strip, an opening-night push to interested curators. A$800–1,200 per campaign, plus fair packages
around Sydney Contemporary, Art Month and Vivid (A$8,000–12,000).

By year 3 this is **the single largest stream at A$132,000** — larger than all subscriptions
combined. The reason is structural: campaign revenue is tied to **audience reach**, not to the
number of customers, so the same 24,000 MAU can be sold to the same gallery several times a year.
It is also the stream with the most editorial risk (§11).

The condition: campaigns are **always visibly labelled**, and the curator's pick is never for sale.
The credibility of the agenda is the product. Selling it sells next year's revenue.

### 3.3 Curator+ (consumer) — A$39/year

Unlimited saves, exportable personal archive, early opening-night alerts, a multi-venue day
planner, offline agenda. Conversion assumption: 2% of MAU in year 1 rising to 3.5% by year 3 —
cautious for a niche audience with high affinity.

Even **doubling** that conversion adds only A$22,839 to year 3 EBITDA (§8.1). Treat Curator+ as a
retention mechanism and as a signal to advertisers ("this audience pays"), not as a revenue pillar.

### 3.4 Ticket affiliate — from year 2

Referrals to ticketed museum exhibitions and fair tickets: 8% commission on a A$28 average basket.
Year 3: A$5,967. Small, but the margin is 100% and it builds the museum relationships that have to
buy the A$499 tier. It requires partner agreements that do not yet exist — do not bank it until one
is signed.

### 3.5 Data and insights — from year 3

A quarterly report on audience behaviour in the Sydney art sector (which suburbs, which channels,
which opening hours work), bought by institutions, councils and funders: 6 subscriptions at A$2,500
plus one sponsor at A$15,000 = A$30,000. The highest-margin stream and the most strategically
valuable: whoever publishes the sector's benchmark becomes the sector's infrastructure. It needs a
privacy-safe aggregation method first (§11).

### 3.6 Deliberately excluded

- **Grants** (Create NSW, City of Sydney, Creative Australia). Realistically in the A$10,000–50,000
  range and a strong fit for this profile, but non-recurring and unpredictable. Keep them out of
  the operating model and spend them on one-off items (the Melbourne expansion, the first report).
  **Check the current rounds and conditions directly** — they change every year.
- **Commission on art sales.** Tempting, and it turns ART EYE into a competitor of the galleries
  who are supposed to pay it. Strategically wrong.
- **Selling personal data.** Never. See §11.

---

## 4. Unit economics

Base case, year 1, blended across tiers:

| Metric | Value | Note |
| --- | ---: | --- |
| ARPA (revenue per venue per month) | **A$69** | after the annual-contract discount |
| Gross margin | **90%** | hosting and pipeline are the only real variable costs |
| Churn | **3.0% per month** | implied life 33 months |
| CAC | **A$339** | acquisition share of marketing plus founder selling time, costed at A$1,500/month |
| LTV | **A$2,084** | ARPA × margin ÷ churn |
| **LTV/CAC** | **6.1×** | healthy; the SaaS benchmark is 3× |
| **Payback** | **5.4 months** | well inside the 12-month norm |

Note that CAC charges the founder's selling time at A$1,500 a month even though year 1 pays nobody.
The time is a real cost of acquisition whether or not cash leaves the account, and pretending
otherwise would flatter the number.

For comparison: conservative 2.5× (CAC A$549 on slower acquisition — still above benchmark),
optimistic 11.5×.

**What this means:** per-customer economics are not this business's problem. Every venue that signs
pays for itself inside half a year. The problem is **volume × price**: 110 addressable venues in
Sydney at A$69 blended is a ceiling, not a growth path. So effort belongs on the two things that
break that ceiling — campaign revenue per existing account (§3.2) and the second city (§2.1) — and
not on optimising a CAC that is already healthy.

---

## 5. Cost structure

### 5.1 Infrastructure — strikingly low

| Item | Per month | Source |
| --- | ---: | --- |
| Supabase Pro | ~A$40 | US$25, check at the current rate |
| Anthropic API (3 pipeline jobs) | A$60–200 | the 30-calls-per-run cap is already in the code |
| Resend (digest mail) | ~A$30 | |
| Image storage / bandwidth | scales with MAU (A$0.012 per MAU) | |
| Apple Developer | ~A$12 | A$149 a year |
| Domain, monitoring, backup | ~A$25 | |
| **Year 1 total** | **~A$230/month** | rising to ~A$680 by year 3 |

At 24,000 MAU in year 3 that is A$8,184 a year, or **2.7% of revenue**. The technical decisions
already made — a static web export on GitHub Pages, Supabase instead of own servers, AI jobs with a
hard cost cap — are financially proven. There is nothing left to save here; stop optimising it.

### 5.2 People — starting from zero

This plan pays nobody until revenue says otherwise. Not a contractor, not the founder. Each role
opens only when monthly revenue clears its threshold:

| Revenue threshold | What opens | Monthly cost | Reached (base case) |
| ---: | --- | ---: | --- |
| A$4,000 | Founder's draw — the first money out | A$1,500 | month 14 |
| A$8,000 | Editorial / community freelance, ~0.3 FTE | A$1,600 | month 14 |
| A$12,000 | Founder's draw to A$3,500 | +A$2,000 | month 22 |
| A$16,000 | Contract developer, 0.5 FTE | A$3,500 | month 26 |
| A$22,000 | Partnerships and sales, 1 FTE | A$7,500 | month 26 |
| A$30,000 | Melbourne city editor, ~0.4 FTE | A$2,500 | year 4 |
| A$38,000 | Founder's draw to A$6,000 | +A$2,500 | year 4 |
| A$48,000 | Support and operations, 1 FTE | A$5,500 | year 4 |

Two consequences worth naming:

**Year 1 is unpaid founder work.** The business generates A$27,019 of revenue and A$10,359 of
profit, and none of it is drawn. That is the actual price of needing only A$1,522 of outside money,
and it is a legitimate choice — but it is a choice about a year of someone's life, not a line in a
spreadsheet. If a draw is needed sooner, take it from the year 1 profit and accept a later first
hire; the model has room for exactly one of the two.

**The steps are lumpy.** Revenue crosses several thresholds at once at the start of year 3, so
people cost jumps from A$5,100 to A$16,100 in a single month. In practice these hires should be
staggered a quarter apart, which flatters the cash line relative to the model.

### 5.3 Other costs

Marketing: the higher of a fixed floor (A$700–3,500/month) or 12% of revenue — deliberately tied to
revenue so it breathes with the business. Overhead (accounting, insurance, legal, terms and privacy
policy): A$420/month in year 1 rising to A$1,800 by year 3.

---

## 6. Three-year projection, three scenarios

### 6.1 Base case

| Line | Year 1 | Year 2 | Year 3 |
| --- | ---: | ---: | ---: |
| Venue subscriptions | A$22,141 | A$60,395 | A$111,031 |
| Media and fairs | A$3,200 | A$60,000 | A$132,000 |
| Curator+ | A$1,678 | A$8,926 | A$23,119 |
| Ticket affiliate | — | A$1,792 | A$5,967 |
| Data and insights | — | — | A$30,000 |
| **Revenue** | **A$27,019** | **A$131,113** | **A$302,117** |
| People | **A$0** | A$40,100 | A$182,200 |
| Marketing | A$8,400 | A$21,600 | A$42,000 |
| Infrastructure | A$2,738 | A$4,560 | A$8,184 |
| Overhead | A$5,040 | A$11,400 | A$21,600 |
| Transaction fees | A$481 | A$2,288 | A$4,618 |
| **Costs** | **A$16,660** | **A$79,948** | **A$258,602** |
| **EBITDA** | **A$10,359** | **A$51,165** | **A$43,515** |
| EBITDA margin | 38% | 39% | 14% |
| Cash (cumulative) | A$10,359 | A$61,525 | A$105,040 |

The margin drops from 39% to 14% in year 3. That is not deterioration; it is the deliberate
conversion of profit into capacity — partnerships, Melbourne and support all open that year.
Whoever wants to maximise year 3 profit keeps the gates shut and keeps A$79,955 (§8.1) — and has no
year 4.

### 6.2 The three side by side

| | Conservative | Base | Optimistic |
| --- | ---: | ---: | ---: |
| Venues, year 3 | 70 | 114 | 158 |
| MAU, year 3 | 11,000 | 24,000 | 42,000 |
| Revenue, year 1 | A$13,908 | A$27,019 | A$50,660 |
| Revenue, year 2 | A$56,470 | A$131,113 | A$235,500 |
| **Revenue, year 3** | **A$122,295** | **A$302,117** | **A$538,508** |
| EBITDA, year 3 | A$35,869 | A$43,515 | A$152,684 |
| Break-even | month 6 | **month 4** | month 2 |
| Deepest cash point | A$-2,055 (m5) | **A$-1,522 (m3)** | A$-497 (m1) |
| First person paid | month 17 | month 14 | month 7 |
| Cumulative revenue, 36 months | A$192,673 | A$460,249 | A$824,669 |

**The most striking row is the cash line.** Even when everything disappoints, the deepest the
business ever goes is A$2,055. A zero-payroll start does not make the company grow faster — revenue
is identical — but it removes the failure mode entirely. This business cannot fail spectacularly.
It can only stay small.

### 6.3 Quarterly detail, year 1 (base case)

| | Q1 | Q2 | Q3 | Q4 |
| --- | ---: | ---: | ---: | ---: |
| Venues (end) | 15 | 26 | 35 | 43 |
| Venue MRR (end) | A$1,031 | A$1,839 | A$2,475 | A$2,974 |
| Revenue | A$2,508 | A$5,734 | A$8,434 | A$10,343 |
| Costs | A$4,030 | A$4,126 | A$4,220 | A$4,283 |
| EBITDA | A$-1,522 | A$1,608 | A$4,214 | A$6,060 |
| Cash (end) | A$-1,522 | A$85 | A$4,299 | A$10,359 |

Milestones: first profitable month in **month 4** at 19 paying venues, cash trough of **A$1,522 in
month 3**, cash positive again from month 6, and A$2,974 of venue MRR (A$35,688 ARR) at the end of
year 1. Note how flat the cost line is across the four quarters — with nobody on payroll, quarterly
cost barely moves while revenue quadruples. That flatness *is* the plan.

---

## 7. Break-even and funding

| Question | Answer (base case) |
| --- | --- |
| When does revenue cover costs? | Month 4, and it stays covered |
| How much money is needed to get there? | **A$1,522** |
| How many venues does that take? | 19 paying venues — 17% of addressable Sydney |
| What if the conservative case plays out? | A$2,055, break-even in month 6 |
| Recommended buffer | **A$7,500** — covers the conservative trough three times over, plus a year of overhead if every venue leaves |

**Recommended funding route, in order:**

1. **Own funds (A$7,500 buffer).** Keeps 100% control and enforces the discipline §5.2 depends on.
   This is the recommended route, and at this size it is barely a decision.
2. **Prepaid annual contracts as working capital.** Ten venues paying A$490 up front is A$4,900 —
   three times the cash trough. The cheapest financing that exists, and it validates willingness to
   pay at the same time.
3. **A grant (A$10,000–50,000, non-dilutive).** The profile fits well: cultural infrastructure,
   Sydney sector, measurable audience reach. Apply to Create NSW and the City of Sydney; verify
   rounds and conditions yourself. Earmark it for the Melbourne expansion and the first sector
   report — not for running costs.
4. **Angel investment: only worth considering once the second city is proven.** Before that the
   valuation is low and the dilution expensive. At A$300,000 of revenue with a 14% margin and no
   cash need, there is no compelling reason.

---

## 8. Sensitivity

### 8.1 One variable at a time, off the base case

| Variant | Revenue yr 3 | EBITDA yr 3 | Break-even | Cash low |
| --- | ---: | ---: | ---: | ---: |
| **Base** | A$302,117 | A$43,515 | month 4 | A$-1,522 |
| People cost +25% | A$302,117 | **A$-2,035** | month 4 | A$-1,522 |
| People cost -20% | A$302,117 | **A$79,955** | month 4 | A$-1,522 |
| Media revenue doubled | A$434,117 | A$126,913 | month 4 | A$-1,261 |
| Media revenue halved | A$230,117 | A$57,383 | month 4 | A$-1,653 |
| Venue acquisition +30% | A$314,078 | A$55,250 | month 3 | A$-1,097 |
| Venue acquisition -30% | A$287,340 | A$44,019 | month 5 | A$-2,219 |
| Curator+ conversion ×2 | A$325,235 | A$66,354 | month 4 | A$-1,397 |
| Churn -1pp per month | A$310,665 | A$51,901 | month 4 | A$-1,509 |
| Churn +1pp per month | A$294,604 | A$43,645 | month 4 | A$-1,536 |

**Read the EBITDA column carefully — it contains a trap.** Halving media revenue *improves* year 3
EBITDA (A$57,383 against A$43,515). That is not an argument for selling fewer campaigns. It happens
because lower revenue keeps the business below its hiring thresholds, so people cost falls further
than revenue does. It exposes something true and important: **under this plan EBITDA is a policy
choice, not an outcome.** Marginal revenue is converted into capacity by design. So judge growth on
the revenue column, and judge profit on where the gates are set.

With that in mind, the ranking of what actually matters: (1) where the hiring thresholds sit,
(2) media revenue, (3) acquisition pace, (4) consumer conversion, (5) churn.

> **An honest caveat on the churn row.** Churn looks mild here because the model refills a lapsed
> venue from the addressable pool. In reality that re-acquisition costs selling time which is not
> charged as a variable cost, and in a market of 110 names the pool runs dry — you cannot recruit
> the same gallery three times. Read that row as a floor, not as reassurance. Churn above 4% a
> month makes "what is this product missing?" the top item on the agenda, whatever the table says.

### 8.2 Studio tier price point

A higher price means fewer customers and more churn; the question is where the optimum sits.

| Price | Assumed churn yr 3 | Venues yr 3 | Revenue yr 3 | EBITDA yr 3 |
| ---: | ---: | ---: | ---: | ---: |
| A$29 | 1.2% | 129 | A$290,202 | A$46,827 |
| A$39 | 1.5% | 122 | A$296,825 | A$45,824 |
| **A$49** | 1.8% | 114 | A$302,117 | A$43,515 |
| A$69 | 2.4% | 100 | A$308,935 | A$50,204 |
| A$89 | 3.1% | 86 | A$310,182 | A$51,427 |

The curve is remarkably flat: between A$29 and A$89, year 3 revenue moves less than 7%. So price is
**a positioning decision, not a lever**. Two practical conclusions: A$49 is the right opening price
for year 1 (low friction, faster reference customers), and there is room to put new customers on
**A$69** in year 2 with price protection for the first cohort — which rewards early venues and adds
roughly A$7,000 of EBITDA. Going below A$39 is pointless: more work, less money.

---

## 9. What makes this succeed — seven levers

In order of financial impact, each with its value from the model.

**1. Where the hiring thresholds sit (worth A$81,990 in year 3).** The table in §5.2 is a contract
with yourself. No role opens before the revenue is there — no exceptions, not even for a candidate
who is too good to lose. Concretely: the partnerships hire waits for A$22,000 of monthly revenue.

**2. Campaign revenue from existing accounts (worth A$204,000 of year 3 revenue between halving and
doubling).** Every paying venue is also a media customer. The sales conversation is not "would you
like a subscription" but "your opening is in three weeks — do you want that week's hero slot?".
Target: 30% of paying venues buy one campaign a year. Build a seasonal calendar around Sydney
Contemporary, Art Month and Vivid; those are predictable budget moments.

**3. The second city, on time (worth the difference between a ceiling and a growth path).** By month
24 there are 82 paying venues against ~110 addressable in Sydney — roughly three quarters used, and
each additional customer costs visibly more effort from there. Melbourne must start in month 19,
which means register-building from month 15. The playbook already exists: `discover-venues` does
there what was done by hand in Sydney.

**4. Annual contracts as the default (worth three times the cash trough).** Ten venues prepaying
A$490 is A$4,900 against a A$1,522 trough. Sell the annual contract as standard and the monthly
option as the exception.

**5. Retention through demonstrable value.** A gallery cancels when it cannot see what it is
getting. The statistics screen — saved, seen, click-throughs to website and Instagram, directions
opened — is therefore not a feature but **the evidence attached to the invoice**. Email it monthly,
including to venues that never log in. Target: churn below 2.5% a month.

**6. Guarding editorial credibility.** The curator's pick is not for sale; campaigns are always
labelled. This reads as a principle but it is a financial position: the moment the agenda reads as
an ad board, both the consumer side and the premium on campaigns evaporate.

**7. The sector report as a door opener (worth A$30,000 directly, more indirectly).** It opens
conversations at museums and councils where a A$499 subscription needs three signatures. Whoever
publishes the sector's benchmark gets called instead of calling.

---

## 10. KPI dashboard

Track monthly, with the value that demands action:

| KPI | Year 1 target | Alarm |
| --- | --- | --- |
| Paying venues | +3.5 net per month | < 2 net, two months running |
| Venue MRR | A$2,974 by end of year 1 | flat or falling |
| Venue churn | < 3.0%/month | > 4% |
| Free → paid conversion | > 25% of claimed venues | < 15% |
| MAU | 4,000 by end of year 1 | growth < 8%/month |
| Click-throughs per venue per month | > 40 | < 15 (no story to attach to the invoice) |
| Campaigns sold | 0.5/month from month 7 | zero for two months |
| Cash in the account | > A$5,000 | < A$2,000 |
| Cost per MAU | < A$0.10 | > A$0.25 |
| People cost ÷ revenue | < 45% | > 60% |

The last two move months before EBITDA does. They are the early warning.

---

## 11. Risks and mitigation

| Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- |
| **Galleries will not pay** | Medium | Fatal | Test it before building paid features: 20 sales conversations, target 10 prepaid annual contracts. A "no" here is worth more than six months of development. |
| **Hiring ahead of revenue** | Medium | Very high (A$45,550) | The threshold table, checked at the monthly KPI review |
| **Founder burnout in the unpaid year** | Medium | High | Year 1 is unpaid by design. Fix the draw date in advance (month 14, or earlier out of year 1 profit) and treat it as non-negotiable. |
| **Single-person dependency** | High | High | Document the pipeline and host controls; arrange technical backup before customer 50 |
| **Media revenue never starts** | Medium | Growth stalls | Sell the first campaign in year 1, at cost if necessary, to prove the channel works |
| **Sydney ceiling without a second city** | High after year 2 | High | Melbourne register from month 15 |
| **A build silently reverting to demo mode** | Low | High | Already documented in `CLAUDE.md`: never export by hand without the Supabase variables; the deploy workflow handles it. A silent revert means data loss for every visitor. |
| **Privacy of visit data** | Medium | High | Sector report aggregated only, with a minimum cell threshold, never re-identifiable; individual watchlists are already invisible to venue accounts (RLS). Check the Australian Privacy Act before publishing the first report. |
| **App Store rejection or policy change** | Low | Medium | Web is the primary channel and stays complete; iOS is an addition, not a dependency |
| **AI costs escalate** | Low | Low | The 30-calls-per-run cap is already in the code |
| **GST registration** | Certain in year 2 | Administrative | Required above A$75,000 of turnover; the base case crosses it in year 2. Prices are ex-GST, so business customers reclaim it. Verify the threshold and rate with the ATO. |
| **A funded competitor enters** | Low | Medium | The register of 143 verified venues with contact details is an 18-month head start. Deepen it: exclusive content, multi-year agreements with the 20 largest venues. |

---

## 12. First 90 days

**Days 1–30 — validate before building.**
Pick the 20 galleries with the most traffic on their ART EYE page. Have 20 conversations with one
question: what is a month in the hero slot worth to you? Target: **10 prepaid annual contracts at
A$490 = A$4,900** — three times the entire cash requirement, banked before the first expense. Build
nothing this month.

**Days 31–60 — make it billable.**
Stripe checkout on the web, outside the app-store fee. The per-venue statistics screen, plus the
monthly email carrying those numbers — that is the invoice evidence from lever 5. Tier limits behind
a flag, so free venues stay visible while paid features can be gated.

**Days 61–90 — open the media channel.**
Sell three campaigns, the first at cost if needed, and measure what a hero week delivers in
click-throughs. That number becomes the price justification from then on. Set up the §10 KPI review
as a fixed half hour each month.

**Decision point at day 90.** Are there ≥8 paying venues *and* ≥1 campaign sold? Then run the base
case. If not, do not keep building — go back to the price and the offer. That is a cheap lesson in
month 3 and an expensive one in month 18.

---

## Appendix A — Core assumptions

| Assumption | Value | Basis / status |
| --- | --- | --- |
| Addressable venues, Sydney | 110 of 143 | From the register; ARIs and the smallest galleries excluded |
| Addressable Melbourne (m19) / AU (m31) | +125 / +90 | Estimate based on comparable city size — **to be validated** |
| Prices | A$49 / A$149 / A$499 | Benchmarked against Art Almanac ad rates — **to be validated with real quotes** |
| Annual contracts | 35%, two months' discount | SaaS market convention |
| Venue churn | 3.0% → 1.8% per month | Estimate; small galleries are seasonal |
| MAU end of year 1/2/3 | 4,000 / 12,000 / 24,000 | Estimate; no traffic data yet |
| Curator+ conversion | 2.0% → 3.5% | Cautious for a high-affinity niche |
| Campaign price | A$800 → A$1,200 | Kept in line with the A$300–900 an Art Almanac ad costs |
| Gross margin | 90% | Derived from actual infrastructure cost |
| Store fee / Stripe | 15% / 1.9% | Small business programme; verify current rates |
| GST threshold | A$75,000 turnover | ATO, verify |
| People cost | A$0 until revenue thresholds | The defining assumption of this plan (§5.2) |

**A model limitation to know.** Assumptions step at the start of each model year rather than
changing gradually, so the monthly series jumps at month 13 and month 25 (campaign pace, fair
packages, marketing floor), and the hiring thresholds fire in clusters straight after. Annual
figures are unaffected; read those two transitions as year boundaries, not as expected spikes.

**What this model is not.** It is not market research: the demand-side figures are order-of-magnitude
estimates that need confirming against ABS and Create NSW data. It is not a forecast: it is a
calculator that shows which assumptions matter. And it is not tax or legal advice — company
structure, GST and the privacy obligations around the sector report need an accountant and a lawyer.

The only figures here that are not estimates are the 143 venues, the 61 exhibitions and the
infrastructure costs. That happens to be exactly the part the business case rests on.

## Appendix B — Running the model

```bash
python3 business/model.py          # every table in this document
python3 business/model.py --csv    # monthly figures to business/output/*.csv
```

Assumptions are constants at the top of `business/model.py`. If you do not believe one, change it,
re-run, and see immediately what it does to the break-even month and the cash trough. That is how
this document is meant to be used: not as a prediction, but as an answer to "what has to be true
for this to work?"
