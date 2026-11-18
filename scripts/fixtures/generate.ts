/**
 * Generates SYNTHETIC lab reports and prescriptions (PDF + photo-like PNG) with ground truth.
 * Used for: demo mode, local-mode extraction (hash → ground truth), and the golden-set eval.
 * All names, IDs and values are invented. Run: pnpm fixtures
 */
import { chromium } from "@playwright/test";
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Extraction, ExtractedMarker, ExtractedRxItem } from "../../src/lib/domain/extraction";

const OUT = path.join(process.cwd(), "fixtures", "golden");

// ---------- deterministic RNG ----------
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

// ---------- printed rows: [display name IN, display name US, unit conv, unit SI, low, high, SI factor (SI = conv / f), decimals] ----------
type Row = { in: string; us: string; unit: string; si: string; low: number; high: number; f: number; d: number; siD?: number; inUnit?: string; inF?: number };
const ROWS: Record<string, Row> = {
  hb: { in: "Haemoglobin", us: "Hemoglobin", unit: "g/dL", si: "g/L", low: 12, high: 15.5, f: 0.1, d: 1, siD: 0 },
  rbc: { in: "Total RBC Count", us: "RBC", unit: "million/cumm", si: "x10^12/L", low: 4.0, high: 5.2, f: 1, d: 2 },
  hct: { in: "PCV", us: "Hematocrit", unit: "%", si: "%", low: 36, high: 46, f: 1, d: 1 },
  mcv: { in: "MCV", us: "MCV", unit: "fL", si: "fL", low: 80, high: 100, f: 1, d: 0 },
  wbc: { in: "Total Leucocyte Count", us: "WBC", unit: "10^3/µL", si: "x10^9/L", low: 4.0, high: 11.0, f: 1, d: 1 },
  plt: { in: "Platelet Count", us: "Platelets", unit: "10^3/µL", si: "x10^9/L", low: 150, high: 410, f: 1, d: 0, inUnit: "lakhs/cumm", inF: 100 },
  fbs: { in: "Fasting Blood Sugar", us: "Glucose, Fasting", unit: "mg/dL", si: "mmol/L", low: 70, high: 100, f: 18.016, d: 0, siD: 1 },
  ppbs: { in: "Post Prandial Blood Sugar", us: "Glucose, 2 Hr Post Prandial", unit: "mg/dL", si: "mmol/L", low: 70, high: 140, f: 18.016, d: 0, siD: 1 },
  a1c: { in: "HbA1c (Glycated Haemoglobin)", us: "Hemoglobin A1c", unit: "%", si: "%", low: 4.0, high: 5.6, f: 1, d: 1 },
  chol: { in: "Total Cholesterol", us: "Cholesterol, Total", unit: "mg/dL", si: "mmol/L", low: 0, high: 200, f: 38.67, d: 0, siD: 2 },
  ldl: { in: "LDL Cholesterol (Calculated)", us: "LDL Cholesterol", unit: "mg/dL", si: "mmol/L", low: 0, high: 100, f: 38.67, d: 0, siD: 2 },
  hdl: { in: "HDL Cholesterol (Direct)", us: "HDL Cholesterol", unit: "mg/dL", si: "mmol/L", low: 40, high: 60, f: 38.67, d: 0, siD: 2 },
  tg: { in: "Triglycerides", us: "Triglycerides", unit: "mg/dL", si: "mmol/L", low: 0, high: 150, f: 88.57, d: 0, siD: 2 },
  creat: { in: "Serum Creatinine", us: "Creatinine", unit: "mg/dL", si: "µmol/L", low: 0.6, high: 1.1, f: 1 / 88.42, d: 2, siD: 0 },
  urea: { in: "Blood Urea", us: "BUN", unit: "mg/dL", si: "mmol/L", low: 15, high: 40, f: 6.006, d: 0, siD: 1 },
  egfr: { in: "eGFR (CKD-EPI)", us: "eGFR", unit: "mL/min/1.73m²", si: "mL/min/1.73m²", low: 90, high: 200, f: 1, d: 0 },
  uric: { in: "Serum Uric Acid", us: "Uric Acid", unit: "mg/dL", si: "µmol/L", low: 2.6, high: 6.0, f: 1 / 59.48, d: 1, siD: 0 },
  alt: { in: "SGPT (ALT)", us: "ALT", unit: "U/L", si: "U/L", low: 7, high: 40, f: 1, d: 0 },
  ast: { in: "SGOT (AST)", us: "AST", unit: "U/L", si: "U/L", low: 8, high: 40, f: 1, d: 0 },
  alp: { in: "Alkaline Phosphatase", us: "Alkaline Phosphatase", unit: "U/L", si: "U/L", low: 44, high: 147, f: 1, d: 0 },
  bili: { in: "Total Bilirubin", us: "Bilirubin, Total", unit: "mg/dL", si: "µmol/L", low: 0.2, high: 1.2, f: 1 / 17.1, d: 1, siD: 0 },
  alb: { in: "Serum Albumin", us: "Albumin", unit: "g/dL", si: "g/L", low: 3.5, high: 5.0, f: 0.1, d: 1, siD: 0 },
  tsh: { in: "TSH (Ultrasensitive)", us: "TSH", unit: "µIU/mL", si: "mIU/L", low: 0.4, high: 4.0, f: 1, d: 2 },
  ft4: { in: "Free T4", us: "Free T4", unit: "ng/dL", si: "pmol/L", low: 0.8, high: 1.8, f: 1 / 12.87, d: 2, siD: 1 },
  vitd: { in: "Vitamin D (25-OH)", us: "Vitamin D, 25-Hydroxy", unit: "ng/mL", si: "nmol/L", low: 30, high: 100, f: 1 / 2.496, d: 1, siD: 0 },
  b12: { in: "Vitamin B12", us: "Vitamin B12", unit: "pg/mL", si: "pmol/L", low: 200, high: 900, f: 1 / 0.7378, d: 0 },
  ferr: { in: "Serum Ferritin", us: "Ferritin", unit: "ng/mL", si: "µg/L", low: 15, high: 150, f: 1, d: 0 },
  na: { in: "Sodium", us: "Sodium", unit: "mmol/L", si: "mmol/L", low: 135, high: 145, f: 1, d: 0 },
  k: { in: "Potassium", us: "Potassium", unit: "mmol/L", si: "mmol/L", low: 3.5, high: 5.1, f: 1, d: 1 },
  ca: { in: "Serum Calcium", us: "Calcium", unit: "mg/dL", si: "mmol/L", low: 8.6, high: 10.3, f: 4.008, d: 1, siD: 2 },
  crp: { in: "CRP (Quantitative)", us: "C-Reactive Protein", unit: "mg/L", si: "mg/L", low: 0, high: 5, f: 1, d: 1 },
};

