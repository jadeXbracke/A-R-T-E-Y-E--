// enrich-press-images — gives already-published exhibitions their real press
// photograph. For each show without an image it reads the venue's own site,
// finds the page for that show (by title), and takes the page's og:image —
// the picture the venue itself uses when the page is shared.
//
// Images are the one thing here that is applied directly rather than queued:
// the source URL is recorded in image_source, an image is trivially reversible
// (?reset=1 clears them), and nothing textual is touched.
//
// No AI, no key, no quota — free HTTP reads only.
//
// STANDALONE: paste as one file into the dashboard Edge Function editor
// (function name: enrich-press-images, file: index.ts, Verify JWT off).
//   ?dry_run=1   report only, write nothing
//   &chain=1     walk every show automatically
//   ?reset=1     clear images this function set (undo), then stop
import { createClient } from "npm:@supabase/supabase-js@2";

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

const FETCH_TIMEOUT_MS = 6000;
const RUN_DEADLINE_MS = 45_000;
const BACKGROUND_DEADLINE_MS = 150_000;
const MAX_CHAIN_DEPTH = 30;
const BATCH = 6; // shows handled concurrently
// Listing pages to search for a link to the show's own page.
const LISTING_PATHS = [
  "whats-on",
  "exhibitions",
  "current-exhibitions",
  "whats-on/exhibitions",
  "exhibitions/current",
  "current",
  "",
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function fetchPage(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      // A real browser identity — sites behind bot protection 403 anything
      // that calls itself a bot.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-AU,en;q=0.9",
      },
    });
    if (!res.ok) return null;
    if (!(res.headers.get("content-type") ?? "").includes("html")) return null;
    return await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function abs(base: string, path: string): string | null {
  try {
    return new URL(path, base.endsWith("/") ? base : base + "/").toString();
  } catch {
    return null;
  }
}

// The page's sharing image — what the venue itself puts forward.
function pageImage(html: string, base: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) {
      const u = abs(base, m[1].trim());
      if (u && /^https?:\/\//i.test(u) && !/\.svg($|\?)/i.test(u)) return u;
    }
  }
  return null;
}

// Find the link on a listing page whose text matches this show's title.
function linkForTitle(html: string, base: string, title: string): string | null {
  const want = norm(title);
  if (want.length < 6) return null;
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  let best: string | null = null;
  while ((m = re.exec(html))) {
    const text = norm(m[2].replace(/<[^>]+>/g, " "));
    if (!text) continue;
    // A link whose text contains the title (or vice versa for truncated links).
    if (text.includes(want) || (want.length > 12 && want.includes(text) && text.length > 10)) {
      const u = abs(base, m[1]);
      if (u && /^https?:\/\//i.test(u)) {
        best = u;
        break;
      }
    }
  }
  return best;
}

interface Show {
  id: string;
  title: string;
  venue_id: string;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const params = url.searchParams;
  const dryRun = !!params.get("dry_run");
  const reset = !!params.get("reset");
  const limit = Number(params.get("limit") ?? "20");
  const offset = Number(params.get("offset") ?? "0");
  const chain = params.get("chain") === "1";
  const depth = Number(params.get("depth") ?? "0");
  const deadline = Date.now() + (depth > 0 ? BACKGROUND_DEADLINE_MS : RUN_DEADLINE_MS);
  const sb = supabaseAdmin();
  const report: unknown[] = [];
  const errors: unknown[] = [];
  let scanned = 0;
  let updated = 0;

  // Undo: clear only images this function set (it stamps image_source).
  if (reset) {
    const { data, error } = await sb
      .from("exhibitions")
      .update({ image_url: null })
      .like("image_source", "press:%")
      .select("id");
    return jsonResponse({
      ok: !error,
      reset: true,
      cleared: data?.length ?? 0,
      error: error?.message ?? null,
    });
  }

