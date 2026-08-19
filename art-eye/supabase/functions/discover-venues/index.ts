// discover-venues — weekly. Searches for Sydney art spaces missing from the
// register — both newly opened ones and long-standing ones the original
// sweep simply missed — dedupes against the register and the open queue,
// and files `add` proposals. Never writes to venues directly.
// Trigger manually with ?dry_run=1.
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

const DISCOVERY_SCHEMA = {
  type: "object",
  properties: {
    venues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          suburb: { type: "string" },
          address: { type: "string" },
          type: { type: "string", enum: ["gallery", "museum", "ari"] },
          category: {
            type: "string",
            enum: ["institution", "public", "commercial", "ari", "first_nations", "event", "day_trip", "auction"],
          },
          website: { type: "string" },
          instagram: { type: "string" },
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
          reason: { type: "string" },
        },
        required: ["name", "suburb", "type", "evidence", "confidence", "reason"],
        additionalProperties: false,
      },
    },
  },
  required: ["venues"],
  additionalProperties: false,
} as const;

interface Discovered {
  name: string;
  suburb: string;
  address?: string;
  type: "gallery" | "museum" | "ari";
  category?: string;
  website?: string;
  instagram?: string;
  evidence: { url: string; snippet: string }[];
  confidence: number;
  reason: string;
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

Deno.serve(async (req) => {
  const dryRun = await isDryRun(req);
  const sb = supabaseAdmin();
  const ai = anthropic();
  const run = newRunLog("discover");
  const runId = dryRun ? null : await startRun(sb, run);
  const report: unknown[] = [];

  try {
    const [{ data: existing }, { data: queued }] = await Promise.all([
      sb.from("venues").select("name, suburb, website"),
      sb.from("venue_review_queue").select("proposed_payload").eq("status", "pending").eq("action_type", "add"),
    ]);
    // Match on domain as well as name: a renamed venue (e.g. Outsider
    // Gallery -> Gallery 144) has a new normalised name but usually keeps
    // its website, so domain matching catches what name matching alone
    // misses.
    const domain = (url: string | null | undefined) => {
      if (!url) return null;
      try {
        return new URL(url).hostname.replace(/^www\./, "");
      } catch {
        return null;
      }
    };
    const known = new Set((existing ?? []).map((v) => norm(v.name)));
    const knownDomains = new Set(
      (existing ?? []).map((v) => domain((v as { website?: string }).website)).filter((d): d is string => !!d)
    );
    for (const q of queued ?? []) {
      const payload = q.proposed_payload as Record<string, unknown>;
      if (typeof payload?.name === "string") known.add(norm(payload.name));
      const d = domain(payload?.website as string | undefined);
      if (d) knownDomains.add(d);
    }

    // Rotate the "which gap to hunt" angle by week so a small model budget
    // still covers the whole space over a month, instead of the same query
    // every run. ISO week number, stable across a day's re-runs.
    const isoWeek = Math.ceil(
      (Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()) -
        Date.UTC(new Date().getUTCFullYear(), 0, 1)) / 604800000
    );
    const angles = [
      "Art spaces that have newly opened or announced opening in Sydney, Australia in the last ~2 months.",
      "Sydney artist-run initiatives (ARIs) and small non-profit project spaces that are currently active but are " +
        "easy to miss — check NAVA's ARI list and inner-west council creative-trail pages (Marrickville, Newtown, " +
        "Alexandria, Waterloo) specifically.",
      "Commercial galleries in Surry Hills, Redfern, and Chippendale that are currently active. This district turns " +
        "over faster than the rest of the register, so check for anything not already covered.",
      "Sydney art venues that renamed, rebranded, or changed ownership in the last 2 years — the old name may be " +
        "known but the current name might not be in our records. Report under the CURRENT name and note the former " +
        "name in `reason`.",
    ];
    const angle = angles[isoWeek % angles.length];

    if (run.claude_calls < MAX_CLAUDE_CALLS_PER_RUN) {
      run.claude_calls += 1;
      const response = await ai.messages.create({
        model: MODEL,
        max_tokens: 8192,
        thinking: { type: "adaptive" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 15 }],
        output_config: { format: { type: "json_schema", schema: DISCOVERY_SCHEMA } },
        messages: [{
          role: "user",
          content:
            `Find Sydney art venues (commercial galleries, public galleries, museums, ARIs) matching this brief: ${angle} ` +
            "Prioritise coverage from Art Guide Australia, Ocula, Time Out Sydney, and NAVA news. " +
            "Only include venues you found actual reporting for — every entry needs at least one evidence URL with a snippet. " +
            "Return an empty list rather than guessing.",
        }],
      });
      addUsageCost(run, response.usage);

      if (response.stop_reason === "refusal") {
        run.errors.push({ where: "discovery", message: "model refused" });
      } else {
        const text = response.content.find((b) => b.type === "text");
        const found = text && text.type === "text"
          ? (JSON.parse(text.text) as { venues: Discovered[] }).venues
          : [];

        for (const v of found) {
          run.venues_checked += 1;
          const vDomain = domain(v.website);
          if (known.has(norm(v.name)) || (vDomain && knownDomains.has(vDomain))) {
            report.push({ venue: v.name, outcome: "skipped (already known or queued, by name or domain)" });
            continue;
          }
          const slug = slugify(v.name);
          const r = await createProposal(sb, run, {
            venue_id: null,
            action_type: "add",
            proposed_payload: {
              slug,
              name: v.name,
              type: v.type,
              category: v.category ?? null,
              address: v.address ?? null,
              suburb: v.suburb,
              website: v.website ?? null,
              instagram: v.instagram ?? null,
              city: "Sydney",
              status: "active",
            },
            evidence: v.evidence,
            confidence: v.confidence,
            reason: v.reason,
          }, dryRun);
          report.push({ venue: v.name, outcome: `add proposal ${r}` });
        }
      }
    }
  } catch (err) {
    run.errors.push({ where: "discovery", message: err instanceof Error ? err.message : String(err) });
  }

  await finishRun(sb, runId, run);
  return jsonResponse({
    ok: true,
    dry_run: dryRun,
    candidates_found: run.venues_checked,
    proposals_created: run.proposals_created,
    claude_calls: run.claude_calls,
    cost_estimate_usd: Number(run.cost_estimate.toFixed(4)),
    errors: run.errors,
    report,
  });
});
