# Labwise

Lab reports and prescriptions, explained calmly in plain language — plus which *type* of doctor to see.
**Labwise explains reports. It doesn't diagnose or replace a doctor.**

Launch market India (English, Hindi, Malayalam); region is runtime configuration so the US is configuration plus
content. Working name — not trademark-checked.

## Quick start (no keys needed)

```bash
pnpm install
pnpm dev            # http://localhost:3000
```

Local mode runs everything for real without any third-party keys:

| Piece | Local mode | Cloud mode |
|---|---|---|
| Database | PGlite (real Postgres, same migrations + RLS) in `.data/` | Supabase Postgres |
| Files | AES-256-GCM encrypted on disk, signed URLs | Supabase Storage (private bucket) |
| Sign-in | 6-digit code shown on screen | Supabase Auth phone/email OTP |
| Reading reports | Recognises the bundled synthetic fixtures | Anthropic (Claude) vision + structured output |
| Payments | Simulated checkout with signed callbacks | Razorpay (UPI first); Stripe stub for the US |

Try it:
- **`/sample`** — the sample report with no sign-in.
- Sign in → onboarding → **Open sample report** (adds it to your account with trends).
- Upload any file from `fixtures/golden/` (e.g. `lab-in-03.jpg`, `rx-in-02.pdf`) to run upload → read → results.
  Other files show an honest "can't read new reports without AI" screen.
- `/design` — the living component gallery.

## Commands

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server (local mode) |
| `pnpm check` | Typecheck + lint + unit/integration/guardrail tests |
| `pnpm e2e` | Playwright end-to-end (builds and starts a production server on :3100) |
| `pnpm eval` | Golden-set eval: extraction accuracy + guardrail pass rate → `eval-results/` |
| `pnpm fixtures` | Regenerate the synthetic golden set (PDFs, photos, ground truth) |
| `pnpm content` | Regenerate `content/markers/*.json` from `scripts/content/markers.py` |
| `pnpm review-list` | Regenerate `docs/CLINICAL_REVIEW.md` |
| `pnpm screens /route …` | Screenshots at 390/768/1280 into `screens/` |

## Cloud setup

1. Create a Supabase project. Apply migrations in order from `supabase/migrations/` (SQL editor or `supabase db push`).
   Create a **private** storage bucket named `documents`. Enable phone and/or email OTP in Auth.
2. Copy `.env.example` to `.env.local` and fill in:
   `LABWISE_MODE=cloud`, `SESSION_SECRET`, `STORAGE_ENCRYPTION_KEY`, `DATABASE_URL` (pooled, transaction mode),
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`,
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `CRON_SECRET`, `ADMIN_EMAILS`.
3. Razorpay webhook → `https://<your-domain>/api/payments/webhook` (events `payment.captured`, `order.paid`).
4. Daily cron → `GET /api/cron/purge` with `Authorization: Bearer $CRON_SECRET`.
5. Deploy (Vercel or any Node host). Then work through `docs/LAUNCH_CHECKLIST.md`.

## How it works

```
upload (client compress, ≤10 pages) → validate (magic bytes, size, pages) → store encrypted
  → extract (Claude structured output, or fixture lookup) → redact PII → Zod validate
  → normalise (synonyms → canonical marker, units) → STATUS IN CODE from the printed range
  → review screen if any value is low-confidence → charge one report (samples free)
  → explain (curated knowledge file; LLM paraphrase screened by guardrails; template fallback)
  → results, trends, share card, PDF
```

Safety rules live in `CLAUDE.md` and are enforced in code and tests: deterministic status, banned-output filter,
32 adversarial prompts in `tests/guardrails`, urgency banner from lab flags or conservative thresholds, prescriptions
explained only as written. See `docs/DECISIONS.md` for trade-offs.

## Project map

```
regions/            Region config (IN, US stub): currency, pricing, units, phone, legal, specialist names
content/            Curated knowledge: markers/*.json, drugs, specialist rules, legal drafts
messages/           EN (source), HI, ML (NEEDS NATIVE REVIEW)
supabase/           Migrations (+ local auth shim for PGlite)
fixtures/golden/    Synthetic lab reports and prescriptions with ground truth
src/lib/            Pure logic: status engine, units/markers, normaliser, guardrails, redaction, explanations
src/server/         DB (asUser/asService with RLS), auth, AI providers, pipeline, payments, storage, views
src/components/     ui/ (design system), landing/, results/, app/
src/app/            Routes (landing, sample, onboarding, (app)/…, print, api)
tests/              unit, integration (RLS, pipeline, payments, trends), guardrails, e2e
docs/               DECISIONS, LAUNCH_CHECKLIST, CLINICAL_REVIEW
```

## Status

All synthetic. Not for clinical use until every item in `docs/LAUNCH_CHECKLIST.md` is done.
