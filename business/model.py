#!/usr/bin/env python3
"""ART EYE — driver-based financieel model (36 maanden, 3 scenario's).

Alle bedragen in AUD, exclusief GST. Draaien met:

    python3 business/model.py            # print alle tabellen
    python3 business/model.py --csv      # schrijft business/output/*.csv

Het model is bewust plat en leesbaar: elke aanname staat als constante
bovenaan, elke maand wordt expliciet doorgerekend. Wie een aanname niet
gelooft, past de constante aan en draait opnieuw — de analyse in
`financiele-analyse.md` verwijst naar exact deze getallen.

Maand 1 = september 2026 (start commerciele fase).
Jaar 1 = M1-M12 (sep 2026 - aug 2027), Jaar 2 = M13-M24, Jaar 3 = M25-M36.
"""

from __future__ import annotations

import argparse
import csv
import os
from dataclasses import dataclass, field

# ---------------------------------------------------------------------------
# Prijskaart (AUD/maand, excl. GST; jaarcontract = 10x maandprijs)
# ---------------------------------------------------------------------------
PRICE_STUDIO = 49.0        # kleine commerciele galerie, 1 ruimte
PRICE_PRO = 149.0          # gevestigde galerie, meerdere shows/ruimtes
PRICE_INSTITUTION = 499.0  # museum / kunstinstelling / kunstbeurs-organisator

ANNUAL_PREPAY_SHARE = 0.35   # aandeel dat jaarlijks vooruitbetaalt
ANNUAL_DISCOUNT = 2 / 12     # 2 maanden gratis bij jaarcontract

CURATOR_PLUS_YEAR = 39.0     # consumentenabonnement per jaar
STORE_FEE = 0.15             # Apple/Google small business program
STRIPE_FEE = 0.019           # kaartkosten op web/B2B-facturen

# ---------------------------------------------------------------------------
# Marktcapaciteit (aanbodzijde)
# ---------------------------------------------------------------------------
# Sydney: 143 geverifieerde venues in het register (104 galeries, 23 musea,
# 16 ARIs). ARIs draaien op subsidie en vrijwilligers en betalen realistisch
# niets; van de kleinste commerciele galeries valt een deel af. Betalend
# adresseerbaar: ~110. Melbourne opent in maand 19, de rest van Australie in
# maand 31 - zonder tweede stad loopt de venue-omzet tegen een plafond.
ADDRESSABLE = [(1, 110), (19, 235), (31, 325)]

# Personeel wordt niet op een tijdlijn aangenomen maar op ARR-drempels: elke
# rol gaat pas open als de terugkerende omzet hem draagt. Dit is de belangrijkste
# stuurknop van het hele model - zie de gevoeligheidsanalyse.
HIRING_GATES = [
    # (MRR-drempel, maandlast incl. werkgeverslasten, rol)
    (0, 1_500, "oprichter (bescheiden vergoeding, vanaf mnd 4)"),
    (5_000, 2_200, "redactie/community 0,4 fte"),
    (9_000, 2_000, "oprichter naar 3.500/mnd"),
    (13_000, 3_500, "developer op contract 0,5 fte"),
    (18_000, 7_500, "partnerships & sales 1 fte"),
    (26_000, 2_500, "stadsredacteur Melbourne 0,4 fte"),
    (34_000, 2_500, "oprichter naar 6.000/mnd"),
    (42_000, 5_500, "support & operations 1 fte"),
    (55_000, 8_000, "tweede developer 1 fte"),
]


# ---------------------------------------------------------------------------
# Scenario-definities
# ---------------------------------------------------------------------------


