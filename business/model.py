#!/usr/bin/env python3
"""ART EYE — driver-based financial model (36 months, 3 scenarios).

All figures in AUD, excluding GST. Run with:

    python3 business/model.py            # print every table
    python3 business/model.py --csv      # write business/output/*.csv

The model is deliberately flat and readable: every assumption is a constant at
the top, every month is worked out explicitly. If you disagree with an
assumption, change the constant and re-run — the analysis in
`financial-analysis.md` quotes exactly these numbers.

Month 1 = September 2026 (start of the commercial phase).
Year 1 = M1-M12 (Sep 2026 - Aug 2027), Year 2 = M13-M24, Year 3 = M25-M36.

Founding principle in this version: **the business starts with no staff.**
Nobody is paid — not even the founder — until the revenue is there. See
HIRING_GATES.
"""

from __future__ import annotations

import argparse
import csv
import os
from dataclasses import dataclass

# ---------------------------------------------------------------------------
# Price card (AUD/month, ex GST; an annual contract = 10x the monthly price)
# ---------------------------------------------------------------------------
PRICE_STUDIO = 49.0        # small commercial gallery, one space
PRICE_PRO = 149.0          # established gallery, several shows/spaces
PRICE_INSTITUTION = 499.0  # museum / institution / art fair organiser

ANNUAL_PREPAY_SHARE = 0.35   # share of venues paying a year up front
ANNUAL_DISCOUNT = 2 / 12     # two months free on an annual contract

CURATOR_PLUS_YEAR = 39.0     # consumer subscription per year
STORE_FEE = 0.15             # Apple/Google small business programme
STRIPE_FEE = 0.019           # card fees on web and B2B invoices

# ---------------------------------------------------------------------------
# Market capacity (supply side)
# ---------------------------------------------------------------------------
# Sydney: 143 verified venues in the register (104 galleries, 23 museums,
# 16 ARIs). ARIs run on grants and volunteers and realistically pay nothing;
# so does a share of the smallest commercial galleries. Payable addressable
# market: ~110. Melbourne opens in month 19, the rest of Australia in month 31
# — without a second city the venue revenue hits a ceiling.
ADDRESSABLE = [(1, 110), (19, 235), (31, 325)]

# ---------------------------------------------------------------------------
# Staffing — the business starts with nobody on the payroll
# ---------------------------------------------------------------------------
# No role, including the founder's own draw, costs anything until monthly
# revenue clears its threshold. Year 1 is deliberately a zero-payroll year:
# the founder works unpaid, and the first money out of the business is the
# founder's own draw at A$4,000/month of revenue — not a hire.
#
# This is the single most powerful lever in the model. See the sensitivity run.
HIRING_GATES = [
    # (monthly revenue threshold, monthly cost incl. on-costs, role)
    (4_000, 1_500, "founder's draw — the first money the business pays out"),
    (8_000, 1_600, "editorial/community freelance, ~0.3 FTE"),
    (12_000, 2_000, "founder's draw up to A$3,500"),
    (16_000, 3_500, "contract developer, 0.5 FTE"),
    (22_000, 7_500, "partnerships & sales, 1 FTE"),
    (30_000, 2_500, "Melbourne city editor, ~0.4 FTE"),
    (38_000, 2_500, "founder's draw up to A$6,000"),
    (48_000, 5_500, "support & operations, 1 FTE"),
    (62_000, 8_000, "second developer, 1 FTE"),
]


# ---------------------------------------------------------------------------
# Scenario definitions
# ---------------------------------------------------------------------------


