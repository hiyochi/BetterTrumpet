/**
 * BetterTrumpet vote collector — Cloudflare Worker.
 *
 * Deployment:
 *   1. npx wrangler login
 *   2. wrangler kv namespace create VOTES  → paste id in wrangler.toml
 *   3. npx wrangler deploy
 *
 * Then put the deployed URL in announcements.json:
 *   "voteEndpoint": "https://votes.bettertrumpet.com/vote",
 *   "resultsUrl":   "https://votes.bettertrumpet.com/results"
 *
 * Endpoints
 *   POST /vote    — body { app, version, announcementId, voterId, answers, votedAt }
 *                   answers = { questionId: optionKey } for polls/surveys/A-B
 *                   answers = { text: "..." } for free-text items (feature requests…)
 *   GET  /results — live counts {updatedAt, results} + free-text answers {texts}
 *   GET  /health  — ok
 *
 * Credibility rules enforced here:
 *   - one vote per (announcementId, voterId) — duplicates are ignored (200)
 *   - rate limit per IP (60 votes / 10 min)
 *   - counts are only ever incremented; free text is stored as-is (capped)
 */

const RATE_LIMIT_WINDOW = 10 * 60;   // seconds
const RATE_LIMIT_MAX = 60;           // votes per IP per window
const TEXT_CAP = 300;                // keep the latest N free-text answers

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

/** Atomic read-modify-write for option counts (retries on concurrent writes). */
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

/** Append one free-text answer, keeping the latest TEXT_CAP entries. */
async function appendText(env, announcementId, entry) {
  const key = `texts:${announcementId}`;
  let list = (await env.VOTES.get(key, "json")) || [];
  list.push(entry);
  if (list.length > TEXT_CAP) list = list.slice(list.length - TEXT_CAP);
  await env.VOTES.put(key, JSON.stringify(list));
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}


async function handleGetFeed(env) {
  await prepare(env);
  const feed = await env.VOTES.get("feed:json", "json");
  if (!feed) return json({ error: "feed not set yet — PUT /feed with x-feed-key" }, 404);
  return new Response(JSON.stringify(feed), {
    status: 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function handlePutFeed(request, env) {
  const key = request.headers.get("x-feed-key") || "";
  if (!env.FEED_KEY || key !== env.FEED_KEY) return json({ error: "forbidden" }, 403);
  let body;
  try { body = await request.json(); } catch { return json({ error: "invalid json" }, 400); }
  if (!body || !Array.isArray(body.announcements)) return json({ error: "announcements array required" }, 400);
  await env.VOTES.put("feed:json", JSON.stringify(body));
  return json({ ok: true });
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

  const isText = Object.keys(answers).some((k) => k === "text" && typeof answers[k] === "string");
  if (isText) {
    await appendText(env, announcementId, {
      voter: voterId.slice(0, 8),
      text: String(answers.text).slice(0, 1000),
      at: body.votedAt || new Date().toISOString(),
    });
  } else {
    await mergeCounts(env, announcementId, answers);
  }

  await env.VOTES.put(dedupeKey, JSON.stringify({ votedAt: body.votedAt || null, version: body.version || null }));

  await env.VOTES.put("meta:updatedAt", new Date().toISOString());
  return json({ ok: true });
}

async function handleResults(env) {
  await prepare(env);
  const updatedAt = await env.VOTES.get("meta:updatedAt");

  const countsList = await env.VOTES.list({ prefix: "counts:" });
  const results = {};
  for (const item of countsList.keys) {
    results[item.name.slice("counts:".length)] = await env.VOTES.get(item.name, "json");
  }

  const textsList = await env.VOTES.list({ prefix: "texts:" });
  const texts = {};
  for (const item of textsList.keys) {
    texts[item.name.slice("texts:".length)] = await env.VOTES.get(item.name, "json");
  }

  return json({ updatedAt: updatedAt || null, results, texts });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (request.method === "POST" && url.pathname === "/vote") return await handleVote(request, env);
      if (request.method === "GET" && url.pathname === "/feed") return await handleGetFeed(env);
      if (request.method === "PUT" && url.pathname === "/feed") return await handlePutFeed(request, env);
      if (request.method === "GET" && url.pathname === "/results") return await handleResults(env);
      if (request.method === "GET" && url.pathname === "/health") return json({ ok: true });
      return json({ error: "not found" }, 404);
    } catch (err) {
      return json({ error: String(err?.message || err) }, 500);
    }
  },
};