@dataclass
class Scenario:
    name: str
    # venue-acquisitie: bruto nieuwe betalende venues per maand, per jaar
    # (wordt afgeremd naarmate de stad vol raakt - zie ADDRESSABLE)
    adds_studio: tuple[float, float, float]
    adds_pro: tuple[float, float, float]
    adds_institution: tuple[float, float, float]
    churn_monthly: tuple[float, float, float]
    # publiek: MAU aan het eind van jaar 1/2/3
    mau_end: tuple[int, int, int]
    paid_conversion: tuple[float, float, float]   # % MAU met Curator+
    # media/campagnes
    campaigns_per_month: tuple[float, float, float]
    campaign_price: tuple[float, float, float]
    fair_packages_per_year: tuple[int, int, int]
    fair_price: tuple[float, float, float]
    # ticket-affiliate
    booker_share: tuple[float, float, float]      # % MAU dat per maand boekt
    basket: float = 28.0
    commission: float = 0.08
    # data & insights (jaar 3)
    insight_subs: tuple[int, int, int] = (0, 0, 6)
    insight_price: float = 2500.0
    insight_sponsor: tuple[float, float, float] = (0.0, 0.0, 15000.0)
    # kosten
    marketing: tuple[float, float, float] = (0.0, 0.0, 0.0)  # bodembedrag/maand
    marketing_pct: float = 0.12          # of dit % van de omzet, wat hoger is
    infra: tuple[float, float, float] = (0.0, 0.0, 0.0)      # bovenop MAU-schaling
    overhead: tuple[float, float, float] = (0.0, 0.0, 0.0)
    payroll_factor: float = 1.0          # discipline op de aannamedrempels


# Vaste kostenbodem. Personeel zit hier niet in: dat volgt de ARR-drempels.
BASE_MARKETING = (700.0, 1_800.0, 3_500.0)
BASE_INFRA = (140.0, 220.0, 400.0)   # AI-pipeline, e-mail, stores, domein
BASE_OVERHEAD = (420.0, 950.0, 1_800.0)  # boekhouding, verzekering, juridisch

