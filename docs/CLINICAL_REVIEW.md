# Clinical review list

Every entry below is marked `reviewedByDoctor: false` (markers) or `reviewedByPharmacist: false` (drugs) and **must be reviewed by a qualified clinician before launch**. Generated from `content/` — regenerate with `pnpm review-list`.

For each marker, review: plain-language description, common reasons (high/low), suggested questions, unit conversion factors, and the conservative critical thresholds (canonical units).

## Markers (57)

| ID | Name | Panel | Canonical → SI | Critical thresholds (canonical) | Reviewed |
|---|---|---|---|---|---|
| `albumin` | Albumin | liver | g/dL → g/L | — | ☐ |
| `alp` | Alkaline phosphatase (ALP) | liver | U/L → U/L | — | ☐ |
| `alt` | ALT (SGPT) | liver | U/L → U/L | above 1000.0 | ☐ |
| `ast` | AST (SGOT) | liver | U/L → U/L | above 1000.0 | ☐ |
| `bilirubin_direct` | Direct bilirubin | liver | mg/dL → µmol/L | — | ☐ |
| `bilirubin_total` | Total bilirubin | liver | mg/dL → µmol/L | — | ☐ |
| `bun` | Blood urea nitrogen (BUN) | kidney | mg/dL → mmol/L | — | ☐ |
| `calcium` | Calcium | electrolytes | mg/dL → mmol/L | below 6.5, above 13.0 | ☐ |
| `chloride` | Chloride | electrolytes | mmol/L → mmol/L | — | ☐ |
| `cholesterol_total` | Total cholesterol | lipids | mg/dL → mmol/L | — | ☐ |
| `creatinine` | Creatinine | kidney | mg/dL → µmol/L | above 5.0 | ☐ |
| `crp` | CRP (C-reactive protein) | inflammation | mg/L → mg/L | — | ☐ |
| `egfr` | eGFR | kidney | mL/min/1.73m² → mL/min/1.73m² | — | ☐ |
| `esr` | ESR | inflammation | mm/hr → mm/hr | — | ☐ |
| `ferritin` | Ferritin | iron | ng/mL → µg/L | — | ☐ |
| `free_t3` | Free T3 | thyroid | pg/mL → pmol/L | — | ☐ |
| `free_t4` | Free T4 | thyroid | ng/dL → pmol/L | — | ☐ |
| `ggt` | GGT | liver | U/L → U/L | — | ☐ |
| `glucose_fasting` | Fasting blood sugar | blood_sugar | mg/dL → mmol/L | below 54.0, above 400.0 | ☐ |
| `glucose_pp` | Blood sugar after a meal (PP) | blood_sugar | mg/dL → mmol/L | below 54.0, above 400.0 | ☐ |
| `glucose_random` | Random blood sugar | blood_sugar | mg/dL → mmol/L | below 54.0, above 400.0 | ☐ |
| `haemoglobin` | Haemoglobin | cbc | g/dL → g/L | below 7.0, above 20.0 | ☐ |
| `hba1c` | HbA1c | blood_sugar | % → mmol/mol | — | ☐ |
| `hdl` | HDL cholesterol | lipids | mg/dL → mmol/L | — | ☐ |
| `hematocrit` | Haematocrit (PCV) | cbc | % → L/L | — | ☐ |
| `hs_crp` | hs-CRP | inflammation | mg/L → mg/L | — | ☐ |
| `iron` | Serum iron | iron | µg/dL → µmol/L | — | ☐ |
| `ldl` | LDL cholesterol | lipids | mg/dL → mmol/L | — | ☐ |
| `lymphocytes` | Lymphocytes | cbc | % → % | — | ☐ |
| `magnesium` | Magnesium | electrolytes | mg/dL → mmol/L | — | ☐ |
| `mch` | MCH | cbc | pg → pg | — | ☐ |
| `mchc` | MCHC | cbc | g/dL → g/L | — | ☐ |
| `mcv` | MCV (mean cell volume) | cbc | fL → fL | — | ☐ |
| `neutrophils` | Neutrophils | cbc | % → % | — | ☐ |
| `non_hdl` | Non-HDL cholesterol | lipids | mg/dL → mmol/L | — | ☐ |
| `phosphorus` | Phosphorus | electrolytes | mg/dL → mmol/L | — | ☐ |
| `platelets` | Platelet count | cbc | 10^3/µL → 10^9/L | below 20.0, above 1000.0 | ☐ |
| `potassium` | Potassium | electrolytes | mmol/L → mmol/L | below 2.8, above 6.2 | ☐ |
| `rbc` | Red blood cell count | cbc | 10^6/µL → 10^12/L | — | ☐ |
| `rdw` | RDW | cbc | % → % | — | ☐ |
| `sodium` | Sodium | electrolytes | mmol/L → mmol/L | below 120.0, above 160.0 | ☐ |
| `t3_total` | Total T3 | thyroid | ng/dL → nmol/L | — | ☐ |
| `t4_total` | Total T4 | thyroid | µg/dL → nmol/L | — | ☐ |
| `tibc` | TIBC | iron | µg/dL → µmol/L | — | ☐ |
| `total_protein` | Total protein | liver | g/dL → g/L | — | ☐ |
| `transferrin_sat` | Transferrin saturation | iron | % → % | — | ☐ |
| `triglycerides` | Triglycerides | lipids | mg/dL → mmol/L | above 1000.0 | ☐ |
| `tsh` | TSH (thyroid stimulating hormone) | thyroid | µIU/mL → mIU/L | — | ☐ |
| `urea` | Urea | kidney | mg/dL → mmol/L | — | ☐ |
| `uric_acid` | Uric acid | kidney | mg/dL → µmol/L | — | ☐ |
| `urine_ph` | Urine pH | urine | pH → pH | — | ☐ |
| `urine_pus_cells` | Pus cells (urine) | urine | /hpf → /hpf | — | ☐ |
| `urine_sg` | Urine specific gravity | urine | — → — | — | ☐ |
| `vitamin_b12` | Vitamin B12 | vitamins | pg/mL → pmol/L | — | ☐ |
| `vitamin_d` | Vitamin D (25-OH) | vitamins | ng/mL → nmol/L | — | ☐ |
| `vldl` | VLDL cholesterol | lipids | mg/dL → mmol/L | — | ☐ |
| `wbc` | White blood cell count | cbc | 10^3/µL → 10^9/L | below 1.5, above 30.0 | ☐ |

