# STARBASE — Design & Architecture Plan

A self-hosted, gamified health web app for Steve. Sci-fi starship theme, RPG progression, diet + exercise + habit tracking. Single user, Docker + Traefik homelab deployment.

**Status: approved — implementation in progress.**

---

## 1. Concept & Theme

You are a starfleet officer. **Your body is the ship.** The app is the ship's operations console (LCARS-inspired: dark background, warm amber/orange/lavender panels, rounded-rectangle blocks, monospace-adjacent display font).

Original naming to stay clear of trademarks: "inspired by" the aesthetic, no Star Trek names, insignia, or terms like "Starfleet"/"LCARS" in the UI. Working title: **Starbase** (ship name configurable, e.g. *ISV Endeavour*).

Ship systems map to health domains:

| Ship system | Health domain | Fed by |
|---|---|---|
| **Hull Integrity** | Body composition | Weight, waist, body-fat trends |
| **Reactor Core** | Metabolic health / diet | Food log vs calorie & macro targets |
| **Propulsion** | Exercise & movement | Workouts, steps, active minutes |
| **Life Support** | Habits & recovery | Sleep, hydration, custom habits, rest days |

Each system has a 0–100 "operational status" derived from recent behaviour (rolling 7–14 day window), not from absolute outcomes — you can't tank Hull Integrity by having a bad weigh-in, only by not logging/acting.

## 2. Game Design

### 2.1 XP economy

XP rewards **actions and consistency**, never outcomes like pounds lost. You can't grind XP by starving.

| Action | XP | Notes |
|---|---|---|
| Log a meal | 10 | Max 4/day rewarded |
| Complete food log for the day (all meals, within calorie band) | 40 | Requires ≥ calorie floor — undereating earns **0** |
| Log weight/waist measurement | 15 | Max 1/day; weekly waist |
| Exercise session (logged or synced) | 30–60 | Scaled by duration, capped daily |
| Hit step target | 25 | Target adaptive, see 2.4 |
| Complete a habit | 10 | Per habit, small set |
| Daily mission complete | 50 | |
| Weekly mission complete | 200 | |
| Story arc milestone | 500 | |

Hard cap: **~300 XP/day** from repeatable actions. Consistency bonuses (streaks) add on top but are modest, so one perfect day never outweighs a steady week.

### 2.2 Levels & ranks

Level curve: `XP to next level = 500 × level^1.3` (rounded). Ranks at level bands: Cadet 1–4, Ensign 5–9, Sub-Lieutenant 10–14, Lieutenant 15–24, Lt. Commander 25–34, Commander 35–49, Captain 50–69, Commodore 70–89, Fleet Admiral 90+. Rank-ups unlock cosmetic ship upgrades (console skins, ship class names) — visible reward, zero gameplay pressure.

### 2.3 Missions

- **Daily patrols** (auto-generated, pick 3 of ~5 offered): "Log all meals", "20-minute away mission (walk)", "Hydration check ×6", "Bridge report (weigh-in)".
- **Weekly directives**: "Complete 4 exercise sessions", "Stay within calorie band 5 of 7 days", "Log waist measurement".
- **Story arcs** (4–8 week seasons): light narrative frame — e.g. *"Restore the Reactor"*: progressive diet-consistency goals over 6 weeks with chapter unlocks. Arcs target sustainable change (e.g. average 7-day deficit of ~300–500 kcal), never aggressive cuts.

### 2.4 Anti-cheese / health-safe design

- **Calorie floor**: daily food-log XP requires intake ≥ configurable floor (default ~1,500 kcal). Days under earn zero diet XP with a gentle "Reactor running under minimum safe output" notice.
- **Deficit band, not "less is better"**: target is a band (floor → TDEE−300); XP identical anywhere in band.
- **Streak shields, no streak loss**: each 7-day streak earns a shield (bank up to 3) that absorbs a missed day. Losing all shields drops streak by a tier, never to zero. No XP deductions, ever.
- **Mandatory rest days**: Propulsion XP has diminishing returns after 6 active days/week; a logged rest day scores full Life Support XP.
- **Adaptive, capped targets**: step/exercise targets adjust from trailing 2-week average, capped +10%/week with a ceiling.
- **Trend over datapoint**: weight/waist shown as 7-day EMA; no XP tied to the number moving.
- **No leaderboards, no time pressure.**

