// discover-exhibitions — hybrid: free structured data first, Google Gemini as
// the fallback for pages that don't publish it.
//
// For each venue we fetch its "what's on" page and:
//   1. read schema.org/Event data from JSON-LD if present  → free, exact
//   2. otherwise hand the page text to Google Gemini        → covers the rest
//
// Gemini is only called when step 1 finds nothing, and then for several venues
// per request, so the model call count stays far inside the free tier.
// Everything lands in exhibition_review_queue — an admin approves each row.
// "Propose, never apply."
//
// Secret required for the Gemini fallback:
//   supabase secrets set GEMINI_API_KEY=...   (from Google AI Studio, free)
// Optional: GEMINI_MODEL (default "gemini-2.5-flash"; "gemini-flash-latest" also works).
//
// Trigger manually with ?dry_run=1 (writes nothing) and ?limit=N (cap venues).
// Add &chain=1 to walk the whole register automatically: each slice hands off
// to the next in the background, so a single request scans every venue.
//
// STANDALONE COPY: same as index.ts with the shared helpers inlined, so it
// pastes as a single file into the Supabase dashboard Edge Function editor.
import { createClient } from "npm:@supabase/supabase-js@2";

// --- inlined helpers (so this whole function is one paste-able file) ---
function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}
function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}
async function isDryRun(req: Request): Promise<boolean> {
  if (new URL(req.url).searchParams.get("dry_run")) return true;
  try {
    const body = await req.clone().json();
    return body?.dry_run === true;
  } catch {
    return false;
  }
}
// --- end helpers ---

// schema.org @type values we treat as an exhibition/event.
const EVENT_TYPES = new Set([
  "event",
  "exhibitionevent",
  "visualartsevent",
  "exhibition",
  "festival",
  "socialevent",
  "businessevent",
  "screeningevent",
  "theaterevent",
]);

// Pages to try on each venue site. Fetched concurrently; the first listing
// page with JSON-LD events wins, otherwise the best page text goes to Gemini.
const CANDIDATE_PATHS = [
  "whats-on",
  "exhibitions",
  "current-exhibitions",
  "whats-on/exhibitions",
  "exhibitions/current",
  "visit/whats-on",
  "",
];
// Paths that are exhibition listings — best text to feed Gemini if no JSON-LD.
const LISTING_PATHS = new Set(CANDIDATE_PATHS.filter((p) => p !== ""));

const FETCH_TIMEOUT_MS = 6000;
const GEMINI_TIMEOUT_MS = 45_000; // batched prompts are large; give them room
const MAX_DESC = 600;
const MAX_GEMINI_CHARS = 9000; // page text per venue, truncated
const MAX_GEMINI_CALLS = 40; // per-run guardrail
const BATCH = 6; // venues scanned concurrently (site fetches, not model calls)

// The free tier is billed per REQUEST, not per venue, so several venues go
// into one prompt: ~137 venues become ~28 requests instead of 137.
const GEMINI_BATCH = 5;
// The free tier allows ~20 requests per minute. Pace at ~15/min (a 4s gap) so
// there is headroom, and honour Google's own "retry in Ns" hint on a 429 —
// retrying earlier just burns quota that is not there.
const GEMINI_GAP_MS = 4000;
const GEMINI_RETRIES = 2;
const GEMINI_RETRY_FLOOR_MS = 30_000;
const GEMINI_RETRY_CAP_MS = 65_000;
// Return before the browser gives up; the caller resumes at next_offset.
const RUN_DEADLINE_MS = 45_000;
const startedAt = () => Date.now();
// Hard stop for ?chain=1 so a self-invoking run can never loop away.
const MAX_CHAIN_DEPTH = 30;

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

interface Found {
  title: string;
  artists: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  source_url: string;
  via: "json-ld" | "gemini";
}

function toISODate(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
}

// schema.org fields are sometimes plain strings, sometimes objects/arrays.
function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v.map(str).filter(Boolean).join(", ");
  if (typeof v === "object") {
    const o = v as Record<string, unknown>;
    if (typeof o["@value"] === "string") return o["@value"];
    if (typeof o.name === "string") return o.name;
  }
  return "";
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

// Full-page HTML → readable text (drops scripts/styles/markup), for Gemini.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;|&rsquo;|&lsquo;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