const PANELS: Record<string, string[]> = {
  cbc: ["hb", "rbc", "hct", "mcv", "wbc", "plt"],
  sugar: ["fbs", "ppbs", "a1c"],
  lipid: ["chol", "ldl", "hdl", "tg"],
  kft: ["creat", "urea", "egfr", "uric"],
  lft: ["alt", "ast", "alp", "bili", "alb"],
  thyroid: ["tsh", "ft4"],
  vit: ["vitd", "b12", "ferr"],
  lytes: ["na", "k", "ca", "crp"],
};

interface LabDef {
  id: string;
  style: "in" | "us";
  units: "conv" | "si";
  panels: (keyof typeof PANELS)[];
  photo?: boolean;
  seed: number;
  /** Force specific values (conventional units) to cover edge cases. */
  force?: Record<string, number>;
  noRange?: string[];
  critical?: string;
  date: string;
}

const LABS: LabDef[] = [
  { id: "lab-in-01", style: "in", units: "conv", panels: ["cbc", "sugar", "lipid", "kft", "lft", "thyroid", "vit"], seed: 11, date: "2026-11-10", force: { a1c: 6.1, fbs: 108, ldl: 132, vitd: 18.4, tsh: 2.41, hb: 12.8 } },
  { id: "lab-in-02", style: "in", units: "conv", panels: ["cbc", "lft"], seed: 12, date: "2026-10-02", force: { hb: 10.6, plt: 410 } },
  { id: "lab-in-03", style: "in", units: "conv", panels: ["sugar", "lipid"], seed: 13, date: "2026-09-14", photo: true },
  { id: "lab-in-04", style: "in", units: "conv", panels: ["thyroid", "vit"], seed: 14, date: "2026-08-21", force: { tsh: 6.8 } },
  { id: "lab-in-05", style: "in", units: "conv", panels: ["kft", "lytes"], seed: 15, date: "2026-07-30", noRange: ["crp"] },
  { id: "lab-in-06", style: "in", units: "conv", panels: ["cbc", "sugar", "kft"], seed: 16, date: "2026-06-11", photo: true },
  { id: "lab-in-07", style: "in", units: "conv", panels: ["lytes", "kft"], seed: 17, date: "2026-05-05", critical: "k", force: { k: 6.6 } },
  { id: "lab-in-08", style: "in", units: "conv", panels: ["lipid", "lft", "thyroid"], seed: 18, date: "2026-04-18" },
  { id: "lab-us-01", style: "us", units: "conv", panels: ["cbc", "sugar", "lipid", "kft"], seed: 21, date: "2026-11-03", force: { fbs: 112, a1c: 5.9 } },
  { id: "lab-us-02", style: "us", units: "conv", panels: ["lft", "thyroid", "vit"], seed: 22, date: "2026-10-12" },
  { id: "lab-us-03", style: "us", units: "conv", panels: ["cbc", "lytes"], seed: 23, date: "2026-09-01", photo: true },
  { id: "lab-us-04", style: "us", units: "conv", panels: ["sugar", "lipid", "kft", "lft"], seed: 24, date: "2026-08-08" },
  { id: "lab-si-01", style: "us", units: "si", panels: ["sugar", "lipid", "kft"], seed: 31, date: "2026-11-01", force: { fbs: 115 } },
  { id: "lab-si-02", style: "us", units: "si", panels: ["cbc", "lft", "thyroid"], seed: 32, date: "2026-10-20" },
  { id: "lab-si-03", style: "us", units: "si", panels: ["lytes", "vit", "kft"], seed: 33, date: "2026-09-25", photo: true },
  { id: "lab-si-04", style: "us", units: "si", panels: ["sugar", "lipid"], seed: 34, date: "2026-08-15" },
];

