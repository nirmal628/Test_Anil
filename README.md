# Super Krishak — Product Analysis & Prototype Challenge

**Live demo:** https://YOUR-VERCEL-URL.vercel.app  
**Figma wireframe:** https://YOUR-FIGMA-LINK  
**Author:** Anil · Branch: `feature/ui-prototype-anil`

---

## Part 1: QA & Logical Edge-Case Audit — Super Krishak (Play Store)

### Issue 1: Weather widget loses all state when offline (state-handling bug)
- **Feature/Screen:** Home screen — Weather & Location card
- **Steps to Reproduce:**
  1. Log in with internet ON. Home shows location "Lalitpur" and temperature "21.9 °C".
  2. Turn OFF WiFi/mobile data.
  3. Close and reopen the app (still offline).
- **Expected vs. Actual:**
  - *Expected:* Last-known weather (Lalitpur, 21.9 °C, with a "last updated" timestamp) displays from local cache. Location persists.
  - *Actual:* Temperature shows `---`, and the card reverts to an "Add Location" prompt — as if no location was ever set.
- **Root Cause Analysis (logical guess):** The weather card is rendered purely from the live API response with no local persistence layer. On launch, the app likely skips/ignores the stored location ID when the weather fetch fails, so the UI falls back to its "no location" default state. The location itself is stored (it returns when back online) — the bug is that UI state is coupled to network success instead of cached data.
- **Evidence:** `screenshots/offline-home.jpeg`

### Issue 2: Offline login fails with generic "Network Error" — no pre-check, no retry, no queued submission (workflow bug)
- **Feature/Screen:** Let's Connect (Login) screen
- **Steps to Reproduce:**
  1. Open app, reach login screen, turn OFF internet.
  2. Enter a valid mobile number (e.g., 9860287132) and tap "Let's Connect".
- **Expected vs. Actual:**
  - *Expected:* The app detects no connectivity before the API call and shows "No internet connection. We'll send your OTP automatically when you're back online," keeping the entered number and allowing auto-retry.
  - *Actual:* A generic toast "Network Error" appears. Entered data is discarded, nothing is queued or retried; the user must re-enter everything.
- **Root Cause Analysis:** The submit handler fires the API request unconditionally with no ConnectivityManager pre-check; the catch block maps all failures to one generic "Network Error" string (no error-code differentiation); there is no local retry queue or form-state persistence. Root cause spans frontend (missing pre-flight network check + catch-all error handling) and missing offline queue architecture.
- **Evidence:** `screenshots/login-network-error.jpeg`

### Issue 3: Validation + offline error banners render underneath the system status bar (UI bug)
- **Feature/Screen:** Global — all toast/banner notifications (seen on Home and Login)
- **Steps to Reproduce:**
  1. Trigger any toast: go offline and reopen the app ("Please check your internet connection and try again"), or attempt offline login ("Network Error").
  2. Observe the top of the screen.
- **Expected vs. Actual:**
  - *Expected:* Toast/banner displays below the status bar, fully readable.
  - *Actual:* The banner is drawn behind/under the status bar — its text overlaps the clock and battery icons and is partially illegible.
- **Root Cause Analysis:** The banner container uses fixed top positioning without accounting for the system status bar height / safe-area insets (WindowInsets). On devices with taller status bars or gesture navigation the overlap worsens. Frontend-only layout bug.
- **Evidence:** all three screenshots (text colliding with status-bar icons)

---

## Part 2: Feature Logic Spec — Crop Disease Diagnosis Submission (Krishi Doctor)

See **[FEATURE_SPEC.md](./FEATURE_SPEC.md)** — covers the full state machine, the exact "farmer fills form → loses internet halfway → closes app" scenario with the persisted job JSON, validation/business rules, and farmer-friendly error messages for 400/401/500/timeout/offline.

## Part 3: Prototype

- **Figma wireframe (low-fi, 3 screens):** https://YOUR-FIGMA-LINK — Screen 1 Diagnose form · Screen 2 Outbox/offline · Screen 3 Result.
- **React + TypeScript implementation:** this repo. Includes typed data models (`src/types.ts`), a mock API with success/500/timeout modes (`src/mockApi.ts`), a localStorage outbox with exponential backoff (`src/outbox.ts`), and the full submission state machine in `src/App.tsx`.

### Run locally
```bash
npm install
npm run dev   # → http://localhost:5173
```

**Key demo flow:** fill the form → submit → while "Uploading…", untick **Online** → the job lands in the Outbox as QUEUED → tick **Online** → it auto-retries and shows the result. Switch the API dropdown to `500 error` to see the FAILED + auto-retry path.

## Part 4: Git Workflow & Deployment

- Branch: `feature/ui-prototype-anil` (never pushed to main directly).
- Live: deployed on Vercel from this branch — see link at the top.