@dataclass
class Scenario:
    name: str
    # venue acquisition: gross new paying venues per month, per year
    # (damped as the city fills up — see ADDRESSABLE)
    adds_studio: tuple[float, float, float]
    adds_pro: tuple[float, float, float]
    adds_institution: tuple[float, float, float]
    churn_monthly: tuple[float, float, float]
    # audience: MAU at the end of year 1/2/3
    mau_end: tuple[int, int, int]
    paid_conversion: tuple[float, float, float]   # share of MAU on Curator+
    # media / campaigns
    campaigns_per_month: tuple[float, float, float]
    campaign_price: tuple[float, float, float]
    fair_packages_per_year: tuple[int, int, int]
    fair_price: tuple[float, float, float]
    # ticket affiliate
    booker_share: tuple[float, float, float]      # share of MAU booking per month
    basket: float = 28.0
    commission: float = 0.08
    # data & insights (year 3)
    insight_subs: tuple[int, int, int] = (0, 0, 6)
    insight_price: float = 2500.0
    insight_sponsor: tuple[float, float, float] = (0.0, 0.0, 15000.0)
    # costs
    marketing: tuple[float, float, float] = (0.0, 0.0, 0.0)  # monthly floor
    marketing_pct: float = 0.12          # or this share of revenue, whichever is higher
    infra: tuple[float, float, float] = (0.0, 0.0, 0.0)      # on top of MAU scaling
    overhead: tuple[float, float, float] = (0.0, 0.0, 0.0)
    payroll_factor: float = 1.0          # discipline against the hiring gates


# Fixed cost floor. Staff is not in here: that follows the revenue thresholds.
BASE_MARKETING = (700.0, 1_800.0, 3_500.0)
BASE_INFRA = (140.0, 220.0, 400.0)       # AI pipeline, email, stores, domain
BASE_OVERHEAD = (420.0, 950.0, 1_800.0)  # accounting, insurance, legal

BASE = Scenario(
    name="Base",
    adds_studio=(4.2, 5.0, 4.0),
    adds_pro=(1.1, 2.0, 2.2),
    adds_institution=(0.05, 0.35, 0.6),
    churn_monthly=(0.030, 0.022, 0.018),
    mau_end=(4_000, 12_000, 24_000),
    paid_conversion=(0.020, 0.030, 0.035),
    campaigns_per_month=(0.5, 3.0, 5.0),
    campaign_price=(800.0, 1_000.0, 1_200.0),
    fair_packages_per_year=(0, 3, 5),
    fair_price=(0.0, 8_000.0, 12_000.0),
    booker_share=(0.0, 0.008, 0.012),
    marketing=BASE_MARKETING,
    infra=BASE_INFRA,
    overhead=BASE_OVERHEAD,
)

CONSERVATIVE = Scenario(
    name="Conservative",
    adds_studio=(2.5, 3.0, 2.5),
    adds_pro=(0.6, 1.1, 1.2),
    adds_institution=(0.0, 0.15, 0.3),
    churn_monthly=(0.042, 0.032, 0.026),
    mau_end=(2_200, 6_000, 11_000),
    paid_conversion=(0.014, 0.020, 0.024),
    campaigns_per_month=(0.2, 1.2, 2.2),
    campaign_price=(650.0, 800.0, 950.0),
    fair_packages_per_year=(0, 1, 2),
    fair_price=(0.0, 6_000.0, 9_000.0),
    booker_share=(0.0, 0.005, 0.008),
    insight_subs=(0, 0, 2),
    insight_sponsor=(0.0, 0.0, 0.0),
    marketing=(450.0, 1_200.0, 2_200.0),
    marketing_pct=0.10,
    infra=(120.0, 180.0, 300.0),
    overhead=(380.0, 800.0, 1_400.0),
)

OPTIMISTIC = Scenario(
    name="Optimistic",
    adds_studio=(6.0, 7.5, 6.5),
    adds_pro=(1.8, 3.2, 3.6),
    adds_institution=(0.15, 0.6, 1.0),
    churn_monthly=(0.024, 0.017, 0.014),
    mau_end=(6_500, 20_000, 42_000),
    paid_conversion=(0.026, 0.038, 0.045),
    campaigns_per_month=(1.0, 4.5, 8.0),
    campaign_price=(900.0, 1_200.0, 1_500.0),
    fair_packages_per_year=(1, 5, 8),
    fair_price=(6_000.0, 10_000.0, 14_000.0),
    booker_share=(0.002, 0.012, 0.018),
    insight_subs=(0, 2, 12),
    insight_sponsor=(0.0, 8_000.0, 30_000.0),
    marketing=(1_000.0, 3_000.0, 6_000.0),
    marketing_pct=0.14,
    infra=(170.0, 350.0, 700.0),
    overhead=(480.0, 1_200.0, 2_400.0),
)


