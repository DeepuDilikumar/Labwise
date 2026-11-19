"""Generates docs/CLINICAL_REVIEW.md from content/. Run: pnpm review-list"""
import json, os
ROOT = os.path.join(os.path.dirname(__file__), "..", "..")
M = os.path.join(ROOT, "content", "markers")
ms = [json.load(open(os.path.join(M, f))) for f in sorted(os.listdir(M)) if f.endswith(".json")]
drugs = json.load(open(os.path.join(ROOT, "content", "drugs", "drugs.json")))["drugs"]
L = ["# Clinical review list", "",
     "Every entry below is marked `reviewedByDoctor: false` (markers) or `reviewedByPharmacist: false` (drugs) and **must be reviewed by a qualified clinician before launch**. Generated from `content/` — regenerate with `pnpm review-list`.", "",
     "For each marker, review: plain-language description, common reasons (high/low), suggested questions, unit conversion factors, and the conservative critical thresholds (canonical units).", "",
     f"## Markers ({len(ms)})", "", "| ID | Name | Panel | Canonical → SI | Critical thresholds (canonical) | Reviewed |", "|---|---|---|---|---|---|"]
for m in ms:
    c = m.get("critical") or {}
    crit = ", ".join(f"{k} {v}" for k, v in c.items()) or "—"
    L.append(f"| `{m['id']}` | {m['name']} | {m['panel']} | {m['canonicalUnit'] or '—'} → {m['siUnit'] or '—'} | {crit} | ☐ |")
L += ["", f"## Drugs ({len(drugs)})", "", "| ID | Generic | Class | Brands (IN) | Brands (US) | Reviewed |", "|---|---|---|---|---|---|"]
for d in drugs:
    L.append(f"| `{d['id']}` | {d['generic']} | {d['class']} | {', '.join(d['brands']['in']) or '—'} | {', '.join(d['brands']['us']) or '—'} | ☐ |")
L += ["", "## Other clinical content", "",
      "- `content/specialist-rules.ts` — marker/drug-class → specialist type routing ☐",
      "- `src/lib/guardrails/index.ts` — banned output patterns and refusal/redirect wording ☐",
      "- `src/server/ai/prompts.ts` — extraction and explanation system prompts ☐",
      "- `messages/*.json` → `results.bp.*`, `results.urgent*`, `guardrails.*`, `rx.*` — patient-facing safety wording ☐", ""]
open(os.path.join(ROOT, "docs", "CLINICAL_REVIEW.md"), "w").write("\n".join(L))
print(f"{len(ms)} markers, {len(drugs)} drugs")