// Pull performer / author names to use as "artists" when present.
function artistsOf(node: Record<string, unknown>): string {
  const parts = [node.performer, node.performers, node.author, node.artist, node.byArtist]
    .map(str)
    .filter(Boolean);
  return [...new Set(parts.join(", ").split(", ").filter(Boolean))].join(", ");
}

function extractJsonLd(html: string): unknown[] {
  const out: unknown[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    try {
      out.push(JSON.parse(raw));
    } catch {
      // Tolerate trailing commas, a common hand-authored mistake.
      try {
        out.push(JSON.parse(raw.replace(/,\s*([\]}])/g, "$1")));
      } catch {
        /* skip malformed block */
      }
    }
  }
  return out;
}

// JSON-LD can be an object, an array, or wrapped in @graph, with nested events.
function collectEvents(node: unknown, acc: Record<string, unknown>[], depth = 0): void {
  if (!node || depth > 6) return;
  if (Array.isArray(node)) {
    for (const n of node) collectEvents(n, acc, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const o = node as Record<string, unknown>;
  if (o["@graph"]) collectEvents(o["@graph"], acc, depth + 1);
  const t = o["@type"];
  const types = Array.isArray(t) ? t : [t];
  if (types.some((x) => typeof x === "string" && EVENT_TYPES.has(x.toLowerCase()))) {
    acc.push(o);
  }
  if (o.subEvent) collectEvents(o.subEvent, acc, depth + 1);
  if (o.event) collectEvents(o.event, acc, depth + 1);
}

async function fetchPage(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArtEyeBot/1.0; +https://arteye.app) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
      },
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function pageUrl(website: string, path: string): string | null {
  try {
    return new URL(path, website.endsWith("/") ? website : website + "/").toString();
  } catch {
    return null;
  }
}

function jsonLdRows(html: string, url: string, today: string): Found[] {
  const events: Record<string, unknown>[] = [];
  for (const block of extractJsonLd(html)) collectEvents(block, events);
  const byTitle = new Map<string, Found>();
  for (const ev of events) {
    const title = str(ev.name).trim();
    if (!title) continue;
    const end = toISODate(ev.endDate);
    if (end && end < today) continue; // past show
    const src = str(ev.url).trim();
    byTitle.set(norm(title), {
      title,
      artists: artistsOf(ev),
      start_date: toISODate(ev.startDate),
      end_date: end,
      description: stripHtml(str(ev.description)).slice(0, MAX_DESC),
      source_url: src ? (pageUrl(url, src) ?? url) : url,
      via: "json-ld",
    });
  }
  return [...byTitle.values()];
}

// Gemini structured-output schema (OpenAPI subset; types are UPPERCASE).
const GEMINI_SCHEMA = {
  type: "OBJECT",
  properties: {
    exhibitions: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          venue_number: { type: "INTEGER", description: "the VENUE n number this show belongs to" },
          title: { type: "STRING" },
          artists: { type: "STRING" },
          start_date: { type: "STRING", description: "YYYY-MM-DD or empty" },
          end_date: { type: "STRING", description: "YYYY-MM-DD or empty" },
          description: { type: "STRING" },
        },
        required: ["venue_number", "title"],
      },
    },
  },
  required: ["exhibitions"],
};

// One venue's page, queued up for the model.
interface GeminiJob {
  name: string;
  text: string;
  url: string;
}

interface GeminiBatchResult {
  // keyed by the job's index within the batch
  byIndex: Map<number, Found[]>;
  rateLimited?: boolean;
  error?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Serialise model calls and keep GEMINI_GAP_MS between them, so concurrent
// venue scanning never bursts through the free tier's per-minute limit.
let geminiChain: Promise<unknown> = Promise.resolve();
let lastGeminiAt = 0;
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = geminiChain.then(async () => {
    const wait = lastGeminiAt + GEMINI_GAP_MS - Date.now();
    if (wait > 0) await sleep(wait);
    lastGeminiAt = Date.now();
    return fn();
  });
  geminiChain = run.then(() => {}, () => {});
  return run;
}