def year_of(month: int) -> int:
    """M1-M12 -> 0, M13-M24 -> 1, M25-M36 -> 2."""
    return (month - 1) // 12


def mau_curve(sc: Scenario, month: int) -> float:
    """S-shaped growth inside each year, landing on that year's end point."""
    y = year_of(month)
    start = 400.0 if y == 0 else sc.mau_end[y - 1]
    end = sc.mau_end[y]
    t = ((month - 1) % 12 + 1) / 12
    ease = t * t * (3 - 2 * t)   # smooth ease-in-out, so growth is not blocky
    return start + (end - start) * ease


def addressable(month: int) -> int:
    cap = ADDRESSABLE[0][1]
    for start, value in ADDRESSABLE:
        if month >= start:
            cap = value
    return cap


def payroll_for(revenue: float) -> tuple[float, list[str]]:
    """People cost, from the revenue thresholds. Below the first gate: zero."""
    total = 0.0
    roles: list[str] = []
    for threshold, cost, role in HIRING_GATES:
        if revenue >= threshold:
            total += cost
            roles.append(role)
    return total, roles


def run(sc: Scenario) -> list[dict]:
    rows: list[dict] = []
    studio = pro = inst = 0.0
    cash = 0.0
    rev_prev = 0.0

    for m in range(1, 37):
        y = year_of(m)
        churn = sc.churn_monthly[y]

        # --- venue base ----------------------------------------------------
        # acquisition slows as the addressable market fills up
        saturation = max(0.0, 1 - (studio + pro + inst) / addressable(m))
        studio = studio * (1 - churn) + sc.adds_studio[y] * saturation
        pro = pro * (1 - churn) + sc.adds_pro[y] * saturation
        inst = inst * (1 - churn * 0.5) + sc.adds_institution[y] * saturation
        venues = studio + pro + inst

        gross_sub = studio * PRICE_STUDIO + pro * PRICE_PRO + inst * PRICE_INSTITUTION
        # annual contracts give away two months
        mrr_venues = gross_sub * (1 - ANNUAL_PREPAY_SHARE * ANNUAL_DISCOUNT)

        # --- audience ------------------------------------------------------
        mau = mau_curve(sc, m)
        payers = mau * sc.paid_conversion[y]
        # half through the app store (15% fee), half through the web (Stripe)
        rev_consumer = payers * (CURATOR_PLUS_YEAR / 12) * (
            0.5 * (1 - STORE_FEE) + 0.5 * (1 - STRIPE_FEE)
        )

        # --- media / campaigns ---------------------------------------------
        ramp = min(1.0, max(0.0, ((m - 1) % 12 + 1) / 9)) if y == 0 else 1.0
        rev_media = sc.campaigns_per_month[y] * sc.campaign_price[y] * ramp
        rev_fairs = sc.fair_packages_per_year[y] * sc.fair_price[y] / 12

        # --- ticket affiliate ------------------------------------------------
        rev_tickets = mau * sc.booker_share[y] * sc.basket * sc.commission

        # --- data & insights -------------------------------------------------
        rev_data = (sc.insight_subs[y] * sc.insight_price + sc.insight_sponsor[y]) / 12

        revenue = mrr_venues + rev_consumer + rev_media + rev_fairs + rev_tickets + rev_data

        # --- costs -----------------------------------------------------------
        # people follow last month's revenue through the gates; nobody, the
        # founder included, is paid until the first gate is cleared
        payroll, roles = payroll_for(rev_prev)
        payroll *= sc.payroll_factor
        # marketing: a fixed floor, but at least a set share of revenue
        marketing = max(sc.marketing[y], revenue * sc.marketing_pct)
        # infrastructure scales with the audience (Supabase, storage, bandwidth)
        # plus the fixed AI pipeline (validate/discover/enrich-images)
        infra = 60.0 + mau * 0.012 + sc.infra[y]
        overhead = sc.overhead[y]
        fees = (mrr_venues + rev_media + rev_fairs) * STRIPE_FEE
        costs = payroll + marketing + infra + overhead + fees
        rev_prev = revenue

        ebitda = revenue - costs
        cash += ebitda

        rows.append(
            dict(
                month=m,
                year=y + 1,
                venues=venues,
                studio=studio,
                pro=pro,
                inst=inst,
                mau=mau,
                payers=payers,
                mrr_venues=mrr_venues,
                rev_consumer=rev_consumer,
                rev_media=rev_media + rev_fairs,
                rev_tickets=rev_tickets,
                rev_data=rev_data,
                revenue=revenue,
                headcount_cost=payroll,
                roles=len(roles),
                marketing=marketing,
                infra=infra,
                overhead=overhead,
                fees=fees,
                costs=costs,
                ebitda=ebitda,
                cash=cash,
            )
        )
    return rows


