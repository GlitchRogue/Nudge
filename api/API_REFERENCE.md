# EventPilot — API Keys & Scrapers

Working reference for the hackathon. Keep private — do not commit.

**Account:** `nudge485@gmail.com` (and `dl5433@nyu.edu` for NYU-side signups)
**As of:** 2026-04-25

---

## 1. Active API Keys

### Anthropic Claude
- **Use:** LLM reasoning + tool-use loops (default `claude-sonnet-4-6`)
- **Plan:** Evaluation tier — low-volume only; add credits before heavy usage
- **Env var:** `ANTHROPIC_API_KEY`
- **Key:**
  ```
  <ANTHROPIC_API_KEY_REDACTED>
  ```
- **Dashboard:** https://platform.claude.com/settings/keys

---

### Firecrawl
- **Use:** Scrape engage.nyu.edu, wasserman.nyu.edu, and arbitrary event pages → markdown for Claude
- **Plan:** Free — 500 pages/mo + 100 bonus credits
- **Env var:** `FIRECRAWL_API_KEY`
- **Key:** `<FIRECRAWL_KEY_REDACTED>`
- **Auth header:** `Authorization: Bearer <FIRECRAWL_KEY_REDACTED>`
- **Dashboard:** https://firecrawl.dev/app
- **Quick test:**
  ```bash
  curl -X POST https://api.firecrawl.dev/v1/scrape \
    -H "Authorization: Bearer <FIRECRAWL_KEY_REDACTED>" \
    -H "Content-Type: application/json" \
    -d '{"url":"https://engage.nyu.edu/events"}'
  ```

---

### Eventbrite (Public API)
- **Use:** Primary source for NYC public events
- **Env var:** `EVENTBRITE_TOKEN`
- **Private token (server-side):** `44W5TW2PFZVDCKQCQHDU`
- **Public token:** `T4KFTIONTOVGDS5E6IF2`
- **API key:** `KMUM2UA3ZFBXWO45IL`
- **Client secret:** `YONVJHKHMDNTGG4JDD2ZTWXQCYHCXI2UVMHCPW3RKSRSOWWZFC` *(only needed for OAuth on behalf of other users — skip for our use case)*
- **Auth header:** `Authorization: Bearer 44W5TW2PFZVDCKQCQHDU`
- **Base URL:** `https://www.eventbriteapi.com/v3/`
- **Dashboard:** https://www.eventbrite.com/account-settings/apps
- **Quick test:**
  ```bash
  curl -H "Authorization: Bearer 44W5TW2PFZVDCKQCQHDU" \
    "https://www.eventbriteapi.com/v3/users/me/"
  ```

---

### SeatGeek
- **Use:** NYC concerts, sports, theater (Bandsintown alternative — Bandsintown locked their public API in 2026)
- **Env vars:** `SEATGEEK_CLIENT_ID` (+ optional `SEATGEEK_CLIENT_SECRET`)
- **Client ID:** `NTc1NTYzNDF8MTc3NzA3MjgzMi40MjU3MDU3`
- **Client secret:** `a27f208459309ce0ddda68760546afefb3c6be0fd2e0caa41f1aba3a26d4140e`
  *(secret is NOT recoverable from the SeatGeek dashboard — this is the only copy. OAuth-only; skip for read calls.)*
- **Auth:** Pass `client_id` as a query string param. No header.
- **Dashboard:** https://seatgeek.com/account/develop
- **Quick test:**
  ```bash
  curl "https://api.seatgeek.com/2/events?venue.city=New%20York&client_id=NTc1NTYzNDF8MTc3NzA3MjgzMi40MjU3MDU3&per_page=5"
  ```

---

### Google Cloud / OAuth
- **Use:** OAuth sign-in for users; will host Calendar API + Gmail read scopes
- **Account that owns the project:** `nudge485@gmail.com`
- **GCP project ID:** `eventpilot-494322`
- **OAuth Client ID:** `<GOOGLE_CLIENT_ID_REDACTED>`
- **OAuth Client Secret:** `<GOOGLE_CLIENT_SECRET_REDACTED>`
- **Redirect URI (registered):** `http://localhost:8000/auth/callback`
- **JS origin (registered):** `http://localhost:3000`
- **Status:** Testing mode; `nudge485@gmail.com` added as test user. Add more test users in Cloud Console → OAuth consent screen.
- **Env vars in `.env`:**
  ```
  GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID_REDACTED>
  GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET_REDACTED>
  GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback
  ```
- **Routes API status:** Not yet enabled — sign in as `nudge485@gmail.com` and click Enable at https://console.cloud.google.com/apis/library/routes.googleapis.com?project=eventpilot-494322

---

## 2. Keyless Sources (Scrapers)

### NYC Open Data — Socrata (no key needed at our volume)
- **Use:** Free public NYC events — street fairs, parks events, parade permits, film shoot closures
- **Auth:** None for read at hackathon volume. App token only raises rate limits.
- **Endpoint pattern:** `https://data.cityofnewyork.us/resource/{dataset_id}.json?$limit=N&$where=...`
- **Verified live datasets (2026-04-24):**
  - `tvpp-9vvx` — NYC Permitted Event Information (current)
  - `bkfu-528j` — NYC Permitted Event Information (historical)
  - `fudw-fgrp` — NYC Parks Events Listing *(returns older 2017–2018 data; lower priority)*
- **Quick test:**
  ```bash
  curl 'https://data.cityofnewyork.us/resource/tvpp-9vvx.json?$limit=5' | jq '.[0]'
  ```
- **Useful Socrata `$where` filters:**
  ```
  $where=start_date_time > '2026-04-25T00:00:00' AND borough = 'Manhattan'
  $select=event_name,start_date_time,end_date_time,event_borough,event_location
  $order=start_date_time ASC
  ```

