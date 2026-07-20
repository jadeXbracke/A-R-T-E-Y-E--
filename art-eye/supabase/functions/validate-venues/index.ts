// validate-venues — weekly. Checks the 20 active venues with the oldest
// verified_date (nulls first, so the full set cycles in ~7 weeks) and files
// proposals in venue_review_queue. Propose, never apply: the ONLY direct
// write is verified_date/verification_source on a high-confidence confirm.
// Trigger manually with ?dry_run=1 to see what it would do without writing.
import {
  addUsageCost,
  anthropic,
  createProposal,
  finishRun,
  isDryRun,
  jsonResponse,
  MAX_CLAUDE_CALLS_PER_RUN,
  MODEL,
  newRunLog,
  startRun,
  supabaseAdmin,
} from "../_shared/pipeline.ts";

const BATCH_SIZE = 20;

const VERDICT_SCHEMA = {
  type: "object",
  properties: {
    status: { type: "string", enum: ["open", "closed", "moved", "renamed", "unclear"] },
    evidence: {
      type: "array",
      items: {
        type: "object",
        properties: { url: { type: "string" }, snippet: { type: "string" } },
        required: ["url", "snippet"],
        additionalProperties: false,
      },
    },
    confidence: { type: "number" },
    summary: { type: "string" },
  },
  required: ["status", "evidence", "confidence", "summary"],
  additionalProperties: false,
} as const;

interface Verdict {
  status: "open" | "closed" | "moved" | "renamed" | "unclear";
  evidence: { url: string; snippet: string }[];
  confidence: number;
  summary: string;
}

async function checkWebsite(url: string | null): Promise<{ ok: boolean; note: string }> {
  if (!url) return { ok: false, note: "no website on record" };
  try {
    const resp = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(10_000) });
    const redirected = resp.url && new URL(resp.url).hostname !== new URL(url).hostname;
    return {
      ok: resp.ok,
      note: `HTTP ${resp.status}${redirected ? `, redirects to ${new URL(resp.url).hostname}` : ""}`,
    };
  } catch (err) {
    return { ok: false, note: `unreachable: ${err instanceof Error ? err.message : String(err)}` };
  }
}

Deno.serve(async (req) => {
  const dryRun = await isDryRun(req);
  const sb = supabaseAdmin();
  const ai = anthropic();
  const run = newRunLog("validate");
  const runId = dryRun ? null : await startRun(sb, run);
  const report: unknown[] = [];

  const { data: venues, error } = await sb
    .from("venues")
    .select("id, name, suburb, address, website, status, verified_date")
    .eq("status", "active")
    .eq("is_fixture", false)
    .order("verified_date", { ascending: true, nullsFirst: true })
    .limit(BATCH_SIZE);
  if (error) {
    run.errors.push({ where: "select venues", message: error.message });
    await finishRun(sb, runId, run);
    return jsonResponse({ ok: false, error: error.message }, 500);
  }

  for (const venue of venues ?? []) {
    if (run.claude_calls >= MAX_CLAUDE_CALLS_PER_RUN) {
      run.errors.push({ where: "cost cap", message: `aborted after ${MAX_CLAUDE_CALLS_PER_RUN} Claude calls` });
      break;
    }
    run.venues_checked += 1;
    try {
      const site = await checkWebsite(venue.website);

      run.claude_calls += 1;
      const response = await ai.messages.create({
        model: MODEL,
        max_tokens: 4096,
        thinking: { type: "adaptive" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 5 }],
        output_config: { format: { type: "json_schema", schema: VERDICT_SCHEMA } },
        messages: [{
          role: "user",
          content:
            `Verify whether the art venue "${venue.name}" in ${venue.suburb ?? "Sydney"}, Sydney, Australia ` +
            `is currently open to the public and still at this address: ${venue.address ?? "unknown"}. ` +
            `Look specifically for closure announcements, relocations, or renamings. ` +
            `Our automated website check for ${venue.website ?? "(no website)"} returned: ${site.note}. ` +
            `Base your verdict only on sources you actually find; if the picture is mixed or you find nothing, use status "unclear" with low confidence.`,
        }],
      });
      addUsageCost(run, response.usage);

      if (response.stop_reason === "refusal") {
        run.errors.push({ where: venue.name, message: "model refused" });
        continue;
      }
      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") {
        run.errors.push({ where: venue.name, message: "no text block in response" });
        continue;
      }
      const verdict = JSON.parse(text.text) as Verdict;
      const evidence = verdict.evidence.length
        ? verdict.evidence
        : venue.website
          ? [{ url: venue.website, snippet: `Automated site check: ${site.note}` }]
          : [];

      if (verdict.status === "open" && verdict.confidence >= 0.8) {
        // The one allowed direct write — changes no user-facing content.
        if (!dryRun) {
          await sb.from("venues").update({
            verified_date: new Date().toISOString().slice(0, 10),
            verification_source: "pipeline",
          }).eq("id", venue.id);
        }
        report.push({ venue: venue.name, outcome: "confirmed open", confidence: verdict.confidence });
      } else if (verdict.status === "closed") {
        const r = await createProposal(sb, run, {
          venue_id: venue.id,
          action_type: "archive",
          proposed_payload: { status: "archived" },
          evidence,
          confidence: verdict.confidence,
          reason: `Appears permanently closed. ${verdict.summary}`,
        }, dryRun);
        report.push({ venue: venue.name, outcome: `archive proposal ${r}` });
      } else if (verdict.status === "moved" || verdict.status === "renamed") {
        const r = await createProposal(sb, run, {
          venue_id: venue.id,
          action_type: "update",
          proposed_payload: {},
          evidence,
          confidence: verdict.confidence,
          reason: `Appears ${verdict.status}. ${verdict.summary}`,
        }, dryRun);
        report.push({ venue: venue.name, outcome: `update proposal ${r}` });
      } else {
        // unclear or low confidence — never silently pass
        const r = await createProposal(sb, run, {
          venue_id: venue.id,
          action_type: "update",
          proposed_payload: {},
          evidence: evidence.length ? evidence : [{ url: venue.website ?? "https://www.google.com/search?q=" + encodeURIComponent(venue.name + " Sydney"), snippet: `Needs manual check. Site check: ${site.note}` }],
          confidence: Math.min(verdict.confidence, 0.5),
          reason: `Needs manual check (${verdict.status}, confidence ${verdict.confidence.toFixed(2)}). ${verdict.summary}`,
        }, dryRun);
        report.push({ venue: venue.name, outcome: `manual-check proposal ${r}` });
      }
    } catch (err) {
      // one failing venue never aborts the batch
      run.errors.push({ where: venue.name, message: err instanceof Error ? err.message : String(err) });
    }
  }

  await finishRun(sb, runId, run);
  return jsonResponse({
    ok: true,
    dry_run: dryRun,
    venues_checked: run.venues_checked,
    proposals_created: run.proposals_created,
    claude_calls: run.claude_calls,
    cost_estimate_usd: Number(run.cost_estimate.toFixed(4)),
    errors: run.errors,
    report,
  });
});
