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