## Drugs (24)

| ID | Generic | Class | Brands (IN) | Brands (US) | Reviewed |
|---|---|---|---|---|---|
| `metformin` | Metformin | blood_sugar | Glycomet, Gluconorm, Obimet | Glucophage, Glumetza | ☐ |
| `glimepiride` | Glimepiride | blood_sugar | Amaryl, Glimy | Amaryl | ☐ |
| `telmisartan` | Telmisartan | blood_pressure | Telma, Telmikind, Tazloc | Micardis | ☐ |
| `amlodipine` | Amlodipine | blood_pressure | Amlong, Amlokind, Stamlo | Norvasc | ☐ |
| `lisinopril` | Lisinopril | blood_pressure | Listril, Lipril | Zestril, Prinivil | ☐ |
| `atorvastatin` | Atorvastatin | cholesterol | Atorva, Lipvas, Storvas | Lipitor | ☐ |
| `rosuvastatin` | Rosuvastatin | cholesterol | Rosuvas, Rozavel | Crestor | ☐ |
| `levothyroxine` | Levothyroxine | thyroid | Thyronorm, Eltroxin, Thyrox | Synthroid, Levoxyl | ☐ |
| `aspirin` | Aspirin (low dose) | heart | Ecosprin, Loprin | Bayer Low Dose, Ecotrin | ☐ |
| `paracetamol` | Paracetamol (acetaminophen) | pain_fever | Dolo 650, Crocin, Calpol | Tylenol | ☐ |
| `ibuprofen` | Ibuprofen | pain_fever | Brufen, Ibugesic | Advil, Motrin | ☐ |
| `pantoprazole` | Pantoprazole | stomach | Pan 40, Pantocid, Pantop | Protonix | ☐ |
| `pantoprazole_domperidone` | Pantoprazole + Domperidone | stomach | Pan-D, Pantocid DSR | — | ☐ |
| `omeprazole` | Omeprazole | stomach | Omez, Ocid | Prilosec | ☐ |
| `azithromycin` | Azithromycin | antibiotic | Azithral, Azee | Zithromax, Z-Pak | ☐ |
| `amoxicillin_clavulanate` | Amoxicillin + Clavulanic acid | antibiotic | Augmentin, Moxikind-CV, Clavam | Augmentin | ☐ |
| `cetirizine` | Cetirizine | allergy | Cetzine, Okacet, Alerid | Zyrtec | ☐ |
| `calcium_vitd3` | Calcium + Vitamin D3 | supplement | Shelcal, Calcimax, CCM | Caltrate, Os-Cal | ☐ |
| `cholecalciferol` | Vitamin D3 (cholecalciferol) | supplement | Uprise-D3, Calcirol, D-Rise | — | ☐ |
| `ferrous` | Iron (ferrous) supplement | supplement | Livogen, Autrin, Orofer | Feosol, Slow Fe | ☐ |
| `methylcobalamin` | Vitamin B12 (methylcobalamin) | supplement | Nurokind, Methycobal, Mecobal | — | ☐ |
| `salbutamol` | Salbutamol (albuterol) inhaler | breathing | Asthalin | Ventolin, ProAir | ☐ |
| `montelukast` | Montelukast | breathing | Montair, Romilast | Singulair | ☐ |
| `ondansetron` | Ondansetron | stomach | Emeset, Vomikind | Zofran | ☐ |

## Other clinical content

- `content/specialist-rules.ts` — marker/drug-class → specialist type routing ☐
- `src/lib/guardrails/index.ts` — banned output patterns and refusal/redirect wording ☐
- `src/server/ai/prompts.ts` — extraction and explanation system prompts ☐
- `messages/*.json` → `results.bp.*`, `results.urgent*`, `guardrails.*`, `rx.*` — patient-facing safety wording ☐
