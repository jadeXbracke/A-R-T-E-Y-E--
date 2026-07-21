// enrich-images — weekly press-image pass for the agenda.
//
// For current/upcoming exhibitions that have no image yet, find the venue's
// own page for the show (Claude + web search), then read that page's
// og:image — the press image the venue itself publishes for sharing. That is
// exactly the editorial-use image galleries put out with a show, so using it
// to announce the show, with a stored source link, is the honest version of
// "press photos in the agenda".
//
// Deviation from "propose, never apply", agreed with the owner: the image is
// written directly — but ONLY where image_url is still null, never over a
// host- or venue-supplied image, and image_source records where it came from
// so the host can audit or clear it in the admin editor at any time.
import {
  addUsageCost,
  anthropic,
  finishRun,
  isDryRun,
  jsonResponse,
  MAX_CLAUDE_CALLS_PER_RUN,
  MODEL,
  newRunLog,
  startRun,
  supabaseAdmin,
} from "../_shared/pipeline.ts";

const BATCH_SIZE = 12;
const FETCH_TIMEOUT_MS = 10_000;

const PAGE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["page_url", "confidence"],
  properties: {
    page_url: {
      type: ["string", "null"],
      description:
        "URL of a page clearly about THIS exhibition — the venue's own site preferred, Ocula/Art Guide Australia acceptable. null if none found.",
    },
    confidence: { type: "number", description: "0..1" },
  },
} as const;

interface PageAnswer {
  page_url: string | null;
  confidence: number;
}

function extractOgImage(html: string): string | null {
  const metaTags = html.match(/<meta[^>]+>/gi) ?? [];
  for (const key of ["og:image:secure_url", "og:image", "twitter:image"]) {
    for (const tag of metaTags) {
      if (!new RegExp(`["'](?:${key})["']`, "i").test(tag)) continue;
      const content = /content=["']([^"']+)["']/i.exec(tag);
      if (content && /^https:\/\//i.test(content[1])) return content[1];
    }
  }
  return null;
}

async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctl.signal, redirect: "follow" });
  } finally {
    clearTimeout(t);
  }
}

Deno.serve(async (req) => {
  const dryRun = await isDryRun(req);
  const sb = supabaseAdmin();
  const run = newRunLog("enrich");
  const runId = await startRun(sb, run);
  const today = new Date().toISOString().slice(0, 10);
  const applied: Record<string, string> = {};

  const { data: shows, error } = await sb
    .from("exhibitions")
    .select("id, title, artists, end_date, venue:venues(id, name, website)")
    .eq("status", "approved")
    .eq("is_fixture", false)
    .is("image_url", null)
    .gte("end_date", today)
    .order("end_date")
    .limit(BATCH_SIZE);
  if (error) {
    run.errors.push({ where: "select exhibitions", message: error.message });
    await finishRun(sb, runId, run);
    return jsonResponse({ ok: false, error: error.message }, 500);
  }

  const ai = anthropic();
  for (const show of shows ?? []) {
    if (run.claude_calls >= MAX_CLAUDE_CALLS_PER_RUN) {
      run.errors.push({ where: "budget", message: "call cap reached — remaining shows next run" });
      break;
    }
    run.venues_checked += 1; // counts shows checked on this run type
    try {
      const venue = show.venue as { id: string; name: string; website: string | null } | null;
      run.claude_calls += 1;
      const response = await ai.messages.create({
        model: MODEL,
        max_tokens: 2048,
        thinking: { type: "adaptive" },
        tools: [{ type: "web_search_20260209", name: "web_search", max_uses: 3 }],
        output_config: { format: { type: "json_schema", schema: PAGE_SCHEMA } },
        messages: [{
          role: "user",
          content:
            `Find the official web page for the exhibition "${show.title}" by ${show.artists} ` +
            `at ${venue?.name ?? "a gallery"} in Sydney, Australia` +
            (venue?.website ? ` (venue website: ${venue.website})` : "") +
            `. Prefer a page on the venue's own domain. Ocula or Art Guide Australia are acceptable ` +
            `fallbacks. Only return a URL that is clearly about this specific exhibition; otherwise null.`,
        }],
      });
      addUsageCost(run, response.usage);
      const text = response.content.find((b) => b.type === "text");
      if (!text || text.type !== "text") continue;
      const answer = JSON.parse(text.text) as PageAnswer;
      if (!answer.page_url || answer.confidence < 0.6) continue;

      const page = await fetchWithTimeout(answer.page_url);
      if (!page.ok) continue;
      const imageUrl = extractOgImage(await page.text());
      if (!imageUrl) continue;

      // the image itself must actually resolve to an image
      const head = await fetchWithTimeout(imageUrl, { method: "HEAD" });
      if (!head.ok || !(head.headers.get("content-type") ?? "").startsWith("image/")) continue;

      if (!dryRun) {
        const { error: upErr } = await sb
          .from("exhibitions")
          .update({ image_url: imageUrl, image_source: answer.page_url })
          .eq("id", show.id)
          .is("image_url", null); // never race over a host upload
        if (upErr) {
          run.errors.push({ where: show.title, message: upErr.message });
          continue;
        }
      }
      run.proposals_created += 1; // counts images applied on this run type
      applied[show.title] = imageUrl;
    } catch (err) {
      run.errors.push({ where: show.title, message: err instanceof Error ? err.message : String(err) });
    }
  }

  await finishRun(sb, runId, run);
  return jsonResponse({
    ok: true,
    dry_run: dryRun,
    shows_checked: run.venues_checked,
    images_applied: run.proposals_created,
    applied,
    claude_calls: run.claude_calls,
    cost_estimate: Number(run.cost_estimate.toFixed(4)),
    errors: run.errors,
  });
});