## 3. Features by Phase

### MVP (v1)
Auth; OFF food search + barcode scan; portions, recents/favourites, custom foods; daily dashboard (calories/macros vs band, ship-systems panel); weight/waist logging with trends; manual exercise + steps; XP/levels/ranks/daily patrols/streak shields; installable PWA, LCARS-inspired dark UI; Replicator meal template library (§10).

### v2
Weekly directives + first story arc; habits engine (hydration, sleep); wearable data via HA bridge or CSV; meal templates & copy-yesterday; weekly "Captain's Log" report; cosmetic unlocks.

### v3
Health Connect companion sync; story seasons; commendations; local OFF cache; data export/backups.

## 4. Data Model Sketch (SQLite)

```
users            id, email, password_hash, settings_json (calorie floor/band, targets, ship name)
foods            id, source ('off'|'custom'), barcode, name, brand, kcal_100g,
                 protein_g, carbs_g, fat_g, fibre_g, serving_sizes_json, cached_at
food_logs        id, user_id, food_id (nullable), template_id (nullable), logged_at,
                 meal ('breakfast'|...), qty_g, kcal, macros...
measurements     id, user_id, taken_at, type ('weight'|'waist'|...), value, unit
activities       id, user_id, started_at, type, duration_min, intensity, kcal_est,
                 source ('manual'|'sync'), external_id
daily_metrics    id, user_id, date, steps, active_minutes, sleep_min, resting_hr, source
habits           id, user_id, name, icon, schedule_json, active
habit_logs       id, habit_id, date, completed
missions         id, template_id, user_id, type ('daily'|'weekly'|'arc'), state,
                 progress_json, starts_at, ends_at
mission_templates id, type, title, flavour_text, criteria_json, xp
xp_events        id, user_id, at, amount, reason, ref_type, ref_id   -- append-only ledger
streaks          id, user_id, kind, current, best, shields, updated_at
meal_templates   id, user_id (null = seed), name, meal_type, tags_json,
                 kcal, protein_g, carbs_g, fat_g, fibre_g, servings,
                 method_text, flavour_text, source_url (nullable), active
```

XP is an append-only ledger; level/rank derived. `foods` doubles as an OFF cache. Logging a template writes a normal `food_logs` row.

## 5. Architecture & Stack

**SvelteKit 2 (Svelte 5) + Node adapter, SQLite via Drizzle ORM (better-sqlite3), Tailwind CSS v4, PWA via @vite-pwa/sveltekit.** One container, one process, one DB file. Auth: argon2 password → session cookie. Charts: LayerChart or uPlot wrapper. All Open Food Facts calls proxy through the server (caching, single User-Agent, no CORS).

```
[Galaxy S26 PWA / desktop browser] → HTTPS → [Traefik] → [SvelteKit node container] → /data/starbase.db
                                                                 └→ Open Food Facts API (server-side, cached)
```

## 6. Food Database & Barcode Scanning

- OFF barcode: `GET https://world.openfoodfacts.org/api/v2/product/{barcode}?fields=product_name,brands,nutriments,serving_size` (free, no key).
- OFF text search: Search-a-licious (`search.openfoodfacts.org`), v1 `cgi/search.pl` fallback. Rate limit ~10/min on search → server proxy, cache into `foods`, debounce, favourites first.
- Scanning: native `BarcodeDetector` (Chrome/Android) with `barcode-detector` WASM ponyfill fallback. EAN-13/EAN-8/UPC. Needs HTTPS.
- Custom foods + quick-add kcal for gaps.