def annual(rows: list[dict]) -> list[dict]:
    out = []
    for y in (1, 2, 3):
        yr = [r for r in rows if r["year"] == y]
        last = yr[-1]
        out.append(
            dict(
                year=y,
                venues_end=last["venues"],
                mau_end=last["mau"],
                payers_end=last["payers"],
                arr_exit=last["mrr_venues"] * 12,
                rev_venues=sum(r["mrr_venues"] for r in yr),
                rev_consumer=sum(r["rev_consumer"] for r in yr),
                rev_media=sum(r["rev_media"] for r in yr),
                rev_tickets=sum(r["rev_tickets"] for r in yr),
                rev_data=sum(r["rev_data"] for r in yr),
                revenue=sum(r["revenue"] for r in yr),
                headcount_cost=sum(r["headcount_cost"] for r in yr),
                marketing=sum(r["marketing"] for r in yr),
                infra=sum(r["infra"] for r in yr),
                overhead=sum(r["overhead"] for r in yr),
                fees=sum(r["fees"] for r in yr),
                costs=sum(r["costs"] for r in yr),
                ebitda=sum(r["ebitda"] for r in yr),
                cash_end=last["cash"],
            )
        )
    return out


def unit_economics(sc: Scenario, y: int = 0) -> dict:
    """Blended venue economics for year y (0-based)."""
    adds = sc.adds_studio[y] + sc.adds_pro[y] + sc.adds_institution[y]
    mix_rev = (
        sc.adds_studio[y] * PRICE_STUDIO
        + sc.adds_pro[y] * PRICE_PRO
        + sc.adds_institution[y] * PRICE_INSTITUTION
    )
    arpa = mix_rev / adds * (1 - ANNUAL_PREPAY_SHARE * ANNUAL_DISCOUNT)
    gross_margin = 0.90
    churn = sc.churn_monthly[y]
    # CAC: the acquisition share of marketing (events, openings, print) plus the
    # founder's selling time, costed at A$1,500/month even in the unpaid year —
    # it is a real cost of acquisition whether or not cash leaves the account
    sales_cost_month = sc.marketing[y] * 0.45 + 1_500.0
    cac = sales_cost_month / adds
    ltv = arpa * gross_margin / churn
    return dict(
        arpa=arpa,
        churn=churn,
        lifetime_months=1 / churn,
        cac=cac,
        ltv=ltv,
        ratio=ltv / cac if cac else float("inf"),
        payback=cac / (arpa * gross_margin) if arpa else float("inf"),
    )


def breakeven_month(rows: list[dict]) -> int | None:
    for r in rows:
        if r["ebitda"] > 0:
            idx = r["month"]                      # only once it holds for 3 months
            window = [x for x in rows if idx <= x["month"] < idx + 3]
            if len(window) == 3 and all(x["ebitda"] > 0 for x in window):
                return idx
    return None


def peak_funding(rows: list[dict]) -> tuple[float, int]:
    trough = min(rows, key=lambda r: r["cash"])
    return trough["cash"], trough["month"]


def first_hire(rows: list[dict]) -> int | None:
    for r in rows:
        if r["headcount_cost"] > 0:
            return r["month"]
    return None


def a(x: float) -> str:
    return f"A${x:,.0f}"