BASE = Scenario(
    name="Basis",
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
    name="Conservatief",
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
    name="Optimistisch",
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
    """S-vormige groei binnen elk jaar, aansluitend op het eindpunt per jaar."""
    y = year_of(month)
    start = 400.0 if y == 0 else sc.mau_end[y - 1]
    end = sc.mau_end[y]
    t = ((month - 1) % 12 + 1) / 12
    # gladde ease-in-out zodat groei niet lineair-blokkerig oogt
    ease = t * t * (3 - 2 * t)
    return start + (end - start) * ease


def addressable(month: int) -> int:
    cap = ADDRESSABLE[0][1]
    for start, value in ADDRESSABLE:
        if month >= start:
            cap = value
    return cap


def payroll_for(mrr: float) -> tuple[float, list[str]]:
    """Personeelslast op basis van bereikte ARR-drempels."""
    total = 0.0
    roles: list[str] = []
    for threshold, cost, role in HIRING_GATES:
        if mrr >= threshold:
            total += cost
            roles.append(role)
    return total, roles


def run(sc: Scenario) -> list[dict]:
    rows: list[dict] = []
    studio = pro = inst = 0.0
    cash = 0.0
    mrr_prev = 0.0

    for m in range(1, 37):
        y = year_of(m)
        churn = sc.churn_monthly[y]

        # --- venue-basis ---------------------------------------------------
        # acquisitie remt af naarmate de adresseerbare markt vol raakt
        saturation = max(0.0, 1 - (studio + pro + inst) / addressable(m))
        studio = studio * (1 - churn) + sc.adds_studio[y] * saturation
        pro = pro * (1 - churn) + sc.adds_pro[y] * saturation
        inst = inst * (1 - churn * 0.5) + sc.adds_institution[y] * saturation
        venues = studio + pro + inst

        gross_sub = studio * PRICE_STUDIO + pro * PRICE_PRO + inst * PRICE_INSTITUTION
        # jaarcontracten leveren 2 maanden korting in
        mrr_venues = gross_sub * (1 - ANNUAL_PREPAY_SHARE * ANNUAL_DISCOUNT)

        # --- publiek -------------------------------------------------------
        mau = mau_curve(sc, m)
        payers = mau * sc.paid_conversion[y]
        # helft via app store (15% fee), helft via web (Stripe)
        rev_consumer = payers * (CURATOR_PLUS_YEAR / 12) * (
            0.5 * (1 - STORE_FEE) + 0.5 * (1 - STRIPE_FEE)
        )

        # --- media / campagnes ---------------------------------------------
        ramp = min(1.0, max(0.0, ((m - 1) % 12 + 1) / 9)) if y == 0 else 1.0
        rev_media = sc.campaigns_per_month[y] * sc.campaign_price[y] * ramp
        rev_fairs = sc.fair_packages_per_year[y] * sc.fair_price[y] / 12

        # --- ticket-affiliate ----------------------------------------------
        rev_tickets = mau * sc.booker_share[y] * sc.basket * sc.commission

        # --- data & insights -------------------------------------------------
        rev_data = (sc.insight_subs[y] * sc.insight_price + sc.insight_sponsor[y]) / 12

        revenue = mrr_venues + rev_consumer + rev_media + rev_fairs + rev_tickets + rev_data

        # --- kosten ----------------------------------------------------------
        # personeel volgt de ARR-drempels op de MRR van vorige maand; de eerste
        # drie maanden draait de oprichter onbetaald
        payroll, roles = payroll_for(mrr_prev)
        if m < 4:
            payroll = 0.0
            roles = []
        payroll *= sc.payroll_factor
        # marketing: vaste bodem, maar minstens een vast % van de omzet
        marketing = max(sc.marketing[y], revenue * sc.marketing_pct)
        # infrastructuur schaalt met publiek (Supabase, opslag, bandbreedte)
        # plus de vaste AI-pipeline (validate/discover/enrich-images)
        infra = 60.0 + mau * 0.012 + sc.infra[y]
        overhead = sc.overhead[y]
        fees = (mrr_venues + rev_media + rev_fairs) * STRIPE_FEE
        costs = payroll + marketing + infra + overhead + fees
        mrr_prev = revenue

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
                payroll=payroll,
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
                payroll=sum(r["payroll"] for r in yr),
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
    """Blended venue-economics voor jaar y (0-based)."""
    adds = sc.adds_studio[y] + sc.adds_pro[y] + sc.adds_institution[y]
    mix_rev = (
        sc.adds_studio[y] * PRICE_STUDIO
        + sc.adds_pro[y] * PRICE_PRO
        + sc.adds_institution[y] * PRICE_INSTITUTION
    )
    arpa = mix_rev / adds * (1 - ANNUAL_PREPAY_SHARE * ANNUAL_DISCOUNT)
    gross_margin = 0.90
    churn = sc.churn_monthly[y]
    # CAC: acquisitiedeel van marketing (events, openingen, drukwerk) plus de
    # verkooptijd van de oprichter, gewaardeerd tegen A$1.500/maand
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
            # pas als het 3 maanden achtereen positief blijft
            idx = r["month"]
            window = [x for x in rows if idx <= x["month"] < idx + 3]
            if len(window) == 3 and all(x["ebitda"] > 0 for x in window):
                return idx
    return None


def peak_funding(rows: list[dict]) -> tuple[float, int]:
    trough = min(rows, key=lambda r: r["cash"])
    return trough["cash"], trough["month"]


def a(x: float) -> str:
    return f"A${x:,.0f}"


def report(scenarios: list[Scenario]) -> None:
    for sc in scenarios:
        rows = run(sc)
        yrs = annual(rows)
        print(f"\n{'=' * 78}\nSCENARIO: {sc.name}\n{'=' * 78}")
        hdr = f"{'':22}{'Jaar 1':>16}{'Jaar 2':>16}{'Jaar 3':>16}"
        print(hdr)
        def line(label, key, fmt=a):
            print(f"{label:22}" + "".join(f"{fmt(y[key]):>16}" for y in yrs))
        line("Venues (eind)", "venues_end", lambda v: f"{v:,.0f}")
        line("MAU (eind)", "mau_end", lambda v: f"{v:,.0f}")
        line("Curator+ (eind)", "payers_end", lambda v: f"{v:,.0f}")
        print("-" * 70)
        line("Venue-abonnementen", "rev_venues")
        line("Curator+", "rev_consumer")
        line("Media & beurzen", "rev_media")
        line("Ticket-affiliate", "rev_tickets")
        line("Data & insights", "rev_data")
        line("OMZET", "revenue")
        print("-" * 70)
        line("Personeel", "payroll")
        line("Marketing", "marketing")
        line("Infrastructuur", "infra")
        line("Overhead", "overhead")
        line("Transactiekosten", "fees")
        line("KOSTEN", "costs")
        print("-" * 70)
        line("EBITDA", "ebitda")
        line("Cash (cumulatief)", "cash_end")
        line("ARR exit (venues)", "arr_exit")
        be = breakeven_month(rows)
        trough, tmonth = peak_funding(rows)
        print(
            f"\nBreak-even (EBITDA, 3 mnd standhoudend): "
            f"{'maand ' + str(be) if be else 'niet binnen 36 mnd'}"
        )
        print(f"Diepste cashpunt: {a(trough)} in maand {tmonth}")
        ue = unit_economics(sc, 0)
        print(
            f"Unit economics jaar 1 - ARPA {a(ue['arpa'])}/mnd, churn "
            f"{ue['churn'] * 100:.1f}%/mnd ({ue['lifetime_months']:.0f} mnd), "
            f"CAC {a(ue['cac'])}, LTV {a(ue['ltv'])}, LTV/CAC {ue['ratio']:.1f}x, "
            f"terugverdientijd {ue['payback']:.1f} mnd"
        )


def quarters(rows: list[dict], year: int = 1) -> None:
    """Kwartaaldetail voor een jaar - jaar 1 is de enige periode waarin de
    maandcijfers echt sturend zijn (cashbodem, eerste betalende venues)."""
    yr = [r for r in rows if r["year"] == year]
    print(f"\nKwartaaldetail jaar {year}")
    print(f"{'':18}{'K1':>13}{'K2':>13}{'K3':>13}{'K4':>13}")
    def qsum(key):
        return [sum(r[key] for r in yr[i * 3:(i + 1) * 3]) for i in range(4)]
    def qend(key):
        return [yr[i * 3 + 2][key] for i in range(4)]
    for label, vals in [
        ("Venues (eind)", [f"{v:,.0f}" for v in qend("venues")]),
        ("MRR (eind)", [a(v) for v in qend("mrr_venues")]),
        ("Omzet", [a(v) for v in qsum("revenue")]),
        ("Kosten", [a(v) for v in qsum("costs")]),
        ("EBITDA", [a(v) for v in qsum("ebitda")]),
        ("Cash (eind)", [a(v) for v in qend("cash")]),
    ]:
        print(f"{label:18}" + "".join(f"{v:>13}" for v in vals))


def sensitivity() -> None:
    """Wat maakt het verschil? Een variabele tegelijk, vanaf het basisscenario."""
    import copy

    def outcome(sc: Scenario) -> str:
        rows = run(sc)
        yrs = annual(rows)
        be = breakeven_month(rows)
        trough, _ = peak_funding(rows)
        return (
            f"{a(yrs[2]['revenue']):>12}{a(yrs[2]['ebitda']):>12}"
            f"{(str(be) if be else '>36'):>10}{a(trough):>12}"
        )

    print(f"\n{'=' * 78}\nGEVOELIGHEID (een variabele tegelijk, vanaf basis)\n{'=' * 78}")
    print(f"{'Variant':34}{'Omzet jr3':>12}{'EBITDA jr3':>12}{'B/E mnd':>10}{'Cashbodem':>12}")
    print(f"{'Basis':34}" + outcome(BASE))

    for delta, label in [(0.01, "+1pp"), (-0.01, "-1pp")]:
        sc = copy.deepcopy(BASE)
        sc.churn_monthly = tuple(max(0.005, c + delta) for c in BASE.churn_monthly)
        print(f"{'Churn ' + label + ' per maand':34}" + outcome(sc))

    for factor, label in [(1.3, "+30%"), (0.7, "-30%")]:
        sc = copy.deepcopy(BASE)
        sc.adds_studio = tuple(v * factor for v in BASE.adds_studio)
        sc.adds_pro = tuple(v * factor for v in BASE.adds_pro)
        print(f"{'Venue-acquisitie ' + label:34}" + outcome(sc))

    for factor, label in [(1.25, "+25%"), (0.8, "-20%")]:
        sc = copy.deepcopy(BASE)
        sc.payroll_factor = factor
        print(f"{'Personeelslast ' + label:34}" + outcome(sc))

    for factor, label in [(0.5, "halvering"), (2.0, "verdubbeling")]:
        sc = copy.deepcopy(BASE)
        sc.campaigns_per_month = tuple(v * factor for v in BASE.campaigns_per_month)
        sc.fair_packages_per_year = tuple(int(round(v * factor)) for v in BASE.fair_packages_per_year)
        print(f"{'Media-omzet ' + label:34}" + outcome(sc))

    sc = copy.deepcopy(BASE)
    sc.paid_conversion = tuple(v * 2 for v in BASE.paid_conversion)
    print(f"{'Curator+ conversie x2':34}" + outcome(sc))

    print(
        "\nLees: personeelslast en media-omzet bepalen het resultaat, niet de "
        "app-store-omzet. Churn oogt hier mild omdat het model een opgezegde "
        "venue weer uit de adresseerbare pool aanvult; in werkelijkheid kost "
        "die heracquisitie verkooptijd die niet als variabele kost in het model "
        "zit. Lees de churnregel dus als ondergrens, niet als geruststelling."
    )


def price_grid() -> None:
    """Prijsgevoeligheid van het Studio-tarief (het volumeproduct)."""
    global PRICE_STUDIO
    original = PRICE_STUDIO
    print(f"\n{'=' * 78}\nPRIJSPUNT STUDIO-TIER\n{'=' * 78}")
    print(f"{'Prijs':10}{'Aanname churn':>16}{'Venues jr3':>13}{'Omzet jr3':>13}{'EBITDA jr3':>13}")
    import copy
    for price, churn_shift in [(29, -0.006), (39, -0.003), (49, 0.0), (69, 0.006), (89, 0.013)]:
        PRICE_STUDIO = float(price)
        sc = copy.deepcopy(BASE)
        sc.churn_monthly = tuple(max(0.008, c + churn_shift) for c in BASE.churn_monthly)
        # hogere prijs remt ook de acquisitiesnelheid
        drag = 1.0 - (price - 49) / 49 * 0.35
        sc.adds_studio = tuple(v * drag for v in BASE.adds_studio)
        rows = run(sc)
        yrs = annual(rows)
        print(
            f"A${price:<8}{sc.churn_monthly[2] * 100:>15.1f}%"
            f"{yrs[2]['venues_end']:>13,.0f}{a(yrs[2]['revenue']):>13}{a(yrs[2]['ebitda']):>13}"
        )
    PRICE_STUDIO = original


def write_csv(scenarios: list[Scenario], outdir: str) -> None:
    os.makedirs(outdir, exist_ok=True)
    for sc in scenarios:
        rows = run(sc)
        slug = sc.name.lower()
        path = os.path.join(outdir, f"maandmodel-{slug}.csv")
        with open(path, "w", newline="") as fh:
            w = csv.DictWriter(fh, fieldnames=list(rows[0].keys()))
            w.writeheader()
            for r in rows:
                w.writerow({k: (round(v, 2) if isinstance(v, float) else v) for k, v in r.items()})
        print(f"geschreven: {path}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", action="store_true", help="schrijf CSV's naar business/output/")
    args = ap.parse_args()
    scenarios = [CONSERVATIVE, BASE, OPTIMISTIC]
    report(scenarios)
    quarters(run(BASE))
    sensitivity()
    price_grid()
    if args.csv:
        here = os.path.dirname(os.path.abspath(__file__))
        write_csv(scenarios, os.path.join(here, "output"))
