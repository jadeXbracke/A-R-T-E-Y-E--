// discover-exhibitions — FREE, no-AI variant.
// Reads each venue's own website and extracts CURRENT/UPCOMING shows from the
// structured data the site already publishes: schema.org "Event" objects in
// <script type="application/ld+json"> blocks. No API key, no model, no rate
// limit, no per-call cost. It only reads the venue's own published data, so it
// is exact by construction. Files proposals into exhibition_review_queue — an
// admin still approves each one. "Propose, never apply."
//
// Trigger manually with ?dry_run=1 (writes nothing) and ?limit=N (cap venues).
import { isDryRun, jsonResponse, supabaseAdmin } from "../_shared/pipeline.ts";

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

// Pages to try on each venue site, in order. We stop at the first that yields
// events, so most venues cost a single fetch.
const CANDIDATE_PATHS = ["", "whats-on", "exhibitions", "current-exhibitions", "whats-on/exhibitions"];

const FETCH_TIMEOUT_MS = 9000;
const MAX_DESC = 600;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

interface Found {
  title: string;
  artists: string;
  start_date: string | null;
  end_date: string | null;
  description: string;
  source_url: string;
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
        // Look like a normal browser so sites return their full markup.
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

// Read one venue's site and return the events found (deduped by title).
async function scanVenue(website: string, today: string): Promise<Found[]> {
  for (const path of CANDIDATE_PATHS) {
    const url = pageUrl(website, path);
    if (!url) continue;
    const html = await fetchPage(url);
    if (!html) continue;

    const events: Record<string, unknown>[] = [];
    for (const block of extractJsonLd(html)) collectEvents(block, events);
    if (!events.length) continue;

    const byTitle = new Map<string, Found>();
    for (const ev of events) {
      const title = str(ev.name).trim();
      if (!title) continue;
      const end = toISODate(ev.endDate);
      // Keep current/upcoming only (no end date → assume ongoing, keep it).
      if (end && end < today) continue;
      const src = str(ev.url).trim();
      const found: Found = {
        title,
        artists: artistsOf(ev),
        start_date: toISODate(ev.startDate),
        end_date: end,
        description: stripHtml(str(ev.description)).slice(0, MAX_DESC),
        source_url: src ? (pageUrl(url, src) ?? url) : url,
      };
      byTitle.set(norm(title), found);
    }
    if (byTitle.size) return [...byTitle.values()];
  }
  return [];
}

Deno.serve(async (req) => {
  const dryRun = await isDryRun(req);
  const limit = Number(new URL(req.url).searchParams.get("limit") ?? "60");
  const sb = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);
  const report: unknown[] = [];
  const errors: unknown[] = [];
  let venuesScanned = 0;
  let showsFound = 0;
  let proposalsCreated = 0;

  try {
    // Real venues that have a website to read.
    const { data: venues } = await sb
      .from("venues")
      .select("id, name, website")
      .eq("is_fixture", false)
      .not("website", "is", null)
      .order("name")
      .limit(limit);

    // What we already have, to skip duplicates (venue + normalised title).
    const [{ data: exist }, { data: queued }] = await Promise.all([
      sb.from("exhibitions").select("venue_id, title"),
      sb.from("exhibition_review_queue").select("venue_id, title").eq("status", "pending"),
    ]);
    const seen = new Set<string>();
    for (const e of [...(exist ?? []), ...(queued ?? [])]) {
      seen.add(`${e.venue_id}:${norm(e.title as string)}`);
    }

    for (const v of venues ?? []) {
      venuesScanned += 1;
      let found: Found[] = [];
      try {
        found = await scanVenue(v.website as string, today);
      } catch (err) {
        errors.push({ venue: v.name, message: err instanceof Error ? err.message : String(err) });
        continue;
      }
      if (!found.length) {
        report.push({ venue: v.name, outcome: "no structured data (JSON-LD) found" });
        continue;
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
          report.push({ venue: v.name, title: ex.title, outcome: "would queue" });
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
          // Structured data straight from the venue — high confidence.
          confidence: 0.9,
        });
        if (error) {
          errors.push({ where: "insert", title: ex.title, message: error.message });
          continue;
        }
        proposalsCreated += 1;
        report.push({ venue: v.name, title: ex.title, outcome: "queued" });
      }
    }
  } catch (err) {
    errors.push({ where: "discover-exhibitions", message: err instanceof Error ? err.message : String(err) });
  }

  return jsonResponse({
    ok: true,
    method: "json-ld",
    dry_run: dryRun,
    venues_scanned: venuesScanned,
    shows_found: showsFound,
    proposals_created: proposalsCreated,
    cost_estimate_usd: 0,
    errors,
    report,
  });
});