---

### Luma (lu.ma) — keyless via embedded `__NEXT_DATA__`
- **Use:** NYC tech meetups, founder/design/AI events — strong overlap with what NYU students attend
- **Why no API key:** Luma's official API requires paid Luma Plus and is host-side only. Public discovery has no documented endpoint, so we scrape the SSR page.
- **Source:** `https://luma.com/nyc` (also `/sf`, `/london`, etc.)
- **Verified 2026-04-24:** ~600ms fetch, returns 20 current + 9 featured live events
- **Pattern:** Page is server-rendered Next.js. Pull HTML → extract `<script id="__NEXT_DATA__">` JSON → events at `props.pageProps.initialData.data.events` (20) and `props.pageProps.initialData.data.featured_events` (9).
- **Per-event fields:** `event.name`, `event.url`, `event.start_at`, `event.cover_url`, `hosts[]`, `guest_count`, `ticket_count`
- **Caveat:** Undocumented page shape — Luma can change it any time. Wrap extraction in `try/except` and fall back to Firecrawl markdown of the same URL.
- **Reference scraper (Python):**
  ```python
  import requests, json, re

  def fetch_luma_nyc():
      html = requests.get(
          "https://luma.com/nyc",
          headers={"User-Agent": "Mozilla/5.0 (EventPilot/0.1)"},
          timeout=10,
      ).text

      m = re.search(
          r'<script id="__NEXT_DATA__"[^>]*>(.*?)</script>',
          html, re.DOTALL,
      )
      if not m:
          return []  # fall back to Firecrawl

      data = json.loads(m.group(1))
      blob = data["props"]["pageProps"]["initialData"]["data"]
      raw = blob.get("events", []) + blob.get("featured_events", [])

      out = []
      for item in raw:
          ev = item.get("event") or item
          out.append({
              "source": "luma",
              "id": ev.get("api_id") or ev.get("url"),
              "name": ev.get("name"),
              "start_at": ev.get("start_at"),
              "url": f"https://luma.com/{ev.get('url')}" if ev.get("url") else None,
              "guest_count": item.get("guest_count"),
              "hosts": [h.get("name") for h in item.get("hosts", []) or []],
              "cover_url": ev.get("cover_url"),
          })
      return out
  ```
- **Pagination:** If you ever need more than the 29 returned, sniff XHR calls to `api.lu.ma/discover/...` in DevTools.

---

### Optional Firecrawl fallback for Luma
If `__NEXT_DATA__` ever disappears, hit Firecrawl with the same URL and get markdown back:
```bash
curl -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer <FIRECRAWL_KEY_REDACTED>" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://luma.com/nyc","formats":["markdown"]}'
```

---

## 3. Status Cheat Sheet

| Source | Status | How to call |
|---|---|---|
| Anthropic Claude | ✅ Key in vault | `ANTHROPIC_API_KEY` |
| Firecrawl | ✅ Key in vault | Bearer auth |
| Eventbrite | ✅ Key in vault | Bearer auth |
| SeatGeek | ✅ Key in vault | `?client_id=...` query param |
| Google OAuth (Calendar/Gmail) | ✅ Client + secret in vault | OAuth handshake from app |
| NYC Open Data Socrata | ✅ Keyless | Direct REST GET |
| Luma | ✅ Keyless (scrape) | Pull `__NEXT_DATA__` JSON |
| Google Routes API | ⏳ Project owned by nudge485@gmail.com — needs Enable click | https://console.cloud.google.com/apis/library/routes.googleapis.com?project=eventpilot-494322 |
| Ticketmaster Discovery | ❌ Acct exists; password reset link burned, needs fresh reset | https://developer-acct.ticketmaster.com/user/password |
| PredictHQ | ❌ Acct exists; gated on email verify | https://control.predicthq.com/tokens |
| Yelp Fusion | ❌ Acct exists; create-app form has hCaptcha | https://www.yelp.com/developers/v3/manage_app |
| NYC API Portal | ❌ Image captcha on signup | https://api-portal.nyc.gov/signup |
| Socrata App Token | ❌ Acct exists; gated on email verify *(but read works keyless)* | https://data.cityofnewyork.us/profile/edit/developer_settings |
| Foursquare | ❌ Acct flow needs 6-digit email code | https://foursquare.com/developers/projects |
| Reddit | ❌ Network-blocked from openclaw browser | https://www.reddit.com/prefs/apps |

---

## 4. Drop-in `.env` snippet (everything we have)

```dotenv
# General
APP_ENV=development
API_HOST=127.0.0.1
API_PORT=8000
WEB_ORIGIN=http://localhost:3000
SESSION_SECRET=local-dev-only-change-me-before-you-ship
DATABASE_URL=sqlite:///./eventpilot.db

# Google OAuth
GOOGLE_CLIENT_ID=<GOOGLE_CLIENT_ID_REDACTED>
GOOGLE_CLIENT_SECRET=<GOOGLE_CLIENT_SECRET_REDACTED>
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/callback

# LLM
ANTHROPIC_API_KEY=<ANTHROPIC_API_KEY_REDACTED>

# Event sources
EVENTBRITE_TOKEN=44W5TW2PFZVDCKQCQHDU
SEATGEEK_CLIENT_ID=NTc1NTYzNDF8MTc3NzA3MjgzMi40MjU3MDU3
FIRECRAWL_API_KEY=<FIRECRAWL_KEY_REDACTED>

# Luma — keyless, scraped from https://luma.com/nyc
# NYC Open Data — keyless, https://data.cityofnewyork.us/resource/tvpp-9vvx.json

# Demo mode
DEMO_MODE=true
```
