// send-push — sends an Expo push notification to every device a user has
// registered (push_tokens). Called directly by the client right after a
// message, follow or comment is written — fire-and-forget, never blocks the
// action that triggered it. Requires an authenticated caller (any signed-in
// user may notify another user that something happened; the token lookup
// and the Expo push call both run as the service role, since the caller
// has no access to someone else's tokens under RLS).
import { jsonResponse, supabaseAdmin } from "../_shared/pipeline.ts";

interface Payload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "POST only" }, 405);

  let payload: Payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, error: "invalid JSON body" }, 400);
  }
  if (!payload.user_id || !payload.title || !payload.body) {
    return jsonResponse({ ok: false, error: "user_id, title and body are required" }, 400);
  }

  const sb = supabaseAdmin();
  const { data: tokens, error } = await sb
    .from("push_tokens")
    .select("token")
    .eq("user_id", payload.user_id);
  if (error) return jsonResponse({ ok: false, error: error.message }, 500);
  if (!tokens || tokens.length === 0) return jsonResponse({ ok: true, sent: 0 });

  const messages = tokens.map((t: { token: string }) => ({
    to: t.token,
    title: payload.title,
    body: payload.body,
    data: payload.data ?? {},
    sound: "default",
  }));

  const resp = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(messages),
  });
  if (!resp.ok) {
    return jsonResponse({ ok: false, sent: 0, error: `Expo push ${resp.status}: ${await resp.text()}` }, 502);
  }
  const result = await resp.json();
  return jsonResponse({ ok: true, sent: messages.length, result });
});
