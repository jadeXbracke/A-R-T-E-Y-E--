// queue-digest — weekly. One digest email when proposals are waiting;
// never per-item notifications, silent when the queue is empty.
// Requires env: RESEND_API_KEY, DIGEST_TO (owner's email), DIGEST_FROM.
import { jsonResponse, supabaseAdmin } from "../_shared/pipeline.ts";

Deno.serve(async (_req) => {
  const sb = supabaseAdmin();
  const { count, error } = await sb
    .from("venue_review_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) return jsonResponse({ ok: false, error: error.message }, 500);
  if (!count) return jsonResponse({ ok: true, pending: 0, sent: false });

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const to = Deno.env.get("DIGEST_TO");
  if (!apiKey || !to) {
    return jsonResponse({ ok: false, pending: count, sent: false, error: "RESEND_API_KEY / DIGEST_TO not configured" }, 500);
  }

  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      from: Deno.env.get("DIGEST_FROM") ?? "ART EYE <onboarding@resend.dev>",
      to: [to],
      subject: `ART EYE: ${count} venue update${count === 1 ? "" : "s"} waiting for review`,
      text:
        `There ${count === 1 ? "is 1 proposal" : `are ${count} proposals`} waiting in your Owner Inbox.\n\n` +
        `Open ART EYE → Curator → Host Control → Owner Inbox to review and approve or reject them.\n` +
        `Nothing changes in the app until you decide.`,
    }),
  });
  if (!resp.ok) {
    return jsonResponse({ ok: false, pending: count, sent: false, error: `Resend ${resp.status}: ${await resp.text()}` }, 500);
  }
  return jsonResponse({ ok: true, pending: count, sent: true });
});
