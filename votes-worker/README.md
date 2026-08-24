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

In `announcements.json` (repo root):

```json
{
  "voteEndpoint": "https://votes.bettertrumpet.com/vote",
  "resultsUrl": "https://votes.bettertrumpet.com/results",
  "announcements": [ ... ]
}
```

### Updating the feed (recommended: via the worker, no CDN lag)

The app reads the feed from `https://votes.bettertrumpet.com/feed`, served
from KV with `cache-control: no-store` — updates are instant, no GitHub raw
cache lag. After editing `announcements.json`, push it with a curl:

```bash
curl -X PUT https://votes.bettertrumpet.com/feed \
  -H "content-type: application/json" \
  -H "x-feed-key: <FEED_KEY>" \
  --data-binary @announcements.json
```

`FEED_KEY` is a Worker secret (`wrangler secret put FEED_KEY`). Without the
header the PUT is rejected (403).

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