// Earlier reports for the sample person, so the demo has trends.
const HISTORY: LabDef[] = [
  { id: "hist-in-01", style: "in", units: "conv", panels: ["sugar", "lipid", "vit"], seed: 41, date: "2026-05-12", force: { a1c: 6.4, fbs: 121, ldl: 151, vitd: 12.2 } },
  { id: "hist-in-02", style: "in", units: "conv", panels: ["sugar", "lipid", "vit"], seed: 42, date: "2026-08-09", force: { a1c: 6.3, fbs: 114, ldl: 141, vitd: 15.1 } },
];

const fmt = (n: number, d: number) => n.toFixed(d);

function buildLab(def: LabDef) {
  const r = rng(def.seed);
  const markers: (ExtractedMarker & { key: string })[] = [];
  for (const p of def.panels)
    for (const key of PANELS[p]) {
      const row = ROWS[key];
      const span = row.high - row.low || row.high;
      let v = def.force?.[key] ?? row.low + span * (r() * 1.3 - 0.15);
      if (row.low === 0) v = def.force?.[key] ?? row.high * (0.55 + r() * 0.6);
      v = Math.max(v, 0.01);
      const isIn = def.style === "in";
      const useInUnit = isIn && row.inUnit && def.units === "conv";
      const si = def.units === "si";
      const f = useInUnit ? row.inF! : si ? row.f : 1;
      const d = si ? (row.siD ?? row.d) : useInUnit ? 2 : row.d;
      const conv = (x: number) => Number(fmt(x / f, d));
      const value = conv(v);
      const low = row.low === 0 ? null : conv(row.low);
      const high = conv(row.high);
      const noRange = def.noRange?.includes(key);
      const rangeText = noRange ? null : low == null ? `< ${fmt(high, d)}` : `${fmt(low, d)} - ${fmt(high, d)}`;
      let flag: string | null = null;
      if (def.style === "us" && !noRange) flag = low != null && value < low ? "L" : value > high ? "H" : null;
      if (def.critical === key) flag = def.style === "us" ? "HH" : "Critical";
      markers.push({
        key,
        marker: isIn ? row.in : row.us,
        value: fmt(value, d),
        unit: useInUnit ? row.inUnit! : si ? row.si : row.unit,
        referenceRangeText: rangeText,
        referenceRangeLow: noRange ? null : low,
        referenceRangeHigh: noRange ? null : high,
        labFlag: flag,
        confidence: def.photo ? 0.86 : 0.97,
      });
    }
  return markers;
}

const NAMES = ["Asha Menon", "Rahul Verma", "Priya Nair", "Arjun Rao", "Meera Iyer", "Dev Sharma", "Kavya Pillai", "Sameer Khan", "Jordan Lee", "Taylor Morgan", "Casey Brooks", "Riley Chen", "Avery Patel", "Morgan Diaz", "Quinn Foster", "Jamie Ortiz", "Asha Menon", "Asha Menon"];

