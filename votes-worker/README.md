# BetterTrumpet votes collector

A tiny Cloudflare Worker that receives BetterTrumpet votes, dedupes them and
serves live results. No server to manage, free tier.

## Deploy (≈20 min)

1. Install the CLI and log in:

   ```bash
   npm i -g wrangler
   wrangler login
   ```

2. Create a KV namespace and copy its id:

   ```bash
   wrangler kv:namespace create VOTES
   # => id = <hex id>
   ```

3. Paste the id into `wrangler.toml` (`KV_NAMESPACE_ID`).

4. Deploy:

   ```bash
   wrangler deploy
   ```

   You get a URL like `https://bettertrumpet-votes.<your-subdomain>.workers.dev`.

## Wire it to the app

In `announcements.json` (repo root, pushed to GitHub):

```json
{
  "voteEndpoint": "https://<your-worker>.workers.dev/vote",
  "resultsUrl": "https://<your-worker>.workers.dev/results",
  "announcements": [ ... ]
}
```

- **`voteEndpoint`** — where votes are POSTed (`{app, version, announcementId,
  voterId, answers, votedAt}`). `voterId` is a salted HMAC of the per-install
  id, so the collector can dedupe but never link votes to a person.
- **`resultsUrl`** — where the app fetches live totals (`{updatedAt, results}`).
  When set, the What's new page shows the real totals with a **Live** badge.
  When empty, the app falls back to the counts embedded in the feed items
  (owner-maintained) — useful while testing without the worker.

## Credibility rules (enforced server-side)

- **1 vote per (announcementId, voterId)** — duplicates are ignored, first
  vote wins. Combined with the local `PollVote` store, one install = one vote
  per announcement.
- **Rate limit** — 60 votes / 10 min per IP (Cloudflare `cf-connecting-ip`).
- **Counts are only incremented** — the totals served by `/results` are built
  by this worker; nobody edits them by hand.

## Endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/vote` | Record a vote |
| GET | `/results` | Live counts + `updatedAt` |
| GET | `/health` | Liveness check |

## Notes

- Results update as fast as the app's next poll (startup +10 s, then every 6 h
  and on window open).
- KV is eventually consistent; under heavy concurrent votes the retry loop in
  `mergeCounts` absorbs read-modify-write races.
- This worker receives no personal data: no names, no emails, no IPs are
  stored (IP is only used for the in-memory rate-limit window key).