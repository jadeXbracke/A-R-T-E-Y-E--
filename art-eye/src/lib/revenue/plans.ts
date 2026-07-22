// Revenue model — single source of truth for plans & entitlements.
//
// This module encodes the pricing structure from docs/REVENUE_MODEL.md as typed
// data the app can read for feature-gating, and that a future billing layer
// (RevenueCat for consumer IAP, Stripe for venue B2B) can map onto. It defines
// *what each plan is allowed to do* — it does not talk to any payment provider.
//
// Two independent axes:
//   • Venue plans  (B2B, supply side)     — attached to a Venue
//   • Member plans (consumer, demand side) — attached to a Profile
//
// Keep this separate from `Venue.tier` (editorial weight) and
// `Exhibition.is_featured` (editorial picks): billing state must never be
// conflated with editorial decisions. Promoted placement is its own record.

export type BillingInterval = 'monthly' | 'yearly';

// Prices are stored in whole cents (AUD) to avoid float rounding.
export interface Price {
  monthly: number | null; // null = not offered on this interval
  yearly: number | null;
  currency: 'AUD';
}

// ---------------------------------------------------------------------------
// Venue plans (Stream A — venue subscriptions)
// ---------------------------------------------------------------------------

export type VenuePlanId = 'listed' | 'claimed' | 'pro' | 'institution';

export interface VenueEntitlements {
  ownerAccount: boolean; // claim + manage the venue
  selfServeSubmit: boolean; // submit/edit exhibitions without the host
  mediaUploads: boolean; // photo / video / reel on the venue + shows
  basicStats: boolean; // views + save counts
  fullAnalytics: boolean; // saves, page views, want-to-see, direction taps
  verifiedBadge: boolean;
  priorityPipeline: boolean; // faster freshness-pipeline cadence
  carouselEligible: boolean; // always-on hero eligibility (still editorial-gated)
  maxConcurrentExhibitions: number | null; // null = unlimited
  promotedCreditsPerMonth: number; // promoted-slot credits included
  aggregateInsights: boolean; // privacy-preserving audience insight dashboard
  multiUser: boolean;
}

export interface VenuePlan {
  id: VenuePlanId;
  label: string;
  audience: string;
  price: Price;
  entitlements: VenueEntitlements;
  // ARIs / not-for-profits get this plan at $0 (community rate) — see isCommunityFree().
  communityFreeEligible?: boolean;
}

const VENUE_LISTED: VenuePlan = {
  id: 'listed',
  label: 'LISTED',
  audience: 'Every venue in the register — free forever',
  price: { monthly: 0, yearly: 0, currency: 'AUD' },
  entitlements: {
    ownerAccount: false,
    selfServeSubmit: false,
    mediaUploads: false,
    basicStats: false,
    fullAnalytics: false,
    verifiedBadge: false,
    priorityPipeline: false,
    carouselEligible: false,
    maxConcurrentExhibitions: null, // the host still publishes their shows for free
    promotedCreditsPerMonth: 0,
    aggregateInsights: false,
    multiUser: false,
  },
};

const VENUE_CLAIMED: VenuePlan = {
  id: 'claimed',
  label: 'CLAIMED',
  audience: 'Small galleries & ARIs',
  price: { monthly: 2900, yearly: 29000, currency: 'AUD' },
  communityFreeEligible: true, // free for ARIs / not-for-profits
  entitlements: {
    ownerAccount: true,
    selfServeSubmit: true,
    mediaUploads: true,
    basicStats: true,
    fullAnalytics: false,
    verifiedBadge: false,
    priorityPipeline: false,
    carouselEligible: false,
    maxConcurrentExhibitions: null,
    promotedCreditsPerMonth: 0,
    aggregateInsights: false,
    multiUser: false,
  },
};

const VENUE_PRO: VenuePlan = {
  id: 'pro',
  label: 'PRO',
  audience: 'Established commercial galleries',
  price: { monthly: 8900, yearly: 89000, currency: 'AUD' },
  entitlements: {
    ownerAccount: true,
    selfServeSubmit: true,
    mediaUploads: true,
    basicStats: true,
    fullAnalytics: true,
    verifiedBadge: true,
    priorityPipeline: true,
    carouselEligible: false,
    maxConcurrentExhibitions: null,
    promotedCreditsPerMonth: 3,
    aggregateInsights: false,
    multiUser: false,
  },
};

const VENUE_INSTITUTION: VenuePlan = {
  id: 'institution',
  label: 'INSTITUTION',
  audience: 'Museums, art fairs, large galleries',
  price: { monthly: 39900, yearly: null, currency: 'AUD' }, // annual is POA
  entitlements: {
    ownerAccount: true,
    selfServeSubmit: true,
    mediaUploads: true,
    basicStats: true,
    fullAnalytics: true,
    verifiedBadge: true,
    priorityPipeline: true,
    carouselEligible: true,
    maxConcurrentExhibitions: null,
    promotedCreditsPerMonth: 6,
    aggregateInsights: true,
    multiUser: true,
  },
};

export const VENUE_PLANS: Record<VenuePlanId, VenuePlan> = {
  listed: VENUE_LISTED,
  claimed: VENUE_CLAIMED,
  pro: VENUE_PRO,
  institution: VENUE_INSTITUTION,
};

export const VENUE_PLAN_ORDER: VenuePlanId[] = ['listed', 'claimed', 'pro', 'institution'];

