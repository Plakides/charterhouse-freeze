# Charterhouse Freeze — Cloudflare receiver (Task 8E1)

This is the first online component of V2.

It is **leaderboard-only**. Student gameplay does not depend on this Worker.

## Endpoints

- `GET /health`
- `POST /sync`
- `GET /leaderboard`

## D1 binding

The Worker expects a D1 binding called:

`DB`

## Recommended setup: Cloudflare dashboard

This route avoids needing Node/npm on the school laptop.

1. Sign in to Cloudflare.
2. Create a D1 database called `charterhouse-freeze`.
3. Open its SQL console and run the contents of `schema.sql`.
4. Create a Worker called `charterhouse-freeze-leaderboard`.
5. Replace the default Worker code with `worker.js`.
6. Add the D1 database binding:
   - binding name: `DB`
   - database: `charterhouse-freeze`
7. Optional environment variable:
   - `ALLOWED_ORIGINS`
   - value: `https://plakides.github.io`
8. Deploy.

Cloudflare will give the Worker a public URL such as:

`https://charterhouse-freeze-leaderboard.<your-subdomain>.workers.dev`

Keep that URL. Task 8F will put it into the game config.

## Wrangler alternative

Cloudflare's current D1 CLI supports:

```bash
npx wrangler d1 create charterhouse-freeze --location apac
```

Copy the returned database ID into a copy of `wrangler.toml.example`
named `wrangler.toml`.

Then:

```bash
npx wrangler d1 execute charterhouse-freeze --remote --file=./schema.sql
npx wrangler deploy
```

## Idempotency / stale protection

Every team sends a monotonically increasing `seq`.

The database only accepts an update when:

`incoming seq > stored seq`

Therefore:
- sending the exact same event five times creates one team row
- a late/out-of-order old event cannot overwrite newer progress
- progress never decreases
- once a team is marked finished, it cannot be accidentally "un-finished"

## Privacy

The receiver accepts only leaderboard-safe fields:
- team ID
- generated team codename
- House
- completed count
- elapsed time
- finish state

It does not accept pupil names, session tokens, or puzzle answers.
