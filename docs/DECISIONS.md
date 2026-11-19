# Decisions

Short records of trade-offs. Newest last.

## 001 — Next.js 16 with Cache Components off
The brief suggested Next.js 15; 16 is current and stable, so we use it (Proxy replaces Middleware, Turbopack default).
`cacheComponents`/`partialPrefetching` are disabled: nearly every screen is per-user and cookie-driven
(session, language, region, theme), so the static-shell model adds friction without benefit. Revisit for the landing page.

## 002 — One SQL layer, two drivers (PGlite locally, postgres.js on Supabase)
Instead of supabase-js queries in cloud and something else locally, all data access is SQL through `asUser()`,
which sets the JWT subject and switches to the `authenticated` role exactly like PostgREST does. Result: the *same*
migrations and RLS policies run and are tested locally (PGlite is real Postgres compiled to WASM), and the app runs
with zero keys. Cost: we don't use PostgREST/realtime; acceptable for this product.

## 003 — Our own session cookie on top of Supabase Auth
Supabase Auth verifies phone/email OTP in cloud mode; we then mint a short signed session cookie with the Supabase
user id. This keeps DB access uniform (see 002) and lets local mode use a dev OTP provider. Session secret is required
in cloud mode.

## 004 — Cookie-based locale (no `/hi/...` URLs)
Language is a personal setting that follows the user, not a page variant, and health pages shouldn't be indexed per
language. next-intl runs "without i18n routing". Landing-page SEO for HI/ML can be added later with localized paths.

## 005 — Credits, payments, rate limits are server-written only
RLS gives users SELECT on these tables but no INSERT/UPDATE, so a compromised client can't grant credits or erase
rate-limit history. Writes go through `asService()` after authorisation checks.

## 006 — Borderline is "just outside", not "near the edge"
"Borderline" (amber) means outside the printed range by ≤10% of the range width. Values inside the range are always
"In range" — we never imply a problem with a value the lab calls normal.

## 007 — "Alive" marketing layer, calm product layer
Feedback after M1: the design should feel alive and inspiring (reference: large consumer health apps).
The landing page now uses a pastel accent palette (mint, peach, lilac, sky, sun; AA-tested), drifting colour fields,
a live phone that runs real components on loop, scroll-linked storytelling, and an interactive playground that runs
the real status engine. Inside the app, motion stays purposeful and status colours stay reserved for status.
All motion is transform/opacity, pauses off-screen where it loops, and is disabled by `prefers-reduced-motion`.
Stats on the page are product facts (markers covered, languages, pages, trackers), never invented user numbers.

## 008 — Share image and PDF are rendered in the browser
Server-side renderers we evaluated (satori/`next/og`, `@react-pdf/renderer`) don't perform complex-script shaping, so
Hindi and Malayalam conjuncts render incorrectly. The share card is a fixed-colour DOM component turned into a PNG in the
browser (`html-to-image`), and "Download PDF" opens a print-optimised page where the browser's "Save as PDF" keeps text
shaping perfect. No extra server dependencies, works offline once loaded. Trade-off: PDF generation needs one extra tap.

## 009 — Zero-key demo has two paths
`/sample` renders the synthetic sample report with no sign-in, no database and no keys (same view code as real reports).
Signed-in users can add the sample to their account, which runs the *real* pipeline (with two earlier synthetic reports
so trends work). Local mode recognises the bundled synthetic fixtures by hash, so uploading a golden-set file exercises
upload → extraction → review → results end to end without an AI key; any other file gets an honest "can't read new
reports without AI" state that offers the sample.

## 010 — Explanations: curated template first, LLM as a paraphraser
The curated knowledge file is always rendered (deterministic, safe, reviewed later by clinicians). With an AI key the LLM
paraphrases it into the user's language; every string passes the guardrail filter and any failure falls back to the
template for that marker. The "big picture" is built deterministically from statuses and translated messages, so it is
correct and localised even without AI. Without AI, HI/ML users see per-test text in English with a clear note.

## 011 — In-range results collapse
Results worth discussing render as full cards; in-range results render as compact rows that expand on tap. This keeps the
page calm and scannable (a 27-marker report went from ~12,000px to ~6,000px tall on mobile) without hiding anything.

## 012 — Borderline results don't trigger specialist suggestions
"Slightly high/low" results are routed to the general physician only. Specialist types are suggested for results clearly
outside range or critical, ordered by how many results relate to that specialty.

## 013 — Payments: one interface, idempotent fulfilment
`PaymentProvider` (Razorpay now, Stripe stub for the US, an HMAC-signed local provider for zero-key testing). Orders are
recorded server-side; fulfilment is a single `UPDATE … WHERE status='created' RETURNING` so the client callback and the
webhook can race or repeat safely. Users have no UPDATE grant on payments/credits at all.

## 014 — Performance budget vs. "alive" landing
Desktop Lighthouse is 100 across the board; the mobile sample/results page is 93. The motion-rich landing is 85 on
simulated mobile 4G (LCP 3.5s, TBT ~270ms, CLS 0). We moved above-the-fold entrances to CSS and stopped downloading
Indic web fonts on the landing page (LCP 5.0s → 3.5s). Reaching 95 would mean deferring hydration of below-the-fold
sections or trimming motion; left as a product decision (see launch checklist).
