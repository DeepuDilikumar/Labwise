# Launch checklist

Everything a human must do before Labwise is used by real people. Engineering items that are already done are not
listed. Nothing here can be skipped by flipping a flag.

## 1. Clinical review (blocking)
- [ ] A qualified doctor reviews every entry in `docs/CLINICAL_REVIEW.md` (57 markers, 24 drugs): descriptions,
      common reasons, suggested questions, unit conversion factors and **critical thresholds**. Set
      `reviewedByDoctor: true` / `reviewedByPharmacist: true` only after sign-off, and record who signed and when.
- [ ] Review `content/specialist-rules.ts` (findings → specialist types).
- [ ] Review the patient-facing safety wording: urgency banner, big-picture sentences, guardrail redirects,
      prescription notes (`messages/en.json` → `results.*`, `guardrails.*`, `rx.*`).
- [ ] Review the system prompts in `src/server/ai/prompts.ts`.
- [ ] Run `pnpm eval` with an AI key and have a clinician spot-check a sample of explanations in EN, HI and ML.

## 2. Legal and regulatory (blocking)
- [ ] Legal review of Privacy Policy, Terms and Medical Disclaimer **for each region** (`content/legal/index.ts`;
      drafts are clearly marked "needs legal review").
- [ ] Get advice on whether the product could count as regulated medical-device software:
      India — Medical Devices Rules 2017 / CDSCO guidance on software as a medical device;
      US — FDA guidance on clinical decision support and general-wellness software.
- [ ] India: DPDP Act 2023 compliance — consent notices, a Grievance Officer, breach notification process,
      children's data (verifiable parental consent), cross-border transfer position, and Data Protection Board contact.
- [ ] US (before US launch): state consumer health data laws (e.g. Washington My Health My Data Act, Nevada,
      Connecticut), FTC Health Breach Notification Rule, and whether any HIPAA business-associate relationship exists.
- [ ] Decide the age policy (adult accounts only; reports for children only by parents or guardians) and confirm the
      wording.
- [ ] Trademark and domain check for the final name ("Labwise" is a working name and has not been checked).

## 3. Vendors and data processing (blocking)
- [ ] Check the data-processing terms with the AI provider (Anthropic): retention, no training on customer data,
      region, sub-processors. Confirm the org's retention setting meets the model's requirements.
- [ ] Data-processing agreement with the hosting/database provider (Supabase, Vercel or chosen host). Pick the data
      residency region (India: ap-south-1 / Mumbai per `regions/in.ts`).
- [ ] Payments: complete Razorpay KYC, enable UPI, set `RAZORPAY_*` keys and register the webhook
      (`/api/payments/webhook`, events `payment.captured` and `order.paid`).
- [ ] Phone OTP: configure an SMS provider in Supabase Auth (and DLT registration of the sender/template in India).
- [ ] Email OTP: configure a sending domain (SPF/DKIM/DMARC).

## 4. Language review (blocking for HI/ML)
- [ ] A native Hindi speaker reviews `messages/hi.json` (marked "NEEDS NATIVE REVIEW").
- [ ] A native Malayalam speaker reviews `messages/ml.json` (marked "NEEDS NATIVE REVIEW").
- [ ] Decide whether per-test explanations without an AI key should be translated in the knowledge file (today they
      fall back to English with a clear note).

## 5. Production configuration
- [ ] `LABWISE_MODE=cloud`, strong `SESSION_SECRET`, `STORAGE_ENCRYPTION_KEY` (both `openssl rand -hex 32`).
- [ ] Supabase: apply `supabase/migrations`, create the private `documents` bucket (no public access).
- [ ] `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`).
- [ ] `CRON_SECRET` and a daily cron hitting `/api/cron/purge` (deletes originals past retention).
- [ ] `ADMIN_EMAILS` for `/admin/costs`.
- [ ] `NEXT_PUBLIC_ALLOW_INDEXING=true` only when ready to be indexed (noindex by default).
- [ ] Add a Content-Security-Policy header once the Razorpay checkout origins are confirmed.
- [ ] Error monitoring that never captures request bodies or report data.

## 6. Final checks
- [ ] `pnpm check` and `pnpm e2e` green; `pnpm eval` with a key meets the agreed accuracy bar.
- [ ] Manual test on a mid-range Android phone over 4G: camera capture, upload, results, share, PDF.
- [ ] Mobile landing-page performance: Lighthouse mobile is 85 on the motion-rich landing page (desktop is 100;
      the sample results page is 93 on mobile). Decide whether to trim motion or defer below-the-fold sections to reach 95.
- [ ] Penetration test or security review of auth, uploads, RLS and payments.
- [ ] Support process: who answers emails, how deletion and export requests are handled, grievance contact.