function labHtml(def: LabDef, markers: ReturnType<typeof buildLab>, i: number) {
  const name = def.id.startsWith("hist") || def.id === "lab-in-01" ? "Asha Menon" : NAMES[i % NAMES.length];
  const isIn = def.style === "in";
  const lab = isIn ? "Sunrise Diagnostics (Sample Lab)" : "Lakeside Clinical Laboratories (Sample)";
  const rows = markers
    .map((m) =>
      isIn
        ? `<tr><td>${m.marker}</td><td class="v ${m.labFlag ? "b" : ""}">${m.value}</td><td>${m.unit}</td><td>${m.referenceRangeText ?? ""}</td></tr>`
        : `<tr><td>${m.marker}</td><td class="v">${m.value}</td><td class="flag">${m.labFlag ?? ""}</td><td>${m.unit}</td><td>${m.referenceRangeText ?? ""}</td></tr>`,
    )
    .join("");
  const head = isIn
    ? "<tr><th>Test</th><th>Result</th><th>Unit</th><th>Biological Ref. Interval</th></tr>"
    : "<tr><th>Test</th><th>Result</th><th>Flag</th><th>Units</th><th>Reference Interval</th></tr>";
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    body{font-family:${isIn ? "Arial" : "Helvetica"},sans-serif;color:#111;margin:0;padding:36px 42px;font-size:12px;background:#fff}
    .top{display:flex;justify-content:space-between;border-bottom:3px solid ${isIn ? "#c0392b" : "#1f4e79"};padding-bottom:10px}
    h1{font-size:20px;margin:0;color:${isIn ? "#c0392b" : "#1f4e79"}} .sub{color:#555;font-size:10px}
    .pt{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin:14px 0;padding:10px;border:1px solid #ccc;background:#fafafa}
    table{width:100%;border-collapse:collapse;margin-top:8px} th{text-align:left;background:${isIn ? "#f3e5e5" : "#e8eef5"};padding:6px;font-size:11px}
    td{padding:5px 6px;border-bottom:1px solid #e5e5e5} .v{font-weight:600} .b{font-weight:800} .flag{color:#b00;font-weight:700}
    .foot{margin-top:24px;color:#666;font-size:10px} .stamp{margin-top:6px;font-size:9px;color:#999}
  </style></head><body>
  <div class="top"><div><h1>${lab}</h1><div class="sub">SYNTHETIC REPORT FOR TESTING — NOT A REAL PATIENT</div></div>
  <div class="sub">${isIn ? "NABL-style layout (sample)" : "CLIA-style layout (sample)"}<br/>Phone: ${isIn ? "+91 98765 43210" : "(555) 123-4567"}</div></div>
  <div class="pt"><div><b>Patient Name:</b> ${name}</div><div><b>${isIn ? "UHID" : "MRN"}:</b> ${isIn ? "SD" : "LC"}-${100000 + i * 7919}</div>
  <div><b>Age/Sex:</b> ${34 + (i % 30)} Y / ${i % 2 ? "M" : "F"}</div><div><b>${isIn ? "Report Date" : "Collected"}:</b> ${def.date}</div>
  <div><b>Ref. By:</b> Dr. Sample Physician</div><div><b>Sample ID:</b> ${88000000 + i * 31}</div></div>
  <table>${head}${rows}</table>
  <div class="foot">${isIn ? "*** End of Report ***" : "Results flagged H (high) or L (low) are outside the reference interval."}</div>
  <div class="stamp">Generated synthetic fixture ${def.id}</div>
  </body></html>`;
}

interface RxDef {
  id: string;
  style: "in" | "us";
  handwritten: boolean;
  photo?: boolean;
  items: Omit<ExtractedRxItem, "confidence">[];
  specialty: string;
  date: string;
}
const RX: RxDef[] = [
  { id: "rx-in-01", style: "in", handwritten: false, specialty: "General Physician", date: "2026-11-11", items: [
    { medicine: "Tab. Glycomet 500 mg", strength: "500 mg", form: "tablet", frequency: "1-0-1", duration: "30 days", instructions: "After food" },
    { medicine: "Tab. Telma 40", strength: "40 mg", form: "tablet", frequency: "1-0-0", duration: "30 days", instructions: "Morning" },
    { medicine: "Cap. Uprise-D3 60K", strength: "60000 IU", form: "capsule", frequency: "Once a week", duration: "8 weeks", instructions: "With milk" }] },
  { id: "rx-in-02", style: "in", handwritten: true, specialty: "Physician", date: "2026-10-04", items: [
    { medicine: "Tab. Dolo 650", strength: "650 mg", form: "tablet", frequency: "1-1-1", duration: "3 days", instructions: "If fever" },
    { medicine: "Tab. Azithral 500", strength: "500 mg", form: "tablet", frequency: "1-0-0", duration: "3 days", instructions: "After food" },
    { medicine: "Tab. Cetzine 10 mg", strength: "10 mg", form: "tablet", frequency: "0-0-1", duration: "5 days", instructions: null }] },
  { id: "rx-in-03", style: "in", handwritten: true, photo: true, specialty: "Endocrinologist", date: "2026-09-17", items: [
    { medicine: "Tab. Thyronorm 50 mcg", strength: "50 mcg", form: "tablet", frequency: "1-0-0", duration: "3 months", instructions: "Empty stomach" },
    { medicine: "Tab. Shelcal 500", strength: "500 mg", form: "tablet", frequency: "0-1-0", duration: "3 months", instructions: "After lunch" }] },
  { id: "rx-in-04", style: "in", handwritten: false, specialty: "Gastroenterologist", date: "2026-08-02", items: [
    { medicine: "Cap. Pan-D", strength: null, form: "capsule", frequency: "1-0-0", duration: "14 days", instructions: "Before breakfast" },
    { medicine: "Tab. Emeset 4 mg", strength: "4 mg", form: "tablet", frequency: "SOS", duration: "5 days", instructions: "If vomiting" }] },
  { id: "rx-us-01", style: "us", handwritten: false, specialty: "Primary Care", date: "2026-11-02", items: [
    { medicine: "Lipitor 20 mg", strength: "20 mg", form: "tablet", frequency: "Once daily at bedtime", duration: "90 days", instructions: null },
    { medicine: "Lisinopril 10 mg", strength: "10 mg", form: "tablet", frequency: "Once daily", duration: "90 days", instructions: null }] },
  { id: "rx-us-02", style: "us", handwritten: true, specialty: "Urgent Care", date: "2026-10-15", items: [
    { medicine: "Amoxicillin-Clavulanate 875 mg", strength: "875 mg", form: "tablet", frequency: "BID", duration: "10 days", instructions: "With food" },
    { medicine: "Ibuprofen 400 mg", strength: "400 mg", form: "tablet", frequency: "Every 6 hours as needed", duration: "5 days", instructions: "With food" }] },
  { id: "rx-us-03", style: "us", handwritten: true, photo: true, specialty: "Family Medicine", date: "2026-09-09", items: [
    { medicine: "Synthroid 75 mcg", strength: "75 mcg", form: "tablet", frequency: "Every morning", duration: "30 days", instructions: "On an empty stomach" },
    { medicine: "Zyrtec 10 mg", strength: "10 mg", form: "tablet", frequency: "Once daily", duration: "30 days", instructions: null }] },
  { id: "rx-us-04", style: "us", handwritten: false, specialty: "Pulmonology", date: "2026-07-21", items: [
    { medicine: "Ventolin HFA inhaler", strength: "90 mcg/puff", form: "inhaler", frequency: "2 puffs every 4-6 hours as needed", duration: null, instructions: "For wheezing" },
    { medicine: "Singulair 10 mg", strength: "10 mg", form: "tablet", frequency: "Once daily in the evening", duration: "30 days", instructions: null }] },
];

function rxHtml(def: RxDef, i: number) {
  const isIn = def.style === "in";
  const hand = def.handwritten;
  const items = def.items
    .map((it, n) =>
      `<li><span class="m">${it.medicine}</span> ${it.frequency ? `<span>— ${it.frequency}</span>` : ""} ${it.duration ? `<span>× ${it.duration}</span>` : ""} ${it.instructions ? `<span>(${it.instructions})</span>` : ""}</li>`.replace(
        "<li>",
        `<li style="transform:rotate(${hand ? (n % 2 ? -1.2 : 0.8) : 0}deg)">`,
      ),
    )
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Caveat:wght@500&display=block" rel="stylesheet">
  <style>
    body{margin:0;padding:34px 40px;background:#fffdf7;font-family:Georgia,serif;color:#1d2a4a;font-size:13px}
    .hd{border-bottom:2px solid #1d2a4a;padding-bottom:8px;display:flex;justify-content:space-between}
    h1{margin:0;font-size:18px} .sub{font-size:10px;color:#555}
    .rx{font-size:34px;font-weight:700;margin:16px 0 4px}
    ul{list-style:none;padding:0;margin:8px 0 0} li{margin:14px 0;${hand ? "font-family:'Caveat',cursive;font-size:24px;color:#18306b" : "font-size:14px"}}
    .m{font-weight:${hand ? 500 : 700}} .ft{margin-top:40px;font-size:10px;color:#777}
  </style></head><body>
  <div class="hd"><div><h1>${isIn ? "Sample Family Clinic" : "Sample Health Associates"}</h1><div class="sub">SYNTHETIC PRESCRIPTION FOR TESTING — NOT REAL</div></div>
  <div class="sub">Dr. Sample Doctor, ${def.specialty}<br/>Date: ${def.date}<br/>Reg. No: SMP-${4000 + i}</div></div>
  <div class="sub" style="margin-top:8px">Patient: ${["Asha Menon", "Rahul Verma", "Priya Nair", "Arjun Rao", "Jordan Lee", "Taylor Morgan", "Casey Brooks", "Riley Chen"][i]} · Age ${40 + i}</div>
  <div class="rx">℞</div><ul>${items}</ul>
  <div class="ft">Signature: ____________ · Generated synthetic fixture ${def.id}</div>
  </body></html>`;
}

async function render(page: import("@playwright/test").Page, html: string, base: string, photo: boolean, seed: number) {
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.waitForTimeout(200);
  const files: { file: string; type: string }[] = [];
  if (!photo) {
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    await writeFile(`${base}.pdf`, pdf);
    files.push({ file: `${base}.pdf`, type: "application/pdf" });
  } else {
    // Photo-like: slight rotation, shadow, warm paper tone, mild blur.
    const r = rng(seed);
    const rot = (r() * 6 - 3).toFixed(2);
    await page.evaluate(
      ({ rot }) => {
        document.documentElement.style.background = "#8a8378";
        document.body.style.transform = `rotate(${rot}deg) scale(0.92)`;
        document.body.style.boxShadow = "0 18px 50px rgba(0,0,0,.45)";
        document.body.style.filter = "blur(0.5px) sepia(0.12) brightness(0.97)";
        document.body.style.margin = "30px auto";
        document.body.style.width = "640px";
      },
      { rot },
    );
    await page.setViewportSize({ width: 760, height: 1000 });
    const png = await page.screenshot({ fullPage: true, type: "jpeg", quality: 82 });
    await writeFile(`${base}.jpg`, png);
    files.push({ file: `${base}.jpg`, type: "image/jpeg" });
  }
  return files;
}

const sha = (b: Buffer) => createHash("sha256").update(b).digest("hex");

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 794, height: 1123 } });
  const manifest: Record<string, { id: string; file: string; contentType: string; kind: "lab" | "prescription"; truth: Extraction }> = {};
  const all = [...LABS, ...HISTORY];
  for (const [i, def] of all.entries()) {
    const markers = buildLab(def);
    const truth: Extraction = {
      kind: "lab",
      lab: {
        labName: def.style === "in" ? "Sunrise Diagnostics (Sample Lab)" : "Lakeside Clinical Laboratories (Sample)",
        reportDate: def.date,
        patientAge: 34 + (i % 30),
        patientSex: i % 2 ? "male" : "female",
        markers: markers.map(({ key, ...m }) => (void key, m)),
      },
      prescription: null,
    };
    const files = await render(page, labHtml(def, markers, i), path.join(OUT, def.id), !!def.photo, def.seed);
    for (const f of files) {
      const h = sha(await readFile(f.file));
      manifest[h] = { id: def.id, file: path.basename(f.file), contentType: f.type, kind: "lab", truth };
    }
    console.log("lab", def.id, markers.length, "markers");
  }
  for (const [i, def] of RX.entries()) {
    const truth: Extraction = {
      kind: "prescription",
      lab: null,
      prescription: {
        prescribedDate: def.date,
        prescriberSpecialty: def.specialty,
        items: def.items.map((it) => ({ ...it, confidence: def.handwritten ? (def.photo ? 0.66 : 0.74) : 0.96 })),
      },
    };
    const files = await render(page, rxHtml(def, i), path.join(OUT, def.id), !!def.photo, 100 + i);
    for (const f of files) {
      const h = sha(await readFile(f.file));
      manifest[h] = { id: def.id, file: path.basename(f.file), contentType: f.type, kind: "prescription", truth };
    }
    console.log("rx", def.id);
  }
  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 1) + "\n");
  await browser.close();
  console.log(Object.keys(manifest).length, "fixtures");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
