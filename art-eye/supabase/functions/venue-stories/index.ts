// venue-stories — writes a short factual profile for every venue that has
// none yet, from the venue's OWN website (about/homepage text) via Gemini.
// "Propose, never apply": each story lands in venue_review_queue as an
// 'update' proposal with the source page as evidence — the owner approves it
// in the app's Owner Inbox, which is what writes venues.editorial_note.
//
// Reuses the same free setup as discover-exhibitions: GEMINI_API_KEY
// (+ optional GEMINI_MODEL). Open with ?chain=1 to walk every venue
// automatically; ?dry_run=1 writes nothing.
//
// STANDALONE: paste this single file into the dashboard Edge Function editor
// (function name: venue-stories, file name: index.ts, Verify JWT off).
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

// Pages most likely to describe the venue itself.
const CANDIDATE_PATHS = ["about", "about-us", "info", "history", "gallery", ""];

const FETCH_TIMEOUT_MS = 6000;
const GEMINI_TIMEOUT_MS = 45_000;
const MAX_CHARS = 7000; // page text per venue sent to the model
const GEMINI_BATCH = 5; // venues per model request (free tier bills per request)
const GEMINI_GAP_MS = 4000;
const GEMINI_RETRIES = 2;
const GEMINI_RETRY_FLOOR_MS = 30_000;
const GEMINI_RETRY_CAP_MS = 65_000;
const RUN_DEADLINE_MS = 45_000;
const BACKGROUND_DEADLINE_MS = 150_000;
const MAX_CHAIN_DEPTH = 30;

const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") ?? "gemini-2.5-flash";
const GEMINI_KEY = Deno.env.get("GEMINI_API_KEY") ?? "";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

function pageUrl(website: string, path: string): string | null {
  try {
    return new URL(path, website.endsWith("/") ? website : website + "/").toString();
  } catch {
    return null;
  }
}

// Serialise model calls with a gap so concurrency never bursts the free tier.
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

const SCHEMA = {
  type: "OBJECT",
  properties: {
    stories: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          venue_number: { type: "INTEGER" },
          story: { type: "STRING", description: "2-3 factual sentences, or empty if the text says too little" },
        },
        required: ["venue_number", "story"],
      },
    },
  },
  required: ["stories"],
};

interface Job {
  venue: { id: string; name: string };
  text: string;
  url: string;
}

async function geminiStories(
  jobs: Job[],
  deadline: number,
): Promise<{ byIndex: Map<number, string>; rateLimited?: boolean; error?: string }> {
  const empty = new Map<number, string>();
  if (!jobs.length) return { byIndex: empty };
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_KEY}`;
  const pages = jobs.map((j, i) => `=== VENUE ${i + 1}: ${j.venue.name} ===\n${j.text}`).join("\n\n");
  const prompt =
    `Below is text from the websites of ${jobs.length} art venue(s), each starting with ` +
    `"=== VENUE n: name ===".\n\nFor each venue, write a SHORT profile of 2-3 sentences in English: ` +
    `what kind of place it is, what it focuses on, and anything notable (founding year, the space, ` +
    `its programme) - ONLY if the text itself says so. Plain, factual, editorial tone; no marketing ` +
    `superlatives, no invented facts. If the text tells you too little, return an empty story for ` +
    `that venue.\n\n${pages}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, responseMimeType: "application/json", responseSchema: SCHEMA },
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
    for (let attempt = 0; res.status === 429 && attempt < GEMINI_RETRIES; attempt++) {
      detail = await res.text().catch(() => "");
      const hint = detail.match(/retry in ([\d.]+)s/i);
      const waitMs = Math.min(
        Math.max(hint ? Math.ceil(Number(hint[1]) * 1000) + 1500 : GEMINI_RETRY_FLOOR_MS, GEMINI_RETRY_FLOOR_MS),
        GEMINI_RETRY_CAP_MS,
      );
      if (Date.now() + waitMs > deadline) break;
      await sleep(waitMs);
      res = await throttled(call);
    }
    if (res.status === 429) {
      detail = await res.text().catch(() => detail);
      return { byIndex: empty, rateLimited: true, error: `gemini 429: ${detail.slice(0, 400)}` };
    }
    if (!res.ok) return { byIndex: empty, error: `gemini ${res.status}: ${(await res.text().catch(() => "")).slice(0, 300)}` };
    const data = await res.json();
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text as string | undefined;
    if (!txt) return { byIndex: empty };
    let parsed: { stories?: unknown };
    try {
      parsed = JSON.parse(txt);
    } catch {
      return { byIndex: empty, error: "gemini: unparseable json" };
    }
    const byIndex = new Map<number, string>();
    for (const r of (Array.isArray(parsed.stories) ? parsed.stories : []) as Record<string, unknown>[]) {
      const idx = Math.trunc(Number(r.venue_number)) - 1;
      const story = String(r.story ?? "").trim();
      if (!Number.isInteger(idx) || idx < 0 || idx >= jobs.length) continue;
      // Guard against padded non-answers and runaway essays.
      if (story.length < 60 || story.length > 700) continue;
      byIndex.set(idx, story);
    }
    return { byIndex };
  } catch (err) {
    return { byIndex: empty, error: err instanceof Error ? err.message : String(err) };
  }
}