// Ask the model about SEVERAL venues in one request. The free tier is capped
// per request, not per venue, so batching is what makes a full sweep quick:
// ~137 venues become ~28 requests instead of 137. Each page is numbered and
// the model echoes the number back, so shows map to the right venue.
async function geminiExtractBatch(
  jobs: GeminiJob[],
  today: string,
  deadline: number,
): Promise<GeminiBatchResult> {
  const empty = new Map<number, Found[]>();
  if (!jobs.length) return { byIndex: empty };

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const pages = jobs
    .map((j, i) => `=== VENUE ${i + 1}: ${j.name} ===\n${j.text}`)
    .join("\n\n");
  const prompt =
    `Today is ${today}. Below are the "what's on" pages of ${jobs.length} art venue(s), ` +
    `each starting with a line "=== VENUE n: name ===".\n\n` +
    `Extract every exhibition that is CURRENTLY ON or UPCOMING (end date on or after today). ` +
    `For each show give: venue_number (the n of the venue whose page it appeared on), the exact ` +
    `title, artists (comma-separated, empty if none named), start_date and end_date as YYYY-MM-DD ` +
    `(empty string if the page does not state it), and a one-line description. ` +
    `Only include real exhibitions actually described in that venue's text - never invent one, and ` +
    `never move a show to a different venue_number. Return an empty list if there are none.\n\n${pages}`;

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: GEMINI_SCHEMA,
    },
  };

  const call = async () => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), GEMINI_TIMEOUT_MS);
    try {
      return await fetch(url, {
        method: "POST",
        signal: ctrl.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    let res = await throttled(call);
    let detail = "";
    // 429 = quota exhausted. Google states how long to wait ("Please retry in
    // 26.9s"); honour that, because retrying early only burns more quota.
    for (let attempt = 0; res.status === 429 && attempt < GEMINI_RETRIES; attempt++) {
      detail = await res.text().catch(() => "");
      const hint = detail.match(/retry in ([\d.]+)s/i);
      const waitMs = Math.min(
        Math.max(hint ? Math.ceil(Number(hint[1]) * 1000) + 1500 : GEMINI_RETRY_FLOOR_MS, GEMINI_RETRY_FLOOR_MS),
        GEMINI_RETRY_CAP_MS,
      );
      // Only wait if this run still has the time; otherwise leave these venues
      // for the next slice rather than blowing past the deadline.
      if (Date.now() + waitMs > deadline) break;
      await sleep(waitMs);
      res = await throttled(call);
    }
    if (res.status === 429) {
      detail = await res.text().catch(() => detail);
      return { byIndex: empty, rateLimited: true, error: `gemini 429: ${detail.slice(0, 400)}` };
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { byIndex: empty, error: `gemini ${res.status}: ${body.slice(0, 300)}` };
    }
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    if (!txt) return { byIndex: empty };
    let parsed: { exhibitions?: unknown };
    try {
      parsed = JSON.parse(txt);
    } catch {
      return { byIndex: empty, error: "gemini: unparseable json" };
    }

    const raw = Array.isArray(parsed.exhibitions) ? parsed.exhibitions : [];
    const byIndex = new Map<number, Found[]>();
    const seenPerVenue = new Map<number, Set<string>>();
    for (const r of raw as Record<string, unknown>[]) {
      const title = str(r.title).trim();
      if (!title) continue;
      // venue_number is 1-based and must point at a page we actually sent.
      const idx = Math.trunc(Number(r.venue_number)) - 1;
      if (!Number.isInteger(idx) || idx < 0 || idx >= jobs.length) continue;
      const end = toISODate(r.end_date);
      if (end && end < today) continue;

      const dedup = seenPerVenue.get(idx) ?? new Set<string>();
      const key = norm(title);
      if (dedup.has(key)) continue;
      dedup.add(key);
      seenPerVenue.set(idx, dedup);

      const list = byIndex.get(idx) ?? [];
      list.push({
        title,
        artists: str(r.artists).trim(),
        start_date: toISODate(r.start_date),
        end_date: end,
        description: stripHtml(str(r.description)).slice(0, MAX_DESC),
        source_url: jobs[idx].url,
        via: "gemini",
      });
      byIndex.set(idx, list);
    }
    return { byIndex };
  } catch (err) {
    return { byIndex: empty, error: err instanceof Error ? err.message : String(err) };
  }
}

interface ScanResult {
  found: Found[];
  // page text kept for the Gemini fallback when no JSON-LD was found
  fallback?: { text: string; url: string };
}

// Fetch the venue's candidate pages concurrently: return JSON-LD events if any
// page has them, else the best page text (a listing page if we hit one,
// otherwise the homepage) for Gemini. Candidate order decides the winner.
async function scanVenue(website: string, today: string): Promise<ScanResult> {
  const pages = await Promise.all(
    CANDIDATE_PATHS.map(async (path) => {
      const url = pageUrl(website, path);
      if (!url) return null;
      const html = await fetchPage(url);
      return html ? { path, url, html } : null;
    }),
  );

  let firstPage: { text: string; url: string } | undefined;
  let listingPage: { text: string; url: string } | undefined;

  for (const page of pages) {
    if (!page) continue;
    const rows = jsonLdRows(page.html, page.url, today);
    if (rows.length) return { found: rows };

    const text = htmlToText(page.html).slice(0, MAX_GEMINI_CHARS);
    if (text.length > 200) {
      if (!firstPage) firstPage = { text, url: page.url };
      if (!listingPage && LISTING_PATHS.has(page.path)) listingPage = { text, url: page.url };
    }
  }
  return { found: [], fallback: listingPage ?? firstPage };
}

Deno.serve(async (req) => {
  const reqUrl = new URL(req.url);
  const params = reqUrl.searchParams;
  const dryRun = await isDryRun(req);
  const deadline = startedAt() + RUN_DEADLINE_MS;
  const limit = Number(params.get("limit") ?? "25");
  const offset = Number(params.get("offset") ?? "0");
  const chain = params.get("chain") === "1";
  const depth = Number(params.get("depth") ?? "0"); // runaway-chain guard
  const sb = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const report: unknown[] = [];
  const errors: unknown[] = [];
  let venuesScanned = 0;
  let showsFound = 0;
  let proposalsCreated = 0;
  let geminiCalls = 0;
  let rateLimited = false;

  try {
    // offset+limit let a browser run the register in small, fast slices
    // (e.g. ?limit=15&offset=0, then offset=15, 30, …).
    const { data: venues } = await sb
      .from("venues")
      .select("id, name, website")
      .eq("is_fixture", false)
      .not("website", "is", null)
      .order("name")
      .range(offset, offset + limit - 1);

    // What we already have, to skip duplicates (venue + normalised title).
    const [{ data: exist }, { data: queued }] = await Promise.all([
      sb.from("exhibitions").select("venue_id, title"),
      sb.from("exhibition_review_queue").select("venue_id, title").eq("status", "pending"),
    ]);
    const seen = new Set<string>();
    for (const e of [...(exist ?? []), ...(queued ?? [])]) {
      seen.add(`${e.venue_id}:${norm(e.title as string)}`);
    }

    type Venue = { id: string; name: string; website: string };
    const list = (venues ?? []) as Venue[];

    // Queue one venue's shows. Shared by the JSON-LD and the Gemini paths.
    const queueShows = async (v: Venue, found: Found[]) => {
      for (const ex of found) {
        showsFound += 1;
        const key = `${v.id}:${norm(ex.title)}`;
        if (seen.has(key)) {
          report.push({ venue: v.name, title: ex.title, outcome: "skipped (already known)" });
          continue;
        }
        seen.add(key);

        if (dryRun) {
          proposalsCreated += 1;
          report.push({ venue: v.name, title: ex.title, via: ex.via, outcome: "would queue" });
          continue;
        }
        const { error } = await sb.from("exhibition_review_queue").insert({
          venue_id: v.id,
          title: ex.title,
          artists: ex.artists,
          start_date: ex.start_date,
          end_date: ex.end_date,
          description: ex.description,
          source_url: ex.source_url,
          // JSON-LD is exact; Gemini is interpreted, so give it a lower prior.
          confidence: ex.via === "json-ld" ? 0.9 : 0.65,
        });
        if (error) {
          errors.push({ where: "insert", title: ex.title, message: error.message });
          continue;
        }
        proposalsCreated += 1;
        report.push({ venue: v.name, title: ex.title, via: ex.via, outcome: "queued" });
      }
    };

    // Phase 1 - read every venue's site (free, concurrent). Anything without
    // JSON-LD is parked for the model.
    const pending: { venue: Venue; job: GeminiJob }[] = [];
    const readVenue = async (v: Venue) => {
      venuesScanned += 1;
      let scan: ScanResult;
      try {
        scan = await scanVenue(v.website, today);
      } catch (err) {
        errors.push({ venue: v.name, message: err instanceof Error ? err.message : String(err) });
        return;
      }
      if (scan.found.length) {
        await queueShows(v, scan.found);
        return;
      }
      if (!scan.fallback) {
        report.push({ venue: v.name, outcome: "no page reachable" });
        return;
      }
      if (!GEMINI_KEY) {
        report.push({ venue: v.name, outcome: "no JSON-LD (set GEMINI_API_KEY to use the AI fallback)" });
        return;
      }
      pending.push({ venue: v, job: { name: v.name, text: scan.fallback.text, url: scan.fallback.url } });
    };

    for (let i = 0; i < list.length; i += BATCH) {
      await Promise.all(list.slice(i, i + BATCH).map(readVenue));
    }

    // Phase 2 - one model request per GEMINI_BATCH venues, not per venue. This
    // is what keeps a full sweep inside the free tier's per-minute allowance.
    let pendingHandled = 0;
    for (let i = 0; i < pending.length; i += GEMINI_BATCH) {
      if (rateLimited || geminiCalls >= MAX_GEMINI_CALLS) break;
      const group = pending.slice(i, i + GEMINI_BATCH);
      pendingHandled = i + group.length;
      if (Date.now() > deadline) {
        for (const { venue } of group) {
          report.push({ venue: venue.name, outcome: "skipped (time budget reached)" });
        }
        continue;
      }
      geminiCalls += 1;
      const g = await geminiExtractBatch(group.map((p) => p.job), today, deadline);
      if (g.rateLimited) {
        rateLimited = true;
        // Google's own wording says whether this is a per-minute or per-day
        // quota - the difference between "wait a bit" and "wait until tomorrow".
        if (g.error) errors.push({ where: "gemini quota", message: g.error });
      } else if (g.error) {
        errors.push({ where: "gemini", message: g.error });
      }
      for (let j = 0; j < group.length; j++) {
        const found = g.byIndex.get(j) ?? [];
        if (found.length) await queueShows(group[j].venue, found);
        else {
          report.push({
            venue: group[j].venue.name,
            outcome: g.rateLimited ? "gemini rate-limited" : "nothing found (JSON-LD + Gemini)",
          });
        }
      }
    }
    // Venues the model never got to (quota or call cap) are reported as such.
    for (const { venue } of pending.slice(pendingHandled)) {
      report.push({ venue: venue.name, outcome: "not reached this run (resumes next slice)" });
    }
  } catch (err) {
    errors.push({ where: "discover-exhibitions", message: err instanceof Error ? err.message : String(err) });
  }

  const nextOffset = venuesScanned === limit ? offset + limit : null; // null = done

  // ?chain=1 walks the whole register on its own: each run hands off to the
  // next slice in the background, so one link scans every venue. The pause
  // between hand-offs keeps Gemini inside its per-minute free tier.
  let chained = false;
  if (chain && nextOffset !== null && depth < MAX_CHAIN_DEPTH) {
    const next = new URL(req.url);
    next.searchParams.set("offset", String(nextOffset));
    next.searchParams.set("depth", String(depth + 1));
    chained = true;
    // Fire-and-forget: give the request time to land, then stop waiting so
    // this invocation can end while the next one runs on its own.
    const handoff = (async () => {
      // After a 429, let the per-minute window reset fully; otherwise hand off
      // promptly - the per-request throttle already paces the model calls.
      await sleep(rateLimited ? 65_000 : 3_000);
      const ctrl = new AbortController();
      setTimeout(() => ctrl.abort(), 2000);
      await fetch(next.toString(), { signal: ctrl.signal }).catch(() => {});
    })();
    const runtime = (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime;
    if (runtime?.waitUntil) runtime.waitUntil(handoff);
    else await handoff;
  }

  return jsonResponse({
    ok: true,
    method: "json-ld + gemini",
    gemini_model: GEMINI_MODEL,
    gemini_enabled: !!GEMINI_KEY,
    dry_run: dryRun,
    offset,
    next_offset: nextOffset,
    chaining: chained
      ? `yes - slice ${depth + 1}/${MAX_CHAIN_DEPTH}, continuing at offset ${nextOffset} in the background`
      : chain
      ? "no - finished"
      : "off (add &chain=1 to walk every venue automatically)",
    venues_scanned: venuesScanned,
    shows_found: showsFound,
    proposals_created: proposalsCreated,
    gemini_calls: geminiCalls,
    rate_limited: rateLimited,
    cost_estimate_usd: 0,
    errors,
    report,
  });
});
