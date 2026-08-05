// image-candidates — collects every usable photograph from a venue's own
// pages for one exhibition, so the owner can pick the picture rather than
// having an algorithm pick it. READ ONLY: it fetches public web pages and
// returns URLs; choosing an image is a normal admin write from the app,
// which RLS still guards.
//
// STANDALONE: paste as one file into the dashboard Edge Function editor
// (function name: image-candidates, file: index.ts, Verify JWT off).
//   ?exhibition_id=<uuid>   candidates for that show
//   &venue_id=<uuid>        candidates for a venue (no show needed)
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
    headers: {
      "content-type": "application/json; charset=utf-8",
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "*",
    },
  });
}

const FETCH_TIMEOUT_MS = 7000;
const MAX_CANDIDATES = 40;
const LISTING_PATHS = [
  "whats-on",
  "exhibitions",
  "current-exhibitions",
  "whats-on/exhibitions",
  "exhibitions/current",
  "current",
  "",
];
// Chrome, not artwork.
const JUNK = /logo|icon|favicon|sprite|placeholder|avatar|badge|button|arrow|pixel|spacer|loader|patreon|instagram|facebook|newsletter/i;

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

async function fetchPage(url: string): Promise<string | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      redirect: "follow",
      signal: ctrl.signal,
      // A real browser identity: sites behind bot protection answer 403 to
      // anything calling itself a bot, which read as "no photographs found".
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
    const u = new URL(path, base.endsWith("/") ? base : base + "/").toString();
    return /^https?:\/\//i.test(u) ? u : null;
  } catch {
    return null;
  }
}

// Widest entry of a srcset ("a.jpg 400w, b.jpg 1200w" -> b.jpg).
function widestFromSrcset(srcset: string): string | null {
  let best: { url: string; w: number } | null = null;
  for (const part of srcset.split(",")) {
    const [u, size] = part.trim().split(/\s+/);
    if (!u) continue;
    const w = size?.endsWith("w") ? parseInt(size) : 0;
    if (!best || w > best.w) best = { url: u, w };
  }
  return best?.url ?? null;
}

interface Candidate {
  url: string;
  alt: string;
  from: string; // which page it came from
  featured: boolean; // the page's own sharing image
}

