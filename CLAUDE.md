# Labwise — working notes for Claude

Labwise explains lab reports and prescriptions in plain language and suggests which *type* of specialist to see.
**It is an explainer, not a diagnostic tool.** Launch region India (EN/HI/ML), US next. Region is runtime config.

@AGENTS.md

## Stack
Next.js 16 (App Router, Turbopack, `src/`), React 19, TypeScript strict, Tailwind v4 (tokens in `src/app/globals.css`),
Radix primitives + our own components in `src/components/ui` (shadcn-style, fully restyled), `motion` (Framer Motion),
Recharts, lucide-react, next-intl (cookie-based locale, no URL prefix), Zod 4, Vitest, Playwright.
Data: Postgres with RLS — Supabase in cloud, **PGlite** locally running the *same* migrations.

## Commands
- `pnpm dev` — local mode, no keys needed (data in `.data/`)
- `pnpm check` — typecheck + lint + unit/integration/guardrail tests (run before every commit)
- `pnpm e2e` — Playwright (`--trace off` already set)
- `pnpm screens /route … [--theme=dark] [--locale=hi] [--widths=390,768,1280]` → `screens/` (gitignored)
- `pnpm eval` — golden-set extraction/guardrail eval (Anthropic if `ANTHROPIC_API_KEY`, else fixtures)
- `pnpm fixtures` — regenerate synthetic golden set; `pnpm content` — regenerate marker JSON; `pnpm review-list`
- E2E builds and starts prod on :3100 (`reuseExistingServer: false`). If a run looks stale, `fuser -k 3100/tcp`.

## Architecture
- `LABWISE_MODE=local|cloud` picks adapters (`src/server/env.ts`). Local = PGlite, encrypted disk storage, dev OTP
  (code shown in UI), fixture AI, fake payments. Cloud = Supabase Postgres/Auth/Storage, Anthropic, Razorpay.
- DB access only via `asUser(userId, fn)` (sets `request.jwt.claim.sub` + `set local role authenticated`, so RLS applies)
  or `asService(fn)` for server-only writes (credits, payments, audit, rate limits). Never build SQL from user strings.
- Migrations: `supabase/migrations/*.sql` (applied automatically locally). `supabase/local/00_auth_shim.sql` emulates
  Supabase's `auth` schema for PGlite only.
- Sessions: our signed HS256 cookie `lw_session` (`src/server/auth/session.ts`); OTP via `src/server/auth/otp.ts`.
- Regions: `regions/{in,us}.ts` (`RegionConfig`). **Never branch on region id in UI/logic — read a config field.**
- Prefs (locale, region, theme, text size, units) live in cookies (`src/lib/prefs.ts`), mirrored to `profiles`.
- i18n: `messages/en.json` is the source of truth; `hi.json`/`ml.json` merge over it and are marked NEEDS NATIVE REVIEW.
  A parity test fails if keys or ICU placeholders drift.

## Design tokens (summary — see `/design`)
- bg `#FAFAF7`, ink `#0F1A17`, one primary emerald `#0E7C66` (dark: `#3FBF9F`). Greys for structure.
- Status: ok (green), borderline (amber, just outside range), out (coral), critical (deep red), neutral.
  **Always icon + label + colour.** Contrast pairs are unit-tested (`src/lib/design/tokens.test.ts`) — keep `tokens.ts` in sync.
- Type: Geist (UI/body), Instrument Serif (`font-display`, hero + big-picture only), Noto Sans Devanagari/Malayalam
  with taller line heights. Tabular numerals for values (`.tabular`). Scale: caption/small/body/lead/h3/h2/h1/display/value.
- Radii 8–28px, hairline borders, soft layered shadows. Motion 150–300ms, `MotionConfig reducedMotion="user"`.
  Don't branch markup on `useReducedMotion()` during render (hydration mismatch) — use CSS `motion-reduce:` or MotionConfig.
- 4/8px spacing. Reading width 720px (`max-w-[var(--container-reading)]`), marketing 1120px.

## Safety rules (non-negotiable)
1. Marker status is computed **deterministically in code** from the value and the range **printed on the report**.
   The LLM never decides status. No printed range → show value + "no reference range found on your report".
2. The LLM may explain what a test measures and common, non-specific reasons values vary. It must not say
   "you have / likely have X", give probabilities, or recommend medicines, supplements, doses or diets.
3. Prescriptions: explain only what is written. Never suggest alternatives, changes or stopping. Always include
   "Follow your doctor's instructions. Ask your pharmacist or doctor if unsure."
4. Urgency: lab-flagged critical, or past hard-coded conservative thresholds → calm banner
   "Please speak to a doctor soon about this result." No emoji, never alarmist.
5. Persistent unobtrusive disclaimer on results: "Labwise explains reports. It doesn't diagnose or replace a doctor."
6. Guardrail suite (`tests/guardrails`) must pass; banned-pattern filter runs on every LLM output before display.
7. Explanations paraphrase `content/markers/*.json` (all `reviewedByDoctor: false` until clinical review).
- Privacy: consent before first upload; redact PII before any LLM call; RLS on every table; no analytics with health
  values; no third-party trackers; never log report contents, prompts or outputs; audit log stores actions only.
- **Never use real patient data** — fixtures, tests, screenshots and demos are synthetic only.

## Gotchas (learned the hard way)
- PGlite has ONE connection: never call `asUser`/`asService`/`audit()` inside another transaction — write the row
  with the `sql` you already have, or call after the transaction returns (nested calls deadlock).
- DB `date`/`timestamptz` may arrive as `Date` objects (PGlite) or strings (postgres.js). Normalise before string ops.
- `tailwind-merge` must know custom type sizes (`src/lib/cn.ts`), or `text-body` silently strips colour classes.
- Don't call helpers from `"use client"` modules in server code; shared helpers go in `src/lib/`.
- Off-screen share card lives in the DOM: scope test selectors (headings/roles) to avoid matching it.
- Above-the-fold landing text uses CSS entrance animations (not motion JS) so LCP isn't tied to hydration.

## Conventions
- Server-only modules import `"server-only"`. Server actions in `src/app/actions/*`.
- UI copy goes in messages, warm and plain (Grade 6–8), never clinical or scary. No region idioms in EN base copy.
- Every new screen needs loading, empty and error states. No dead buttons, no "coming soon".
- After UI changes: screenshot at 390/768/1280 and critique before moving on.
