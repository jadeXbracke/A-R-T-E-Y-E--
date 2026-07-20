// Shared helpers for the venue freshness pipeline (Supabase Edge Functions).
// Core principle: propose, never apply — the only direct write any job may do
// is venues.verified_date/verification_source on a high-confidence confirm.
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient, SupabaseClient } from "npm:@supabase/supabase-js@2";

export const MAX_CLAUDE_CALLS_PER_RUN = 30; // hard cost cap (spec guardrail)
export const MODEL = "claude-opus-4-8";
// $/MTok for claude-opus-4-8 — estimate only (web-search tool usage not included)
const INPUT_PER_MTOK = 5.0;
const OUTPUT_PER_MTOK = 25.0;

export function supabaseAdmin(): SupabaseClient {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

export function anthropic(): Anthropic {
  return new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });
}

export interface EvidenceItem {
  url: string;
  snippet: string;
  checked_at?: string;
}

export interface RunLog {
  id?: string;
  run_type: "validate" | "discover";
  venues_checked: number;
  proposals_created: number;
  errors: unknown[];
  cost_estimate: number;
  claude_calls: number;
}

export function newRunLog(run_type: "validate" | "discover"): RunLog {
  return { run_type, venues_checked: 0, proposals_created: 0, errors: [], cost_estimate: 0, claude_calls: 0 };
}

export function addUsageCost(run: RunLog, usage: { input_tokens: number; output_tokens: number; cache_creation_input_tokens?: number | null; cache_read_input_tokens?: number | null }) {
  const inTok = usage.input_tokens + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
  run.cost_estimate += (inTok * INPUT_PER_MTOK + usage.output_tokens * OUTPUT_PER_MTOK) / 1_000_000;
}

export async function startRun(sb: SupabaseClient, run: RunLog): Promise<string | null> {
  const { data, error } = await sb
    .from("validation_runs")
    .insert({ run_type: run.run_type })
    .select("id")
    .single();
  if (error) {
    run.errors.push({ where: "startRun", message: error.message });
    return null;
  }
  return data.id as string;
}

export async function finishRun(sb: SupabaseClient, runId: string | null, run: RunLog) {
  if (!runId) return;
  await sb.from("validation_runs").update({
    finished_at: new Date().toISOString(),
    venues_checked: run.venues_checked,
    proposals_created: run.proposals_created,
    errors: run.errors,
    cost_estimate: Number(run.cost_estimate.toFixed(4)),
  }).eq("id", runId);
}

/**
 * Insert a proposal, respecting the guardrails:
 * - no evidence → no proposal (also enforced by a DB CHECK)
 * - idempotency: the partial unique index rejects a second pending proposal
 *   for the same venue+action (treated as a benign skip here)
 * - snooze: skip if an identical proposal was rejected < snooze_until
 */
export async function createProposal(
  sb: SupabaseClient,
  run: RunLog,
  p: {
    venue_id: string | null;
    action_type: "add" | "archive" | "update";
    proposed_payload: Record<string, unknown>;
    evidence: EvidenceItem[];
    confidence: number;
    reason: string;
  },
  dryRun: boolean,
): Promise<"created" | "skipped"> {
  if (!p.evidence.length) return "skipped";

  const today = new Date().toISOString().slice(0, 10);
  let snoozeQuery = sb
    .from("venue_review_queue")
    .select("id")
    .eq("action_type", p.action_type)
    .eq("status", "rejected")
    .gt("snooze_until", today)
    .limit(1);
  snoozeQuery = p.venue_id
    ? snoozeQuery.eq("venue_id", p.venue_id)
    : snoozeQuery.is("venue_id", null).eq("proposed_payload->>slug", String(p.proposed_payload.slug ?? ""));
  const { data: snoozed } = await snoozeQuery;
  if (snoozed && snoozed.length) return "skipped";

  if (dryRun) {
    run.proposals_created += 1;
    return "created";
  }
  const { error } = await sb.from("venue_review_queue").insert({
    venue_id: p.venue_id,
    action_type: p.action_type,
    proposed_payload: p.proposed_payload,
    evidence: p.evidence.map((e) => ({ ...e, checked_at: e.checked_at ?? new Date().toISOString() })),
    confidence: Math.max(0, Math.min(1, p.confidence)),
    reason: p.reason,
  });
  if (error) {
    // 23505 = the partial unique index: an identical pending proposal exists
    if (error.code === "23505") return "skipped";
    run.errors.push({ where: "createProposal", venue_id: p.venue_id, message: error.message });
    return "skipped";
  }
  run.proposals_created += 1;
  return "created";
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function isDryRun(req: Request): Promise<boolean> {
  if (new URL(req.url).searchParams.get("dry_run")) return true;
  try {
    const body = await req.clone().json();
    return body?.dry_run === true;
  } catch {
    return false;
  }
}