function collectImages(html: string, base: string, out: Map<string, Candidate>) {
  const add = (raw: string | null, alt: string, featured = false) => {
    if (!raw) return;
    const u = abs(base, raw.trim().replace(/&amp;/g, "&"));
    if (!u) return;
    if (/\.svg($|\?)/i.test(u)) return;
    if (JUNK.test(u)) return;
    if (out.has(u)) {
      if (featured) out.get(u)!.featured = true;
      return;
    }
    if (out.size >= MAX_CANDIDATES) return;
    out.set(u, { url: u, alt: alt.slice(0, 120), from: base, featured });
  };

  // The page's own sharing image first — usually the key press shot.
  for (const re of [
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/gi,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi,
  ]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) add(m[1], "", true);
  }

  // JS-heavy sites (Squarespace and friends) put real <img> tags inside
  // <noscript> fallbacks — surface that hidden markup before scanning.
  const scannable = html.replace(/<noscript[^>]*>([\s\S]*?)<\/noscript>/gi, " $1 ");

  // "image": "..." in JSON-LD / embedded page data.
  const jsonImgRe = /"image"\s*:\s*"(https?:[^"]+?\.(?:jpe?g|png|webp|gif)[^"]*)"/gi;
  let jm: RegExpExecArray | null;
  while ((jm = jsonImgRe.exec(scannable))) add(jm[1], "");

  // Every <img>, including every known lazy-load attribute.
  const imgRe = /<img\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(scannable))) {
    const tag = m[1];
    const attr = (name: string) =>
      tag.match(new RegExp(name + '=["\']([^"\']+)["\']', "i"))?.[1] ?? null;
    // Skip anything the page itself declares tiny.
    const w = parseInt(attr("width") ?? "0");
    const h = parseInt(attr("height") ?? "0");
    if ((w && w < 240) || (h && h < 240)) continue;
    const alt = attr("alt") ?? "";
    const srcset = attr("srcset") ?? attr("data-srcset");
    add(
      srcset
        ? widestFromSrcset(srcset)
        : attr("src") ??
            attr("data-src") ??
            attr("data-lazy-src") ??
            attr("data-original") ??
            attr("data-image") ??
            attr("data-bg"),
      alt,
    );
  }

  // <source srcset> inside <picture>.
  const srcRe = /<source\b([^>]*)>/gi;
  while ((m = srcRe.exec(scannable))) {
    const ss = m[1].match(/srcset=["']([^"']+)["']/i)?.[1];
    if (ss) add(widestFromSrcset(ss), "");
  }

  // CSS hero backgrounds: style="background-image:url(...)".
  const bgRe = /background(?:-image)?\s*:\s*url\((['"]?)([^'")]+)\1\)/gi;
  while ((m = bgRe.exec(scannable))) add(m[2], "");
}

// The link on a listing page whose text matches this show's title.
function linkForTitle(html: string, base: string, title: string): string | null {
  const want = norm(title);
  if (want.length < 6) return null;
  const re = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]{0,300}?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    const text = norm(m[2].replace(/<[^>]+>/g, " "));
    if (!text) continue;
    if (text.includes(want) || (want.length > 12 && want.includes(text) && text.length > 10)) {
      const u = abs(base, m[1]);
      if (u) return u;
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return jsonResponse({ ok: true });
  const params = new URL(req.url).searchParams;
  const exhibitionId = params.get("exhibition_id");
  const venueIdParam = params.get("venue_id");
  const sb = supabaseAdmin();

  try {
    let title = "";
    let venueId = venueIdParam ?? "";
    if (exhibitionId) {
      const { data: show } = await sb
        .from("exhibitions")
        .select("title, venue_id")
        .eq("id", exhibitionId)
        .maybeSingle();
      if (!show) return jsonResponse({ ok: false, error: "exhibition not found" }, 404);
      title = show.title as string;
      venueId = show.venue_id as string;
    }
    if (!venueId) return jsonResponse({ ok: false, error: "pass exhibition_id or venue_id" }, 400);

    const { data: venue } = await sb
      .from("venues")
      .select("name, website")
      .eq("id", venueId)
      .maybeSingle();
    if (!venue?.website) {
      return jsonResponse({ ok: true, venue: venue?.name ?? null, candidates: [], note: "this venue has no website on file" });
    }

    const found = new Map<string, Candidate>();
    const pagesRead: string[] = [];

    // Fetch every candidate page concurrently and merge their images — one
    // image-less navigation page must not end the search.
    const urls = LISTING_PATHS.map((p) => abs(venue.website as string, p)).filter(
      (u): u is string => !!u,
    );
    const pages = (
      await Promise.all(
        urls.map(async (u) => {
          const html = await fetchPage(u);
          return html ? { html, url: u } : null;
        }),
      )
    ).filter((p): p is { html: string; url: string } => !!p);

    // The show's own page first, so its images lead the grid.
    if (title) {
      for (const page of pages) {
        const own = linkForTitle(page.html, page.url, title);
        if (own && !pagesRead.includes(own)) {
          const ownHtml = await fetchPage(own);
          if (ownHtml) {
            collectImages(ownHtml, own, found);
            pagesRead.push(own);
            break;
          }
        }
      }
    }
    for (const page of pages) {
      collectImages(page.html, page.url, found);
      pagesRead.push(page.url);
    }

    // Sharing images and show-page images sort to the front.
    const candidates = [...found.values()].sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return 0;
    });

    return jsonResponse({
      ok: true,
      venue: venue.name,
      title: title || null,
      pages_read: pagesRead,
      count: candidates.length,
      candidates,
    });
  } catch (err) {
    return jsonResponse(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      500,
    );
  }
});
