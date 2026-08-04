// review-exhibitions — a tiny admin page, served straight from an Edge
// Function, to review the exhibition_review_queue from any browser (iPad
// friendly: big tap targets, no SQL). Approve inserts the real exhibition
// (same fields as the approve_exhibition_proposal RPC); reject just marks
// the row. Protected by a shared secret: set ADMIN_TOKEN and open
//   /review-exhibitions?token=YOUR_TOKEN
// Self-contained on purpose so it can be pasted into the dashboard editor.
import { createClient } from "npm:@supabase/supabase-js@2";

const TOKEN = Deno.env.get("ADMIN_TOKEN") ?? "";

function sb() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));

function page(body: string, status = 200): Response {
  const html = `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>ART EYE — Review</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; margin: 0; }
  body { font-family: "Helvetica Neue", Arial, sans-serif; background:#fff; color:#000;
         max-width: 720px; margin: 0 auto; padding: 24px 16px 80px; }
  h1 { font-size: 15px; letter-spacing: .35em; text-transform: uppercase; margin: 8px 0 4px; }
  .sub { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; margin-bottom: 24px; }
  .card { border-top: 1px solid #000; padding: 16px 0 20px; }
  .venue { font-size: 11px; letter-spacing: .18em; text-transform: uppercase; margin-bottom: 6px; }
  .title { font-size: 19px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; line-height: 1.25; }
  .meta { font-size: 13px; margin-top: 6px; line-height: 1.5; }
  .desc { font-size: 13px; margin-top: 8px; line-height: 1.5; }
  a { color: #000; }
  .row { display: flex; gap: 10px; margin-top: 14px; }
  button { flex: 1; font: inherit; font-size: 13px; letter-spacing: .15em; text-transform: uppercase;
           padding: 14px 10px; border: 1px solid #000; background: #fff; color: #000; }
  button.ok { background: #000; color: #fff; }
  .empty { padding: 40px 0; font-size: 14px; }
  .note { font-size: 11px; margin-top: 6px; color: #000; }
</style></head><body>${body}</body></html>`;
  return new Response(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

const fmt = (d: string | null) => (d ? d : "—");

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") ?? "";

  if (!TOKEN) {
    return page(`<h1>ARTEYE</h1><p class="empty">Set the <b>ADMIN_TOKEN</b> secret first
      (Edge Functions → Secrets), then open ?token=YOUR_TOKEN.</p>`, 500);
  }
  if (token !== TOKEN) {
    return page(`<h1>ARTEYE</h1><p class="empty">Wrong or missing token.
      Open this page as ?token=YOUR_TOKEN.</p>`, 401);
  }

  const db = sb();
  const back = `${url.pathname}?token=${encodeURIComponent(token)}`;

  if (req.method === "POST") {
    const form = await req.formData();
    const id = String(form.get("id") ?? "");
    const action = String(form.get("action") ?? "");
    if (id && (action === "approve" || action === "reject")) {
      const { data: q } = await db
        .from("exhibition_review_queue")
        .select("*")
        .eq("id", id)
        .eq("status", "pending")
        .single();
      if (q) {
        if (action === "approve") {
          // Mirrors approve_exhibition_proposal() — the RPC needs an auth'd
          // admin, but this page already gates on ADMIN_TOKEN.
          const today = new Date().toISOString().slice(0, 10);
          const { error } = await db.from("exhibitions").insert({
            venue_id: q.venue_id,
            title: q.title,
            artists: q.artists ?? "",
            start_date: q.start_date ?? today,
            end_date: q.end_date ?? today,
            description: q.description ?? "",
            image_source: q.source_url,
            status: "approved",
            is_featured: false,
            city: "Sydney",
          });
          if (!error) {
            await db.from("exhibition_review_queue")
              .update({ status: "approved", reviewed_at: new Date().toISOString() })
              .eq("id", id);
          }
        } else {
          await db.from("exhibition_review_queue")
            .update({ status: "rejected", reviewed_at: new Date().toISOString() })
            .eq("id", id);
        }
      }
    }
    return new Response(null, { status: 303, headers: { Location: back } });
  }

  const { data: rows } = await db
    .from("exhibition_review_queue")
    .select("id, title, artists, start_date, end_date, description, source_url, confidence, venues(name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (rows ?? []) as unknown as {
    id: string; title: string; artists: string; start_date: string | null;
    end_date: string | null; description: string; source_url: string | null;
    confidence: number; venues: { name: string } | null;
  }[];

  const cards = items.map((r) => `
    <div class="card">
      <div class="venue">${esc(r.venues?.name)}</div>
      <div class="title">${esc(r.title)}</div>
      <div class="meta">${esc(r.artists) || ""}</div>
      <div class="meta">${fmt(r.start_date)} → ${fmt(r.end_date)}</div>
      ${r.description ? `<div class="desc">${esc(r.description)}</div>` : ""}
      ${r.source_url ? `<div class="note"><a href="${esc(r.source_url)}" target="_blank" rel="noreferrer">Bron bekijken ↗</a></div>` : ""}
      <form class="row" method="post" action="${esc(back)}">
        <input type="hidden" name="id" value="${esc(r.id)}">
        <button class="ok" name="action" value="approve">✓ Goedkeuren</button>
        <button name="action" value="reject">✗ Afwijzen</button>
      </form>
    </div>`).join("");

  return page(`
    <h1>ARTEYE</h1>
    <div class="sub">Review — ${items.length} voorstel${items.length === 1 ? "" : "len"} in de wachtrij</div>
    ${cards || `<p class="empty">Niets te beoordelen. Draai de motor om nieuwe expo's op te halen, of kom later terug.</p>`}
  `);
});
