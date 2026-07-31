// discover-exhibitions — weekly. For each active venue, reads the venue's own
// website (plus aggregators like Art Guide Australia / Ocula) via Claude
// web_search and files CURRENT/UPCOMING shows into exhibition_review_queue.
// Never writes to exhibitions directly — an admin approves each row.
// Trigger manually with ?dry_run=1, and ?limit=N to cap venues per run.
import {
  addUsageCost,
  anthropic,
  isDryRun,
  jsonResponse,
  MAX_CLAUDE_CALLS_PER_RUN,
  MODEL,
  newRunLog,
  supabaseAdmin,
} from "../_shared/pipeline.ts";

const EXHIBITION_SCHEMA = {
  type: "object",
  properties: {
    exhibitions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          venue_name: { type: "string" },
          title: { type: "string" },
          artists: { type: "string" },
          start_date: { type: "string", description: "YYYY-MM-DD, empty if unknown" },
          end_date: { type: "string", description: "YYYY-MM-DD, empty if unknown" },
          description: { type: "string" },
          source_url: { type: "string" },
          confidence: { type: "number" },
        },
        required: ["venue_name", "title", "source_url", "confidence"],
        additionalProperties: false,
      },
    },
  },
  required: ["exhibitions"],
  additionalProperties: false,
} as const;

interface Found {
  venue_name: string;
  title: string;
  artists?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  source_url: string;
  confidence: number;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const chunk = <T,>(a: T[], n: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < a.length; i += n) out.push(a.slice(i, i + n));
  return out;
};

Deno.serve(async (req) => {
  const dryRun = await isDryRun(req);
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "60");
  const sb = supabaseAdmin();
  const ai = anthropic();
  const run = newRunLog("discover");
  const report: unknown[] = [];

  try {
    // Venues to scan: real ones with a website.
    const { data: venues } = await sb
      .from("venues")
      .select("id, name, website, suburb")
      .eq("is_fixture", false)
      .not("website", "is", null)
      .order("name")
      .limit(limit);

    // What we already have, to skip duplicates (by venue + normalised title).
    const [{ data: exist }, { data: queued }] = await Promise.all([
      sb.from("exhibitions").select("venue_id, title"),
      sb.from("exhibition_review_queue").select("venue_id, title").eq("status", "pending"),
    ]);
    const seen = new Set<string>();
    for (const e of [...(exist ?? []), ...(queued ?? [])]) {
      seen.add(`${e.venue_id}:${norm(e.title as string)}`);
    }

    const byName = new Map((venues ?? []).map((v) => [norm(v.name), v]));
    const today = new Date().toISOString().slice(0, 10);

    // Batch ~8 venues per Claude call to stay under the cost cap.
    for (const batch of chunk(venues ?? [], 8)) {
      if (run.claude_calls >= MAX_CLAUDE_CALLS_PER_RUN) break;
      run.claude_calls += 1;
      const list = batch.map((v) => `- ${v.name} (${v.website})`).join("\n");
      const response = await ai.messages.create({
        model: MODEL,
        max_tokens: 8192,
        thinking: { type: "adaptive" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 12 }],
        output_config: { format: { type: "json_schema", schema: EXHIBITION_SCHEMA } },
        messages: [{
          role: "user",
          content:
            `Today is ${today}. For each of these Sydney art venues, find the exhibitions that are ` +
            `CURRENTLY ON or UPCOMING (end date on/after today). Prefer the venue's own website ` +
            `(the "what's on"/"exhibitions" page); Art Guide Australia and Ocula are good fallbacks.\n\n${list}\n\n` +
            `For each show give exact title, artists, start_date and end_date (YYYY-MM-DD), a one-line ` +
            `description, and source_url (the page you read). Only include shows you actually found — ` +
            `every entry needs a source_url. Leave a date empty rather than guessing. Return an empty list if nothing found.`,
        }],
      });
      addUsageCost(run, response.usage);
      if (response.stop_reason === "refusal") continue;

      const text = response.content.find((b) => b.type === "text");
      const found: Found[] = text && text.type === "text"
        ? (JSON.parse(text.text) as { exhibitions: Found[] }).exhibitions
        : [];

      for (const ex of found) {
        run.venues_checked += 1;
        const venue = byName.get(norm(ex.venue_name));
        if (!venue) { report.push({ title: ex.title, outcome: "skipped (venue not matched)" }); continue; }
        const key = `${venue.id}:${norm(ex.title)}`;
        if (seen.has(key)) { report.push({ title: ex.title, outcome: "skipped (already known)" }); continue; }
        if (!ex.source_url) { report.push({ title: ex.title, outcome: "skipped (no source)" }); continue; }
        seen.add(key);

        if (dryRun) { run.proposals_created += 1; report.push({ venue: venue.name, title: ex.title, outcome: "would queue" }); continue; }
        const { error } = await sb.from("exhibition_review_queue").insert({
          venue_id: venue.id,
          title: ex.title,
          artists: ex.artists ?? "",
          start_date: isDate(ex.start_date) ? ex.start_date : null,
          end_date: isDate(ex.end_date) ? ex.end_date : null,
          description: ex.description ?? "",
          source_url: ex.source_url,
          confidence: Math.max(0, Math.min(1, ex.confidence ?? 0.5)),
        });
        if (error) { run.errors.push({ where: "insert", title: ex.title, message: error.message }); continue; }
        run.proposals_created += 1;
        report.push({ venue: venue.name, title: ex.title, outcome: "queued" });
      }
    }
  } catch (err) {
    run.errors.push({ where: "discover-exhibitions", message: err instanceof Error ? err.message : String(err) });
  }

  return jsonResponse({
    ok: true,
    dry_run: dryRun,
    shows_found: run.venues_checked,
    proposals_created: run.proposals_created,
    claude_calls: run.claude_calls,
    cost_estimate_usd: Number(run.cost_estimate.toFixed(4)),
    errors: run.errors,
    report,
  });
});