def report(scenarios: list[Scenario]) -> None:
    for sc in scenarios:
        rows = run(sc)
        yrs = annual(rows)
        print(f"\n{'=' * 78}\nSCENARIO: {sc.name}\n{'=' * 78}")
        print(f"{'':24}{'Year 1':>16}{'Year 2':>16}{'Year 3':>16}")

        def line(label, key, fmt=a):
            print(f"{label:24}" + "".join(f"{fmt(y[key]):>16}" for y in yrs))

        line("Venues (end)", "venues_end", lambda v: f"{v:,.0f}")
        line("MAU (end)", "mau_end", lambda v: f"{v:,.0f}")
        line("Curator+ (end)", "payers_end", lambda v: f"{v:,.0f}")
        print("-" * 72)
        line("Venue subscriptions", "rev_venues")
        line("Media & fairs", "rev_media")
        line("Curator+", "rev_consumer")
        line("Ticket affiliate", "rev_tickets")
        line("Data & insights", "rev_data")
        line("REVENUE", "revenue")
        print("-" * 72)
        line("People", "headcount_cost")
        line("Marketing", "marketing")
        line("Infrastructure", "infra")
        line("Overhead", "overhead")
        line("Transaction fees", "fees")
        line("COSTS", "costs")
        print("-" * 72)
        line("EBITDA", "ebitda")
        line("Cash (cumulative)", "cash_end")
        line("Exit ARR (venues)", "arr_exit")
        be = breakeven_month(rows)
        trough, tmonth = peak_funding(rows)
        fh = first_hire(rows)
        print(
            f"\nBreak-even (EBITDA, holding 3 months): "
            f"{'month ' + str(be) if be else 'not within 36 months'}"
        )
        print(f"Deepest cash point: {a(trough)} in month {tmonth}")
        print(
            f"First money paid to a person: "
            f"{'month ' + str(fh) if fh else 'never within 36 months'}"
        )
        ue = unit_economics(sc, 0)
        print(
            f"Unit economics year 1 - ARPA {a(ue['arpa'])}/mo, churn "
            f"{ue['churn'] * 100:.1f}%/mo ({ue['lifetime_months']:.0f} mo), "
            f"CAC {a(ue['cac'])}, LTV {a(ue['ltv'])}, LTV/CAC {ue['ratio']:.1f}x, "
            f"payback {ue['payback']:.1f} mo"
        )


def quarters(rows: list[dict], year: int = 1) -> None:
    """Quarterly detail. Year 1 is the only period where the monthly numbers
    really steer anything (cash trough, first paying venues)."""
    yr = [r for r in rows if r["year"] == year]
    print(f"\nQuarterly detail, year {year}")
    print(f"{'':20}{'Q1':>13}{'Q2':>13}{'Q3':>13}{'Q4':>13}")

    def qsum(key):
        return [sum(r[key] for r in yr[i * 3:(i + 1) * 3]) for i in range(4)]

    def qend(key):
        return [yr[i * 3 + 2][key] for i in range(4)]

    for label, vals in [
        ("Venues (end)", [f"{v:,.0f}" for v in qend("venues")]),
        ("Venue MRR (end)", [a(v) for v in qend("mrr_venues")]),
        ("Revenue", [a(v) for v in qsum("revenue")]),
        ("Costs", [a(v) for v in qsum("costs")]),
        ("EBITDA", [a(v) for v in qsum("ebitda")]),
        ("Cash (end)", [a(v) for v in qend("cash")]),
    ]:
        print(f"{label:20}" + "".join(f"{v:>13}" for v in vals))


