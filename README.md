# Starbase

Self-hosted, gamified health tracker. Your body is the ship; this is the ops console.
See [docs/PLAN.md](docs/PLAN.md) for the full design. This is **M1 (Skeleton)**:
auth, database schema, LCARS-inspired shell UI, PWA, Docker/Traefik deployment.
Food logging, XP engine and missions arrive in M2–M4.

## Stack

SvelteKit 2 (Svelte 5, TypeScript) · Node adapter · SQLite via Drizzle ORM (better-sqlite3) · argon2 sessions · Tailwind CSS v4 · @vite-pwa/sveltekit

## Development

```bash
npm install
cp .env.example .env          # edit values

# create your user (or set INITIAL_EMAIL/INITIAL_PASSWORD in .env)
node scripts/create-user.js steve@mcfly.uk 'your-password'

npm run dev                   # http://localhost:5173
```

Migrations in `drizzle/` are applied automatically on app startup. After changing
`src/lib/server/db/schema.ts`, regenerate with:

```bash
npm run db:generate
```

## Deployment (Docker + Traefik)

Assumes an existing Traefik instance on an external `proxy` network with a
`websecure` entrypoint and `letsencrypt` cert resolver (adjust labels in
`docker-compose.yml` to match your setup).

```bash
cp .env.example .env          # set SESSION_SECRET, SYNC_TOKEN, INITIAL_* etc.
docker compose up -d --build
```

The app listens on port 3000 behind Traefik at `https://starbase.mcfly.uk`.
The SQLite database persists in `./data/` on the host.

On first start, if no user exists and `INITIAL_EMAIL`/`INITIAL_PASSWORD` are set,
the user is created automatically. To create or reset later:

```bash
docker compose exec starbase node scripts/create-user.js steve@mcfly.uk 'new-password'
```

### Backups

Nightly cron on the host, e.g.:

```bash
sqlite3 ./data/starbase.db ".backup ./backups/starbase-$(date +%F).db"
```

## Project layout

```
src/lib/server/db/       Drizzle schema + connection (migrations auto-apply)
src/lib/server/auth.ts   argon2 password hashing + session cookies
src/hooks.server.ts      auth guard (everything except /login requires a session)
src/routes/              bridge dashboard, login, stub stations (reactor, hull, …)
drizzle/                 generated SQL migrations (committed)
scripts/create-user.js   create/reset the single user
```

*Not medical advice — sanity-check targets with your GP or diabetes care team.*
