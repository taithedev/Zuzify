// Same-origin Zuzify ID endpoint. The bot, not this function, verifies Neon JWTs
// and atomically consumes its one-time account-link challenge.
export const config = { runtime: "edge" };

const headers = {
  "cache-control": "no-store",
  "content-type": "application/json; charset=utf-8",
  "x-content-type-options": "nosniff",
  "referrer-policy": "no-referrer"
};
function reply(status, value) {
  return new Response(JSON.stringify(value), { status, headers });
}

export default async function handler(request) {
  if (request.method !== "POST") return reply(405, { error: "Method not allowed" });
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== new URL(request.url).origin) {
        return reply(403, { error: "Cross-site requests are not allowed" });
      }
    } catch { return reply(403, { error: "Invalid origin" }); }
  }

  const authorization = request.headers.get("authorization") || "";
  if (!/^Bearer [A-Za-z0-9._-]{20,8192}$/.test(authorization)) {
    return reply(401, { error: "Sign in to Zuzify and try again." });
  }

  let code;
  try {
    if (Number(request.headers.get("content-length") || 0) > 1024) {
      return reply(413, { error: "Pairing request is too large" });
    }
    const body = await request.json();
    code = typeof body?.code === "string" ? body.code.trim() : "";
  } catch { return reply(400, { error: "Invalid pairing request" }); }
  if (!/^[A-Za-z0-9]{8,128}$/.test(code)) {
    return reply(400, { error: "Enter the code shown by the Discord bot." });
  }

  const target = (process.env.BOT_LINK_API_URL || "").trim().replace(/\/+$/, "");
  let base;
  try {
    base = new URL(target);
    if (base.protocol !== "https:" || base.username || base.password || base.search || base.hash || base.pathname !== "/") {
      throw new Error("Invalid bot API origin");
    }
  } catch {
    return reply(503, { error: "Discord linking is not configured yet. The owner must set BOT_LINK_API_URL." });
  }

  try {
    const response = await fetch(new URL("/api/v1/link/complete", base), {
      method: "POST",
      headers: { "content-type": "application/json", authorization },
      body: JSON.stringify({ code }),
      redirect: "error",
      signal: AbortSignal.timeout(12000),
      cache: "no-store"
    });
    const data = await response.json().catch(() => ({}));
    if (response.ok && data?.ok === true) {
      return reply(200, { ok: true, service: data.service || "zuzify" });
    }
    const message = typeof data?.error === "string" && data.error.length <= 240 ? data.error : "";
    if (response.status === 404) {
      return reply(503, { error: "The Discord bot's public API is not attached to its hosting domain." });
    }
    return reply(response.status >= 400 && response.status < 500 ? response.status : 502, {
      error: message || "Discord could not verify this pairing code."
    });
  } catch {
    return reply(503, { error: "The Discord bot API is unavailable. Check the bot host's Domains and PORT settings." });
  }
}