## 7. Wearable Data Strategy (Galaxy Watch8 Ultra)

Health Connect is on-device only — no cloud API; Google Fit REST API is dead; Samsung partner API enterprise-gated. Phased bridges: (A) manual entry [MVP]; (B) Health Connect → Home Assistant sync app → Starbase pulls HA REST API or receives webhook [v2]; (C) Health Sync → Fitbit Web API (cloud dependency, fallback); (D) Samsung Health CSV export (backfill); (E) custom companion Android app → Starbase webhook [v3]. MVP ships a token-auth import endpoint `POST /api/sync/daily-metrics` that all bridges reuse.

## 8. Deployment

```yaml
services:
  starbase:
    image: starbase:latest
    container_name: starbase
    restart: unless-stopped
    environment:
      - DATABASE_PATH=/data/starbase.db
      - ORIGIN=https://starbase.mcfly.uk
      - SESSION_SECRET=${SESSION_SECRET}
      - SYNC_TOKEN=${SYNC_TOKEN}
      - OFF_USER_AGENT=Starbase/1.0 (steve@mcfly.uk)
    volumes:
      - ./data:/data
    networks: [proxy]
    labels:
      - traefik.enable=true
      - traefik.http.routers.starbase.rule=Host(`starbase.mcfly.uk`)
      - traefik.http.routers.starbase.entrypoints=websecure
      - traefik.http.routers.starbase.tls.certresolver=letsencrypt
      - traefik.http.services.starbase.loadbalancer.server.port=3000

networks:
  proxy:
    external: true
```

Backups: nightly `sqlite3 .backup` cron or Litestream. Adjust names to existing Traefik setup.

## 9. Build Roadmap

M1 Skeleton (SvelteKit + Drizzle + auth + Docker/Traefik + LCARS shell) → M2 Food ops (OFF search/barcode, logging, calorie band, Replicator seed library) → M3 Body & motion (measurements, trends, exercise/steps) → M4 Game layer (XP ledger, ranks, patrols, shields = MVP) → M5 v2 → M6 v3.

MVP done = scan a sandwich, log a walk, weigh in, level up — from the phone, over HTTPS, in under a minute a day.

## 10. Meal Library — "Replicator Database"

Curated seed library of ~75 diabetes-friendly meal templates (macros from USDA/OFF ingredient data), tagged `low-gi`, `high-fibre`, `high-protein`, `quick`, `batch-cook`, meal type, `veggie`, `visceral-cut`. "Replicator" tab with tag filters; mission-linked suggestions; one-tap logging to `food_logs`; extendable (add own patterns, promote logged meals). Recipe APIs rejected (Edamam link-out only; Spoonacular ToS/storage/$29-mo; Tasty weak nutrition; NHS/Diabetes UK copyrighted → link out only). Phasing: seed library + tab in MVP (M2); suggestions/promote in v2; optional Edamam link-out browse in v3.

### 10.5 Visceral fat guidance (summary)

No food/drink burns visceral fat quickly; it responds to sustained deficit + activity (and is typically first to shrink). Evidence-backed: Mediterranean-style pattern (DIRECT-PLUS RCT: ~doubled visceral loss at same calories), soluble fibre, adequate protein (~1.2–1.6 g/kg), limited refined carbs/added sugar, combined resistance + aerobic exercise. Drinks: water/unsweetened tea/coffee fine; green tea evidence modest; sugar-sweetened beverages and alcohol strongly linked to visceral fat (top two cuts); diet drinks acceptable transition tool. App integration: `visceral-cut` tag on ≥60% of seed patterns; Hydration Bay panel (Life Support) with drinks guidance + water/tea habit ticks; optional weekly directives ("zero sugary drinks this week", alcohol reduction with user-set caps, nudged down slowly). No fat-burner framing, no XP multipliers for restriction.

---

*Note: this is a self-tracking tool, not medical advice. Calorie/activity targets should be sanity-checked with Steve's GP or diabetes care team.*
