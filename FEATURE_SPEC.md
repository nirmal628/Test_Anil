Part 2: Feature Logic Spec — Crop Disease Diagnosis Submission (Krishi Doctor)
1. State Machine & Offline Handling
Submission state machine
plain
IDLE → VALIDATING → COMPRESSING → UPLOADING → ANALYZING → SUCCESS
                                          ↘ FAILED (retryable)
                                          ↘ REJECTED (validation)
Any state → OFFLINE_DETECTED → QUEUED (persisted) → RETRYING → (UPLOADING…)
CANCELED from QUEUED (user deletes from outbox)
Table
State	Entry condition	Exit
IDLE	Form opened	User picks photo / fills crop type
VALIDATING	Submit tapped	Pass → COMPRESSING; fail → REJECTED
COMPRESSING	Validation pass	Done → UPLOADING
UPLOADING	Compressed image ready	2xx → ANALYZING; network fail → QUEUED; 4xx/5xx → FAILED
ANALYZING	Server has image	200 → SUCCESS; timeout after 60s → FAILED (auto-retry ×3)
QUEUED	Network lost anytime before server ack	Connectivity restored → RETRYING
RETRYING	Back online	→ UPLOADING (exponential backoff)
The exact scenario: farmer fills form → loses internet halfway → closes app
Farmer selects photo, picks crop type, adds note, taps Submit.
App validates locally → starts compression + upload.
Internet drops mid-upload. App's connectivity listener fires.
App persists the entire job to local storage immediately:
JSON
{
  "jobId": "uuid-v4",
  "imageUri": "file://…/pending_7f3a.jpg",
  "cropType": "tomato",
  "note": "yellow spots on lower leaves",
  "status": "QUEUED",
  "attempts": 1,
  "createdAt": "2026-10-07T12:20:00+05:45",
  "nextRetryAt": "2026-10-07T12:21:00+05:45"
}
Image copied to an app-private pending/ dir so gallery deletion can't break the job.
Farmer closes the app. Job survives — nothing lives in memory only.
Farmer reopens (offline): a persistent "1 diagnosis waiting to send" banner on the Diagnose screen + an Outbox list (view / retry / delete). Form is pre-filled from the last attempt.
Connectivity returns → background worker (WorkManager / expo-task-manager equivalent) picks up nextRetryAt, retries with exponential backoff (30s → 2m → 10m → 1h, cap 5 attempts).
Success → remove from outbox, show result. Exhausted retries → notify farmer with "Couldn't send after several tries — tap to retry."
Key rules: submit is idempotent (jobId sent with request so retries never double-count); app never blocks navigation while queued; everything queued is user-visible and deletable.
2. Data Validation & Business Rules
Table
Field	Rule	Error (shown inline)
Photo	Required; JPEG/PNG/WebP; max 10 MB before compression	"Please add a photo of the affected plant part" / "Photo must be under 10 MB (JPG or PNG)"
Photo content	Client-side compress to max 1920px, quality 0.8; reject screenshots-of-text, non-image files	"This file doesn't look like a photo"
Crop type	Required; must be from server crop list (56 crops)	"Please select the crop"
Affected part	Required enum (leaf/stem/fruit/root/whole plant)	"Please select which part is affected"
Severity note	Optional, ≤ 500 chars, strip HTML	—
Geo/location	Optional; only with consent; store district-level, not GPS	—
Rate limiting	Max 10 diagnoses / hour / user (client hint + server 429)	"Too many requests — please wait a few minutes"
Auth	Valid token required	(see 401 below)
Validation runs locally first (before any network call) so no bytes are wasted offline.
3. User-Friendly Error Handling
Table
HTTP	Farmer sees (Nepali-appropriate, plain language)	Behavior
400	"Something in the details isn't right (code 400). Please check the photo and selected crop, then try again."	Keep form state; highlight invalid fields
401	"Your session has expired. Please log in again — your diagnosis will be saved and sent after you log in."	Redirect to login; queue the job, auto-resume after re-auth
403 (quota/feature locked)	"This feature needs a Premium plan" with upgrade CTA	Show paywall; keep job queued
404	"This service is temporarily unavailable (code 404). Please try again later."	Retryable
408 / timeout	"The server is taking too long. We'll keep trying in the background."	Auto-retry, notify on success
429	"You're sending too many requests. Please wait a few minutes."	Respect Retry-After
500/502/503	"Our server hit a problem (code 500). Your diagnosis is saved and will send automatically when the service recovers."	Queue + retry with backoff; never lose the photo
Network unreachable	"No internet connection. This diagnosis is saved in Outbox and will send automatically when you're back online."	Queue
Unknown	"Something went wrong (code {n}). Your photo is safe — try again from Outbox."	Queue
Golden rule: the farmer's photo and form data are never destroyed by any failure. Every failure path ends in: queued job + clear message + visible recovery path.
