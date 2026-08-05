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
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ArtEyeBot/1.0; +https://arteye.app) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml",
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
    const u = abs(base, raw.trim());
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
  ]) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(html))) add(m[1], "", true);
  }

  // Then every <img> on the page, including lazy-loaded and responsive ones.
  const imgRe = /<img\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = imgRe.exec(html))) {
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
      srcset ? widestFromSrcset(srcset) : attr("src") ?? attr("data-src") ?? attr("data-lazy-src"),
      alt,
    );
  }
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

    // 1. The listing page, and the show's own page when we can find it.
    let listing: { html: string; url: string } | null = null;
    for (const path of LISTING_PATHS) {
      const u = abs(venue.website as string, path);
      if (!u) continue;
      const html = await fetchPage(u);
      if (html) {
        listing = { html, url: u };
        break;
      }
    }
    if (listing) {
      const own = title ? linkForTitle(listing.html, listing.url, title) : null;
      if (own) {
        const ownHtml = await fetchPage(own);
        if (ownHtml) {
          collectImages(ownHtml, own, found); // the show's own page first
          pagesRead.push(own);
        }
      }
      collectImages(listing.html, listing.url, found);
      pagesRead.push(listing.url);
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