Deno.serve(async (req) => {
  const reqUrl = new URL(req.url);
  const params = reqUrl.searchParams;
  const dryRun = !!params.get("dry_run");
  const limit = Number(params.get("limit") ?? "25");
  const offset = Number(params.get("offset") ?? "0");
  const chain = params.get("chain") === "1";
  const depth = Number(params.get("depth") ?? "0");
  const deadline = Date.now() + (depth > 0 ? BACKGROUND_DEADLINE_MS : RUN_DEADLINE_MS);
  const sb = supabaseAdmin();
  const report: unknown[] = [];
  const errors: unknown[] = [];
  let venuesScanned = 0;
  let proposalsCreated = 0;
  let geminiCalls = 0;
  let rateLimited = false;

  try {
    // Venues that still have no story and do have a website.
    const { data: venues } = await sb
      .from("venues")
      .select("id, name, website")
      .eq("is_fixture", false)
      .is("editorial_note", null)
      .not("website", "is", null)
      .order("name")
      .range(offset, offset + limit - 1);

    // Skip venues that already have a pending update proposal.
    const { data: pending } = await sb
      .from("venue_review_queue")
      .select("venue_id")
      .eq("status", "pending")
      .eq("action_type", "update");
    const busy = new Set((pending ?? []).map((p) => p.venue_id as string));

    // Phase 1 — read each venue's about/home text (concurrent, free).
    const jobs: Job[] = [];
    const list = (venues ?? []) as { id: string; name: string; website: string }[];
    const readVenue = async (v: { id: string; name: string; website: string }) => {
      venuesScanned += 1;
      if (busy.has(v.id)) {
        report.push({ venue: v.name, outcome: "skipped (proposal already waiting)" });
        return;
      }
      for (const path of CANDIDATE_PATHS) {
        const url = pageUrl(v.website, path);
        if (!url) continue;
        const html = await fetchPage(url);
        if (!html) continue;
        const text = htmlToText(html).slice(0, MAX_CHARS);
        if (text.length > 300) {
          jobs.push({ venue: v, text, url });
          return;
        }
      }
      report.push({ venue: v.name, outcome: "no readable page" });
    };
    for (let i = 0; i < list.length; i += 6) {
      await Promise.all(list.slice(i, i + 6).map(readVenue));
    }

    // Phase 2 — batched model calls, then file proposals with evidence.
    for (let i = 0; i < jobs.length; i += GEMINI_BATCH) {
      if (rateLimited || !GEMINI_KEY) break;
      if (Date.now() > deadline) break;
      const group = jobs.slice(i, i + GEMINI_BATCH);
      geminiCalls += 1;
      const g = await geminiStories(group, deadline);
      if (g.rateLimited) {
        rateLimited = true;
        if (g.error) errors.push({ where: "gemini quota", message: g.error });
      } else if (g.error) {
        errors.push({ where: "gemini", message: g.error });
      }
      for (let j = 0; j < group.length; j++) {
        const story = g.byIndex.get(j);
        if (!story) {
          report.push({ venue: group[j].venue.name, outcome: "no usable story" });
          continue;
        }
        if (dryRun) {
          proposalsCreated += 1;
          report.push({ venue: group[j].venue.name, story, outcome: "would propose" });
          continue;
        }
        const { error } = await sb.from("venue_review_queue").insert({
          venue_id: group[j].venue.id,
          action_type: "update",
          proposed_payload: { name: group[j].venue.name, editorial_note: story },
          evidence: [{ url: group[j].url, snippet: group[j].text.slice(0, 240), checked_at: new Date().toISOString() }],
          confidence: 0.7,
          reason: "Short profile written from the venue's own website - approve to publish it on the venue page.",
        });
        if (error) {
          // 23505 = an identical pending proposal already exists; benign.
          if (error.code === "23505") report.push({ venue: group[j].venue.name, outcome: "skipped (duplicate)" });
          else errors.push({ where: "insert", venue: group[j].venue.name, message: error.message });
          continue;
        }
        proposalsCreated += 1;
        report.push({ venue: group[j].venue.name, outcome: "proposed" });
      }
    }
  } catch (err) {
    errors.push({ where: "venue-stories", message: err instanceof Error ? err.message : String(err) });
  }

  const nextOffset = venuesScanned === limit ? offset + limit : null;
  let chained = false;
  if (chain && nextOffset !== null && depth < MAX_CHAIN_DEPTH) {
    const next = new URL(req.url);
    next.searchParams.set("offset", String(nextOffset));
    next.searchParams.set("depth", String(depth + 1));
    chained = true;
    const handoff = (async () => {
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
    what: "venue stories -> Owner Inbox (approve to publish)",
    gemini_model: GEMINI_MODEL,
    gemini_enabled: !!GEMINI_KEY,
    dry_run: dryRun,
    offset,
    next_offset: nextOffset,
    chaining: chained
      ? `yes - continuing at offset ${nextOffset} in the background`
      : chain
      ? "no - finished"
      : "off (add &chain=1 to walk every venue automatically)",
    venues_scanned: venuesScanned,
    proposals_created: proposalsCreated,
    gemini_calls: geminiCalls,
    rate_limited: rateLimited,
    errors,
    report,
  });
});
