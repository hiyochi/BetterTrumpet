/**
 * BetterTrumpet vote collector — Cloudflare Worker.
 *
 * Deployment:
 *   1. `npm i -g wrangler` (or use npx), run `wrangler login`
 *   2. Create a KV namespace, then in wrangler.toml set:
 *        KV_NAMESPACE_ID = "<your namespace id>"
 *   3. `wrangler deploy`
 *
 * Then put the deployed URL in announcements.json:
 *   "voteEndpoint": "https://bettertrumpet-votes.<you>.workers.dev/vote",
 *   "resultsUrl":   "https://bettertrumpet-votes.<you>.workers.dev/results"
 *
 * Endpoints
 *   POST /vote   — body { app, version, announcementId, voterId, answers, votedAt }
 *   GET  /results— live aggregated counts + updatedAt
 *   GET  /health — ok
 *
 * Credibility rules enforced here:
 *   - one vote per (announcementId, voterId) — duplicates are ignored (200)
 *   - rate limit per IP (60 votes / 10 min)
 *   - counts are only ever incremented, never hand-edited
 */

const RATE_LIMIT_WINDOW = 10 * 60;   // seconds
const RATE_LIMIT_MAX = 60;           // votes per IP per window

async function prepare(env) {
  if (typeof env.VOTES !== "object" || !env.VOTES.get) {
    throw new Error("Missing KV binding 'VOTES'. Add it to wrangler.toml.");
  }
}

/** Normalize a question map to { optionKey: count }. */
function tallyByQuestion(answers, existing) {
  const out = existing ? { ...existing } : {};
  for (const [questionId, optionKey] of Object.entries(answers || {})) {
    const opt = String(optionKey ?? "");
    if (!opt) continue;
    out[questionId] = { ...(out[questionId] || {}), [opt]: (out[questionId]?.[opt] || 0) + 1 };
  }
  return out;
}

/** Recursive KV put with the atomic-merge style the platforms expect. */
async function mergeCounts(env, announcementId, answers) {
  const key = `counts:${announcementId}`;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const existing = await env.VOTES.get(key, "json");
    const next = tallyByQuestion(answers, existing);
    try {
      await env.VOTES.put(key, JSON.stringify(next));
      return;
    } catch {
      // retry on concurrent write
    }
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function handleVote(request, env) {
  await prepare(env);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  const { announcementId, voterId, answers } = body || {};
  if (!announcementId || !voterId || !answers || typeof answers !== "object") {
    return json({ error: "announcementId, voterId and answers are required" }, 400);
  }

  // Rate limit per IP (works behind Cloudflare: cf-connecting-ip).
  const ip = request.headers.get("cf-connecting-ip") || "unknown";
  const windowKey = Math.floor(Date.now() / 1000 / RATE_LIMIT_WINDOW);
  const rateKey = `rate:${windowKey}:${ip}`;
  const current = Number((await env.VOTES.get(rateKey)) || 0);
  if (current >= RATE_LIMIT_MAX) {
    return json({ error: "rate limited" }, 429);
  }
  await env.VOTES.put(rateKey, String(current + 1), { expirationTtl: RATE_LIMIT_WINDOW });

  // One vote per (announcementId, voterId) — first one wins.
  const dedupeKey = `vote:${announcementId}:${voterId}`;
  const existingVote = await env.VOTES.get(dedupeKey);
  if (existingVote) {
    return json({ ok: true, duplicate: true });
  }

  await mergeCounts(env, announcementId, answers);
  await env.VOTES.put(dedupeKey, JSON.stringify({ votedAt: body.votedAt || null, version: body.version || null }));

  await env.VOTES.put("meta:updatedAt", new Date().toISOString());
  return json({ ok: true });
}

async function handleResults(env) {
  await prepare(env);
  const updatedAt = await env.VOTES.get("meta:updatedAt");
  const list = await env.VOTES.list({ prefix: "counts:" });
  const results = {};
  for (const item of list.keys) {
    const id = item.name.slice("counts:".length);
    results[id] = await env.VOTES.get(item.name, "json");
  }
  return json({ updatedAt: updatedAt || null, results });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/vote") return await handleVote(request, env);
      if (request.method === "GET" && url.pathname === "/results") return await handleResults(env);
      if (request.method === "GET" && url.pathname === "/health") return json({ ok: true });
      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err?.message || err) }, 500);
    }
  },
};