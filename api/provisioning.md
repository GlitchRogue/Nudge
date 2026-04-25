# EventPilot API Provisioning Run

**Started:** 2026-04-24 20:41 EDT
**Account:** nudge485@gmail.com
**Budget:** 45 minutes

---


## Service 1: Ticketmaster Discovery — SKIPPED_LINK_BURN
- Account `nudge485` created successfully on developer-acct.ticketmaster.com (reCAPTCHA passed clean).
- Welcome email's one-time password-set link was consumed by initial silent navigation in browser; second navigation showed "link no longer valid".
- Requested replacement reset email — never arrived in inbox after retry window.
- **Skipping** to keep budget. Manual fix: log in via password reset from a real browser session, set password to `nudge123!`, then create app at https://developer-acct.ticketmaster.com/products/apps/new (remove "OAuth" from Product field) and copy Consumer Key into `TICKETMASTER_API_KEY`.


## Service 2: PredictHQ — SKIPPED_EMAIL_VERIFY_GATE
- Account created: nudge485@gmail.com / NudgeHack2026! / Daniel Lutts / EventPilot / Other / <25 employees.
- Reached https://control.predicthq.com/tokens, filled "eventpilot" → CREATE TOKEN.
- Hard block: "Verify your email" modal appears before any token can be issued.
- Verification email did not arrive in the test inbox during the retry window.
- **Skipping.** Manual fix: log into nudge485@gmail.com (or the inbox that receives PredictHQ mail), click verify link, return to https://control.predicthq.com/tokens, create "eventpilot" token, paste into `PREDICTHQ_API_TOKEN`.


## Service 3: Yelp Fusion — SKIPPED_CAPTCHA
- Yelp account created (nudge485@gmail.com / NudgeHack2026!).
- Reached https://www.yelp.com/developers/v3/manage_app form.
- Form contains hCaptcha (`h-captcha-response` textarea visible) — per rules, hCaptcha = skip immediately.
- **Skipping.** Manual fix: complete the hCaptcha challenge by hand in a real browser session, fill app form (Industry: Local; Tier: Base; Description: "Personal AI event companion for college students"), submit, then copy API Key into `YELP_API_KEY`.


## Service 4: NYC API Portal — SKIPPED_CAPTCHA
- Reached https://api-portal.nyc.gov/signup form.
- Custom image challenge captcha (squiggly distorted text) on signup — per rules, image challenge = skip.
- **Skipping.** Manual fix: solve captcha by hand, sign up with nudge485@gmail.com / NudgeHack2026!, subscribe to "Events Calendar" or relevant events product, copy subscription key into `NYC_EVENTS_API_KEY`.


## Service 5: Socrata App Token — SKIPPED_EMAIL_VERIFY_GATE
- Socrata account created (nudge485@gmail.com / NudgeHack2026! / display name "EventPilot"); reCAPTCHA passed cleanly.
- Hard block: "Please verify your email" page after signup; verification email did not arrive in the test inbox during the retry window.
- **Skipping** — Socrata read API works keyless at hackathon volume (existing API_KEYS.md vault note confirms this). Manual fix: verify email in nudge485@gmail.com, log into https://data.cityofnewyork.us, generate App Token under Profile → Developer Settings, paste into `SOCRATA_APP_TOKEN`.


## Service 6: Foursquare — SKIPPED_EMAIL_VERIFY_GATE
- Account creation flow completed (nudge485@gmail.com / NudgeHack2026!), reCAPTCHA passed.
- Hard block: 6-digit email verification code required to enter the developer console.
- Verification code email did not arrive in the test inbox during the retry window.
- **Skipping.** Manual fix: get the code from nudge485@gmail.com, complete signup, create a Project at https://foursquare.com/developers/projects, copy Service Key into `FOURSQUARE_API_KEY`. Note: $200 free monthly API credits per page.


## Service 7: Reddit — SKIPPED_BLOCKED
- https://www.reddit.com/prefs/apps returned "You've been blocked by network security." Reddit appears to block the openclaw browser's egress IP / fingerprint.
- **Skipping.** Manual fix: from a real browser, log into Reddit (or sign up at https://www.reddit.com/register), visit https://www.reddit.com/prefs/apps, click "create an app" → choose "script" type, name "EventPilot", description "Personal AI event companion for college students", redirect uri `http://localhost:8000`, then copy `REDDIT_CLIENT_ID` (under app name) and `REDDIT_CLIENT_SECRET` (labeled "secret").


## Service 8: Enable Google Routes API — SKIPPED_WRONG_ACCOUNT
- The openclaw browser's signed-in Google account does not own GCP project `eventpilot-494322` (only "Clawdbot / clawdbot-488013" appears under recent + all projects).
- Per credentials.html, `eventpilot-494322` is owned by `nudge485@gmail.com` — but that account isn't authenticated in this browser session.
- Reached https://console.cloud.google.com/apis/library/routes.googleapis.com?project=eventpilot-494322 → "Select a resource" modal forced us to pick a project we have access to; eventpilot-494322 not visible.
- **Skipping.** Manual fix: sign in as nudge485@gmail.com in a real browser, visit the Routes API library URL above, click Enable. (Free tier: starts at $0/1K requests, no billing required for evaluation usage.)


---

## Final Summary (2026-04-24, ~22:10 EDT)

**Env vars written to `api/.env.new`:** *(none)* — `.env.new` is empty.

**All 8 services were skipped.** No keys were obtained. The existing `api/.env` was not touched per the rules.

**Services skipped + reasons:**
| # | Service | Reason |
|---|---------|--------|
| 1 | Ticketmaster Discovery | One-time login link burned by initial silent navigation; replacement reset email never arrived |
| 2 | PredictHQ | Token creation gated behind email verification; verify email never arrived in test inbox |
| 3 | Yelp Fusion | Manage-app form requires hCaptcha (rule: skip immediately) |
| 4 | NYC API Portal | Image captcha on signup (rule: skip image challenges) |
| 5 | Socrata App Token | Email verification gate; verify email never arrived. Socrata is keyless at hackathon volume — no blocker for the actual data |
| 6 | Foursquare | 6-digit email code required; code email never arrived |
| 7 | Reddit | reddit.com/prefs/apps blocked the openclaw browser ("blocked by network security") |
| 8 | Google Routes API | Openclaw browser is signed into a different Google account that doesn't own `eventpilot-494322` — only "Clawdbot" project visible |

**Anything requiring manual intervention:** All 8 services need manual finishing. The pattern: 6 of 8 are blocked on either captchas the harness shouldn't auto-solve or email verification messages that aren't reaching this Gmail inbox (`nudge485@gmail.com` may not actually be aliased/forwarded to the test inbox the openclaw browser reads, or the test inbox is a fixture inbox that doesn't receive real outbound mail). Reddit is blocked at the network layer. Google Routes needs the right Google account signed in.

**Recommended next step:** in a real browser session signed into `nudge485@gmail.com`, work through services in this order: (5) Socrata is unblocked once you confirm the verify email — fastest win; (8) Google Routes — single click; (7) Reddit app — fast; (1) Ticketmaster — request another reset email and don't pre-load the link; (2) PredictHQ — verify email then create token; (6) Foursquare — code from email; (3) Yelp + (4) NYC Portal — solve captcha by hand.