  try {
    const { data: shows } = await sb
      .from("exhibitions")
      .select("id, title, venue_id")
      .eq("status", "approved")
      .is("image_url", null)
      .order("start_date", { ascending: false })
      .range(offset, offset + limit - 1);

    const list = (shows ?? []) as Show[];
    const venueIds = [...new Set(list.map((s) => s.venue_id))];
    const { data: venues } = await sb
      .from("venues")
      .select("id, name, website, image_url")
      .in("id", venueIds.length ? venueIds : ["00000000-0000-0000-0000-000000000000"]);
    const byId = new Map(
      ((venues ?? []) as { id: string; name: string; website: string | null; image_url: string | null }[])
        .map((v) => [v.id, v]),
    );

    // One fetch of a venue's listing page serves all of its shows in this slice.
    const listingCache = new Map<string, { html: string; url: string } | null>();
    async function listingFor(website: string): Promise<{ html: string; url: string } | null> {
      if (listingCache.has(website)) return listingCache.get(website)!;
      let found: { html: string; url: string } | null = null;
      for (const path of LISTING_PATHS) {
        const u = abs(website, path);
        if (!u) continue;
        const html = await fetchPage(u);
        if (html) {
          found = { html, url: u };
          break;
        }
      }
      listingCache.set(website, found);
      return found;
    }

    const handle = async (s: Show) => {
      scanned += 1;
      if (Date.now() > deadline) {
        report.push({ title: s.title, outcome: "not reached this run" });
        return;
      }
      const venue = byId.get(s.venue_id);
      if (!venue?.website) {
        report.push({ title: s.title, outcome: "venue has no website" });
        return;
      }
      const listing = await listingFor(venue.website);
      if (!listing) {
        report.push({ venue: venue.name, title: s.title, outcome: "no page reachable" });
        return;
      }

      // Prefer the show's own page; fall back to the listing page's image.
      let image: string | null = null;
      let source = listing.url;
      const own = linkForTitle(listing.html, listing.url, s.title);
      if (own) {
        const ownHtml = await fetchPage(own);
        if (ownHtml) {
          image = pageImage(ownHtml, own);
          if (image) source = own;
        }
      }
      if (!image) image = pageImage(listing.html, listing.url);
      // Never reuse the venue's own portrait as if it were the show's photo.
      if (image && venue.image_url && image === venue.image_url) image = null;

      if (!image) {
        report.push({ venue: venue.name, title: s.title, outcome: "no press image found" });
        return;
      }
      if (dryRun) {
        updated += 1;
        report.push({ venue: venue.name, title: s.title, image, outcome: "would set" });
        return;
      }
      const { error } = await sb
        .from("exhibitions")
        .update({ image_url: image, image_source: `press:${source}` })
        .eq("id", s.id);
      if (error) {
        errors.push({ title: s.title, message: error.message });
        return;
      }
      updated += 1;
      report.push({ venue: venue.name, title: s.title, image, outcome: "set" });
    };

    for (let i = 0; i < list.length; i += BATCH) {
      await Promise.all(list.slice(i, i + BATCH).map(handle));
    }
  } catch (err) {
    errors.push({ where: "enrich-press-images", message: err instanceof Error ? err.message : String(err) });
  }

  const nextOffset = scanned === limit ? offset + limit : null;
  let chained = false;
  if (chain && nextOffset !== null && depth < MAX_CHAIN_DEPTH) {
    const next = new URL(req.url);
    next.searchParams.set("offset", String(nextOffset));
    next.searchParams.set("depth", String(depth + 1));
    chained = true;
    const handoff = (async () => {
      await sleep(3_000);
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
    what: "press photos for shows that have none",
    dry_run: dryRun,
    offset,
    next_offset: nextOffset,
    chaining: chained
      ? `yes - continuing at offset ${nextOffset} in the background`
      : chain
      ? "no - finished"
      : "off (add &chain=1 to walk every show automatically)",
    shows_scanned: scanned,
    images_set: updated,
    errors,
    report,
  });
});
