// discover-exhibitions — hybrid: free structured data first, Google Gemini as
// the fallback for pages that don't publish it.
//
// For each venue we fetch its "what's on" page and:
//   1. read schema.org/Event data from JSON-LD if present  → free, exact
//   2. otherwise hand the page text to Google Gemini        → covers the rest
//
// Gemini is only called when step 1 finds nothing, so most venues cost €0 and
// the number of model calls stays tiny (well within Gemini's free tier).
// Everything lands in exhibition_review_queue — an admin approves each row.
// "Propose, never apply."
//
// Secret required for the Gemini fallback:
//   supabase secrets set GEMINI_API_KEY=...   (from Google AI Studio, free)
// Optional: GEMINI_MODEL (default "gemini-2.0-flash").
//
// Trigger manually with ?dry_run=1 (writes nothing) and ?limit=N (cap venues).
// Open ?ui=1 for a page that walks the whole register by itself.
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
    headers: { "Content-Type": "application/json" },
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
const MAX_DESC = 600;
const MAX_GEMINI_CHARS = 16000; // page text sent to Gemini, truncated
const MAX_GEMINI_CALLS = 40; // per-run guardrail (free tier is ~1000/day)
const BATCH = 4; // venues scanned concurrently (site fetches, not model calls)

// Gemini free tier is limited per MINUTE, so model calls are serialised with a
// gap between them and retried on 429 instead of aborting the whole run.
const GEMINI_GAP_MS = 6500;
const GEMINI_RETRIES = 2;
// Return before the browser gives up; the caller resumes at next_offset.
const RUN_DEADLINE_MS = 45_000;
const startedAt = () => Date.now();

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
          title: { type: "STRING" },
          artists: { type: "STRING" },
          start_date: { type: "STRING", description: "YYYY-MM-DD or empty" },
          end_date: { type: "STRING", description: "YYYY-MM-DD or empty" },
          description: { type: "STRING" },
        },
        required: ["title"],
      },
    },
  },
  required: ["exhibitions"],
};

interface GeminiResult {
  items: Found[];
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

async function geminiExtract(
  venueName: string,
  pageText: string,
  sourceUrl: string,
  today: string,
): Promise<GeminiResult> {
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const prompt =
    `Today is ${today}. Below is the text of the "${venueName}" art venue's "what's on" page. ` +
    `Extract every exhibition that is CURRENTLY ON or UPCOMING (end date on or after today). ` +
    `For each: exact title, artists (comma-separated, empty if none named), start_date and end_date ` +
    `as YYYY-MM-DD (empty string if the page doesn't state it), and a one-line description. ` +
    `Only include real exhibitions actually described in the text — never invent one. ` +
    `Return an empty list if there are none.\n\n---\n${pageText}`;

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
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS + 6000);
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
    // 429 = per-minute quota. Wait it out and retry rather than ending the run.
    for (let attempt = 0; res.status === 429 && attempt < GEMINI_RETRIES; attempt++) {
      await sleep(GEMINI_GAP_MS * (attempt + 2));
      res = await throttled(call);
    }
    if (res.status === 429) return { items: [], rateLimited: true };
    if (!res.ok) return { items: [], error: `gemini ${res.status}` };
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    if (!txt) return { items: [] };
    let parsed: { exhibitions?: unknown };
    try {
      parsed = JSON.parse(txt);
    } catch {
      return { items: [], error: "gemini: unparseable json" };
    }
    const raw = Array.isArray(parsed.exhibitions) ? parsed.exhibitions : [];
    const byTitle = new Map<string, Found>();
    for (const r of raw as Record<string, unknown>[]) {
      const title = str(r.title).trim();
      if (!title) continue;
      const end = toISODate(r.end_date);
      if (end && end < today) continue;
      byTitle.set(norm(title), {
        title,
        artists: str(r.artists).trim(),
        start_date: toISODate(r.start_date),
        end_date: end,
        description: stripHtml(str(r.description)).slice(0, MAX_DESC),
        source_url: sourceUrl,
        via: "gemini",
      });
    }
    return { items: [...byTitle.values()] };
  } catch (err) {
    return { items: [], error: err instanceof Error ? err.message : String(err) };
  }
}

interface ScanResult {
  found: Found[];
  // page text kept for the Gemini fallback when no JSON-LD was found
  fallback?: { text: string; url: string };
}