// ---------------------------------------------------------------------------
// Member plans (Stream B — consumer membership, "ART EYE+")
// ---------------------------------------------------------------------------

export type MemberPlanId = 'free' | 'plus';

export interface MemberEntitlements {
  maxSaves: number | null; // null = unlimited
  unlimitedLogHistory: boolean;
  yearInReview: boolean; // lifetime stats + annual recap
  privateNotes: boolean;
  exportLog: boolean; // CSV / PDF export
  earlyOpeningAlerts: boolean;
  personalisedAgenda: boolean; // weekly "for you" + closing-soon nudges
  memberEvents: 'discounted' | 'included'; // access to guided walks/talks
}

export interface MemberPlan {
  id: MemberPlanId;
  label: string;
  price: Price;
  entitlements: MemberEntitlements;
}

const MEMBER_FREE: MemberPlan = {
  id: 'free',
  label: 'FREE',
  price: { monthly: 0, yearly: 0, currency: 'AUD' },
  entitlements: {
    maxSaves: 60,
    unlimitedLogHistory: false,
    yearInReview: false,
    privateNotes: false,
    exportLog: false,
    earlyOpeningAlerts: false,
    personalisedAgenda: false,
    memberEvents: 'discounted',
  },
};

const MEMBER_PLUS: MemberPlan = {
  id: 'plus',
  label: 'ART EYE+',
  price: { monthly: 699, yearly: 4900, currency: 'AUD' },
  entitlements: {
    maxSaves: null,
    unlimitedLogHistory: true,
    yearInReview: true,
    privateNotes: true,
    exportLog: true,
    earlyOpeningAlerts: true,
    personalisedAgenda: true,
    memberEvents: 'included',
  },
};

export const MEMBER_PLANS: Record<MemberPlanId, MemberPlan> = {
  free: MEMBER_FREE,
  plus: MEMBER_PLUS,
};

// A discounted annual student rate for ART EYE+ (verified .edu / student status).
export const STUDENT_PLUS_YEARLY_CENTS = 2900;

// ---------------------------------------------------------------------------
// Promoted placements (Stream C — marketplace)
// ---------------------------------------------------------------------------
//
// A promotion is a paid, time-boxed, clearly-labelled surface. It is a distinct
// record from Exhibition.is_featured (editorial). Guardrails live alongside the
// catalogue so the caps are enforceable in one place.

export type PromotionSurface = 'carousel' | 'filter_top' | 'opening_push';

export interface PromotionProduct {
  surface: PromotionSurface;
  label: string;
  unit: 'week' | 'send';
  priceCents: number; // AUD; or draw from a plan's promotedCreditsPerMonth
  requiresLabel: 'SPONSORED' | 'PARTNER';
}

export const PROMOTION_CATALOGUE: PromotionProduct[] = [
  { surface: 'carousel', label: 'Hero carousel slot', unit: 'week', priceCents: 18000, requiresLabel: 'SPONSORED' },
  { surface: 'filter_top', label: 'Top of filter results', unit: 'week', priceCents: 6000, requiresLabel: 'SPONSORED' },
  { surface: 'opening_push', label: 'Opening-night push', unit: 'send', priceCents: 12000, requiresLabel: 'SPONSORED' },
];

// Trust guardrails — see docs/REVENUE_MODEL.md §2.C and §6.
export const PROMOTION_RULES = {
  // No more than 1 in N carousel slots may be a paid promotion.
  maxCarouselShareDenominator: 5,
  // A closed show can never be promoted, regardless of spend.
  allowPromotingClosedShows: false,
  // Editorial picks (is_featured / curator's picks) are never purchasable.
  editorialPicksForSale: false,
  // Opening pushes are frequency-capped per member per week.
  maxOpeningPushesPerMemberPerWeek: 2,
} as const;

// ---------------------------------------------------------------------------
// Helpers — feature-gating the app reads at runtime
// ---------------------------------------------------------------------------

/** The plan a venue is entitled to bill on, honouring the ARI/not-for-profit community rate. */
export function effectiveVenuePrice(plan: VenuePlan, isNonProfit: boolean): Price {
  if (isNonProfit && plan.communityFreeEligible) {
    return { monthly: 0, yearly: 0, currency: 'AUD' };
  }
  return plan.price;
}

/** True when this venue type/category qualifies for the $0 community Claimed rate. */
export function isCommunityFree(venueType: string, category?: string | null): boolean {
  return venueType === 'ari' || category === 'first_nations' || category === 'ari';
}

export function venueCan<K extends keyof VenueEntitlements>(
  planId: VenuePlanId,
  feature: K,
): VenueEntitlements[K] {
  return VENUE_PLANS[planId].entitlements[feature];
}

export function memberCan<K extends keyof MemberEntitlements>(
  planId: MemberPlanId,
  feature: K,
): MemberEntitlements[K] {
  return MEMBER_PLANS[planId].entitlements[feature];
}

/** Whether a member on `planId` can still save, given how many they already have. */
export function canSaveMore(planId: MemberPlanId, currentSaves: number): boolean {
  const max = MEMBER_PLANS[planId].entitlements.maxSaves;
  return max === null || currentSaves < max;
}

/** Format whole-cent AUD for display, e.g. 2900 -> "$29", 699 -> "$6.99". */
export function formatPrice(cents: number | null): string {
  if (cents === null) return 'POA';
  if (cents === 0) return 'Free';
  const dollars = cents / 100;
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`;
}