def sensitivity() -> None:
    """What actually moves the outcome? One variable at a time, off the base."""
    import copy

    def outcome(sc: Scenario) -> str:
        rows = run(sc)
        yrs = annual(rows)
        be = breakeven_month(rows)
        trough, _ = peak_funding(rows)
        return (
            f"{a(yrs[2]['revenue']):>13}{a(yrs[2]['ebitda']):>13}"
            f"{(str(be) if be else '>36'):>10}{a(trough):>12}"
        )

    print(f"\n{'=' * 78}\nSENSITIVITY (one variable at a time, off the base)\n{'=' * 78}")
    print(f"{'Variant':32}{'Revenue yr3':>13}{'EBITDA yr3':>13}{'B/E mo':>10}{'Cash low':>12}")
    print(f"{'Base':32}" + outcome(BASE))

    for delta, label in [(0.01, "+1pp"), (-0.01, "-1pp")]:
        sc = copy.deepcopy(BASE)
        sc.churn_monthly = tuple(max(0.005, c + delta) for c in BASE.churn_monthly)
        print(f"{'Churn ' + label + ' per month':32}" + outcome(sc))

    for factor, label in [(1.3, "+30%"), (0.7, "-30%")]:
        sc = copy.deepcopy(BASE)
        sc.adds_studio = tuple(v * factor for v in BASE.adds_studio)
        sc.adds_pro = tuple(v * factor for v in BASE.adds_pro)
        print(f"{'Venue acquisition ' + label:32}" + outcome(sc))

    for factor, label in [(1.25, "+25%"), (0.8, "-20%")]:
        sc = copy.deepcopy(BASE)
        sc.payroll_factor = factor
        print(f"{'People cost ' + label:32}" + outcome(sc))

    for factor, label in [(0.5, "halved"), (2.0, "doubled")]:
        sc = copy.deepcopy(BASE)
        sc.campaigns_per_month = tuple(v * factor for v in BASE.campaigns_per_month)
        sc.fair_packages_per_year = tuple(
            int(round(v * factor)) for v in BASE.fair_packages_per_year
        )
        print(f"{'Media revenue ' + label:32}" + outcome(sc))

    sc = copy.deepcopy(BASE)
    sc.paid_conversion = tuple(v * 2 for v in BASE.paid_conversion)
    print(f"{'Curator+ conversion x2':32}" + outcome(sc))

    print(
        "\nRead it this way: people cost and media revenue decide the result, not "
        "app-store income. Churn looks mild here only because the model refills a "
        "lapsed venue from the addressable pool; in reality that re-acquisition "
        "costs selling time the model does not charge for, and the pool runs out. "
        "Treat the churn row as a floor, not as reassurance."
    )


def price_grid() -> None:
    """Price sensitivity of the Studio tier (the volume product)."""
    global PRICE_STUDIO
    original = PRICE_STUDIO
    print(f"\n{'=' * 78}\nSTUDIO TIER PRICE POINT\n{'=' * 78}")
    print(f"{'Price':10}{'Assumed churn':>16}{'Venues yr3':>13}{'Revenue yr3':>14}{'EBITDA yr3':>13}")
    import copy

    for price, churn_shift in [(29, -0.006), (39, -0.003), (49, 0.0), (69, 0.006), (89, 0.013)]:
        PRICE_STUDIO = float(price)
        sc = copy.deepcopy(BASE)
        sc.churn_monthly = tuple(max(0.008, c + churn_shift) for c in BASE.churn_monthly)
        drag = 1.0 - (price - 49) / 49 * 0.35   # a higher price also slows acquisition
        sc.adds_studio = tuple(v * drag for v in BASE.adds_studio)
        rows = run(sc)
        yrs = annual(rows)
        print(
            f"A${price:<8}{sc.churn_monthly[2] * 100:>15.1f}%"
            f"{yrs[2]['venues_end']:>13,.0f}{a(yrs[2]['revenue']):>14}{a(yrs[2]['ebitda']):>13}"
        )
    PRICE_STUDIO = original


def write_csv(scenarios: list[Scenario], outdir: str) -> None:
    os.makedirs(outdir, exist_ok=True)
    for sc in scenarios:
        rows = run(sc)
        path = os.path.join(outdir, f"monthly-{sc.name.lower()}.csv")
        with open(path, "w", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
            w.writeheader()
            for r in rows:
                w.writerow(
                    {k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items()}
                )
        print(f"written: {path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", action="store_true", help="write CSVs to business/output/")
    args = ap.parse_args()
    scenarios = [CONSERVATIVE, BASE, OPTIMISTIC]
    report(scenarios)
    quarters(run(BASE))
    sensitivity()
    price_grid()
    if args.csv:
        here = os.path.dirname(os.path.abspath(__file__))
        write_csv(scenarios, os.path.join(here, "output"))