// A one-link runner: walks the whole venue register slice by slice from the
// browser, so nobody has to open ?offset=0,15,30,… by hand. Each slice is a
// short fetch, so it never hits the browser's page-load timeout, and it pauses
// between slices to stay inside Gemini's per-minute free tier.
function runnerPage(path: string): Response {
  const html = `<!doctype html><html lang="nl"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>ART EYE — Ophalen</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; background:#fff; color:#000;
         max-width: 720px; margin: 0 auto; padding: 24px 16px 60px; }
  h1 { font-size: 15px; letter-spacing: .35em; text-transform: uppercase; }
  .sub { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; margin: 6px 0 20px; }
  button { font: inherit; font-size: 13px; letter-spacing: .15em; text-transform: uppercase;
           padding: 14px 20px; border: 1px solid #000; background:#000; color:#fff; width: 100%; }
  button.stop { background:#fff; color:#000; }
  .stat { border-top: 1px solid #000; margin-top: 20px; padding-top: 12px;
          font-size: 13px; line-height: 1.7; }
  .b { font-weight: 700; }
  .log { margin-top: 16px; font-size: 13px; line-height: 1.6; }
  .log div { padding: 5px 0; border-bottom: 1px solid #eee; }
  .v { font-size: 11px; letter-spacing: .14em; text-transform: uppercase; }
</style></head><body>
<h1>ARTEYE</h1>
<div class="sub">Expo's ophalen uit alle venues</div>
<button id="go">Start</button>
<div class="stat">
  Venues bekeken: <span class="b" id="scanned">0</span><br>
  Expo's gevonden: <span class="b" id="found">0</span><br>
  Status: <span id="status">klaar om te starten</span>
</div>
<div class="log" id="log"></div>
<script>
  const $ = (id) => document.getElementById(id);
  let running = false, scanned = 0, found = 0;
  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  function line(venue, title) {
    const d = document.createElement('div');
    d.innerHTML = '<span class="v">' + venue + '</span><br>' + title;
    $('log').prepend(d);
  }

  async function run() {
    let offset = 0;
    while (running) {
      $('status').textContent = 'bezig bij venue ' + (offset + 1) + '…';
      let data;
      try {
        const res = await fetch(location.pathname + '?limit=10&offset=' + offset);
        data = await res.json();
      } catch (e) {
        $('status').textContent = 'even geen verbinding, opnieuw proberen…';
        await sleep(5000);
        continue;
      }
      scanned += data.venues_scanned || 0;
      $('scanned').textContent = scanned;
      for (const r of (data.report || [])) {
        if (r.outcome === 'queued' || r.outcome === 'would queue') {
          found++; line(r.venue, r.title);
        }
      }
      $('found').textContent = found;

      if (data.next_offset === null || data.next_offset === undefined) {
        $('status').textContent = 'klaar — alle venues bekeken';
        running = false; $('go').textContent = 'Opnieuw'; $('go').className = '';
        return;
      }
      offset = data.next_offset;
      // Breather so Gemini's per-minute free tier keeps up.
      const pause = data.rate_limited ? 30 : 8;
      for (let s = pause; s > 0 && running; s--) {
        $('status').textContent = 'even pauze (' + s + 's) — Gemini gratis-limiet';
        await sleep(1000);
      }
    }
    $('status').textContent = 'gestopt';
  }

  $('go').onclick = () => {
    if (running) {
      running = false; $('go').textContent = 'Start'; $('go').className = '';
    } else {
      running = true; $('go').textContent = 'Stop'; $('go').className = 'stop'; run();
    }
  };
</script></body></html>`;
  return new Response(html, { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } });
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
  // ?ui=1 serves a small page that walks the whole register by itself.
  if (params.get("ui")) return runnerPage(reqUrl.pathname);

  const dryRun = await isDryRun(req);
  const deadline = startedAt() + RUN_DEADLINE_MS;
  const limit = Number(params.get("limit") ?? "10");
  const offset = Number(params.get("offset") ?? "0");
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

    // Scan venues in small concurrent batches so a browser request finishes
    // quickly (sequential scanning of dozens of sites times Safari out).
    const handleVenue = async (v: { id: string; name: string; website: string }) => {
      venuesScanned += 1;
      let scan: ScanResult;
      try {
        scan = await scanVenue(v.website, today);
      } catch (err) {
        errors.push({ venue: v.name, message: err instanceof Error ? err.message : String(err) });
        return;
      }

      let found = scan.found;
      // Gemini fallback: only when JSON-LD found nothing and we have page text.
      // Skipped once the deadline is near — the caller resumes at next_offset.
      if (Date.now() > deadline && !found.length) {
        report.push({ venue: v.name, outcome: "skipped (time budget reached)" });
        return;
      }
      if (!found.length && scan.fallback && GEMINI_KEY && geminiCalls < MAX_GEMINI_CALLS && !rateLimited) {
        geminiCalls += 1;
        const g = await geminiExtract(v.name, scan.fallback.text, scan.fallback.url, today);
        if (g.rateLimited) {
          rateLimited = true;
          report.push({ venue: v.name, outcome: "gemini rate-limited (stopping AI fallback this run)" });
        } else if (g.error) {
          errors.push({ venue: v.name, where: "gemini", message: g.error });
        }
        found = g.items;
      }

      if (!found.length) {
        const why = !scan.fallback
          ? "no page reachable"
          : GEMINI_KEY
          ? "nothing found (JSON-LD + Gemini)"
          : "no JSON-LD (set GEMINI_API_KEY to use the AI fallback)";
        report.push({ venue: v.name, outcome: why });
        return;
      }

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

    const list = (venues ?? []) as { id: string; name: string; website: string }[];
    for (let i = 0; i < list.length; i += BATCH) {
      await Promise.all(list.slice(i, i + BATCH).map(handleVenue));
    }
  } catch (err) {
    errors.push({ where: "discover-exhibitions", message: err instanceof Error ? err.message : String(err) });
  }

  return jsonResponse({
    ok: true,
    method: "json-ld + gemini",
    gemini_model: GEMINI_MODEL,
    gemini_enabled: !!GEMINI_KEY,
    dry_run: dryRun,
    offset,
    next_offset: venuesScanned === limit ? offset + limit : null, // null = done
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
