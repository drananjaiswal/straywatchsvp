# StrayWatch SVP

**Report It. Map It. Act on It.**

Crowdsourced stray dog density heatmap for Sri Vijaya Puram (Port Blair), Andaman & Nicobar Islands — 24 municipal wards, anonymous reporting, no login required.

> **Disclaimer:** Sightings are citizen-reported and unverified. This platform is a public awareness tool and civic pressure instrument. Data is indicative only and does not represent an official Animal Husbandry Department census.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Maps | Leaflet.js + OpenStreetMap + leaflet-heat (CDN) |
| Backend | Supabase (Postgres + Realtime) |
| Ward detection | Turf.js (point-in-polygon) |
| Geocoding | Nominatim (OSM, no API key) |
| PWA | vite-plugin-pwa (Workbox) |
| Hosting | Vercel |

---

## Setup

### 1. Clone and install

```bash
git clone https://github.com/your-org/straywatchsvp.git
cd straywatchsvp
npm install
```

### 2. Create Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, run the contents of `supabase/migration.sql` in full.
3. Verify in Table Editor that `sightings` and `wards` tables exist and all 24 ward rows are seeded.
4. Copy your **Project URL** and **anon/public key** from: Project Settings → API.

> Note: Also add the `increment_corroboration` Postgres function if using the corroborate RPC:
> ```sql
> create or replace function increment_corroboration(sighting_id uuid)
> returns void language sql security definer as $$
>   update sightings set corroborations = corroborations + 1 where id = sighting_id;
> $$;
> ```

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

These are Vite client env vars, so the `VITE_` prefix is required.

No other variables are needed.

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

### 5. Build for production

```bash
npm run build
npm run preview
```

---

## Deployment to Vercel

### Option A: Vercel CLI

```bash
npm install -g vercel
vercel --prod --yes
```

Add environment variables when prompted, or set them in the Vercel dashboard.

### Option B: Git deploy

1. Push to GitHub.
2. Import project at [vercel.com](https://vercel.com).
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in project settings → Environment Variables.
4. Deploy.

### Rate limiting note

`vercel.json` includes rate limit headers for the `/api/*` path. Edge-level rate limiting (capping submissions at 5 per IP per hour) requires **Vercel Pro plan**. On the Hobby plan, rate limiting falls back to the Postgres `dedupe_hash` unique constraint and Supabase RLS policies only — which is sufficient for a civic-scale deployment.

---

## PWA — Install as App

StrayWatch SVP is installable as a Progressive Web App. Once installed, it loads from cache when offline and shows a banner indicating cached data is being displayed.

| Platform | Instructions |
|---|---|
| Android (Chrome) | Tap ⋮ menu → "Add to Home screen" |
| iPhone (Safari) | Tap Share icon → "Add to Home Screen" |
| Desktop Chrome/Edge | Click the install icon (⊕) in the address bar |

OSM map tiles are cached for 7 days (CacheFirst). Supabase API responses use NetworkFirst with a 5-second timeout fallback to cache.

---

## Data Integrity

### Deduplication

Each sighting generates a `dedupe_hash` in Postgres — a MD5 hash of a delimiter-separated bucket made from the rounded coordinates (3 decimal places ≈ 100 m) and the truncated hour of submission. A trigger populates this column on insert/update for compatibility with Postgres timestamp immutability rules, and a UNIQUE constraint silently rejects duplicate submissions from the same approximate location within the same clock hour. The reporter sees a friendly message, no new row is inserted, and the existing sighting is not modified.

### Corroboration

Residents can tap "I also see strays in Ward N" on ward cards without filing a new sighting. This increments a `corroborations` counter. localStorage prevents double-tapping from the same device on the same day. Corroborations supplement sighting counts as a passive validation signal.

### Admin controls

The same app includes an `/admin` route protected by Supabase Auth magic-link sign-in. Approved admin emails stored in the `admin_users` table can soft-clear the heatmap by hiding all sightings, then restore them later without deleting history. Admin actions are logged in `admin_actions`.

### Rate limiting

Vercel edge rate limiting (Pro plan) caps submissions at 5 per IP per hour. On Hobby plan, the Postgres dedupe constraint is the primary guard.

### Disclaimer policy

The platform displays a persistent, dismissible disclaimer on all public-facing pages stating that data is citizen-reported, unverified, and indicative only. This disclaimer is stored in the `About` page and `DisclaimerBanner` component.

---

## Ward boundaries

Place the official ward boundary GeoJSON file at `public/ward-boundaries.geojson`. The GeoJSON must include `ward_id` (integer 1–24) and `ward_name` (string) as feature properties. Until this file is added, ward detection falls back to nearest-centroid distance using hardcoded Port Blair ward centroids in `src/lib/wardDetect.js`.

---

## License

MIT — Built for the people and animals of Sri Vijaya Puram.
