"use client";
import { Bell, FileText, Inbox, Moon, Plus, Sun, Trash2, Upload } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, Eyebrow } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Disclaimer } from "@/components/ui/disclaimer";
import { Dropzone } from "@/components/ui/dropzone";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Logo } from "@/components/ui/logo";
import { MarkerCard, type MarkerCardData } from "@/components/ui/marker-card";
import { OverviewStrip } from "@/components/ui/overview-strip";
import { PaymentTrust, PaywallCard } from "@/components/ui/paywall-card";
import { ProcessingSteps } from "@/components/ui/processing-steps";
import { RangeGauge } from "@/components/ui/range-gauge";
import { Segmented } from "@/components/ui/segmented";
import { MarkerCardSkeleton, Skeleton } from "@/components/ui/skeleton";
import { SpecialistCard } from "@/components/ui/specialist-card";
import { EmptyState, ErrorState, InlineNotice } from "@/components/ui/states";
import { StatusPill } from "@/components/ui/status-pill";
import { SummaryCard } from "@/components/ui/summary-card";
import { LanguageSwitcher, RegionSwitcher } from "@/components/ui/switchers";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toast";
import { TrendChart, type TrendPoint } from "@/components/ui/trend-chart";
import { UrgencyBanner } from "@/components/ui/urgency-banner";
import { toneFor } from "@/lib/domain/gauge";
import type { MarkerStatus } from "@/lib/domain/status";
import type { Locale, RegionId } from "@regions";

/* All sample data below is synthetic. */
const mk = (d: Omit<MarkerCardData, "tone">): MarkerCardData => ({ ...d, tone: toneFor(d.status, d.value, d.range) });

const markers: MarkerCardData[] = [
  mk({
    id: "hba1c",
    name: "HbA1c",
    valueLabel: "6.1",
    value: 6.1,
    unit: "%",
    status: "high",
    range: { low: 4, high: 5.6 },
    rangeLabel: "4.0 – 5.6 %",
    lowLabel: "4.0",
    highLabel: "5.6",
    labFlag: "H",
    explanation: {
      measures: "HbA1c shows your average blood sugar over roughly the last two to three months. It's measured as the share of haemoglobin that has sugar attached.",
      reasons: ["Recent weeks of higher blood sugar", "Some types of anaemia can affect the reading", "Differences between lab methods"],
      questions: ["What does this number mean for me, given my history?", "Should this be checked again, and when?"],
    },
  }),
  mk({
    id: "tsh",
    name: "TSH (thyroid stimulating hormone)",
    valueLabel: "2.4",
    value: 2.4,
    unit: "µIU/mL",
    status: "in_range",
    range: { low: 0.4, high: 4.0 },
    rangeLabel: "0.40 – 4.00 µIU/mL",
    lowLabel: "0.40",
    highLabel: "4.00",
    explanation: {
      measures: "TSH is a hormone from the pituitary gland that tells the thyroid how much hormone to make.",
      questions: ["Is there anything about my thyroid you'd like to keep an eye on?"],
    },
  }),
  mk({
    id: "vitd",
    name: "Vitamin D (25-OH)",
    valueLabel: "18",
    value: 18,
    unit: "ng/mL",
    status: "no_range",
    range: { low: null, high: null },
    edited: true,
    explanation: { measures: "This measures the main stored form of vitamin D in your blood.", questions: ["What range does your clinic use for vitamin D?"] },
  }),
];

const gauges: { label: string; status: MarkerStatus; value: number; low: number | null; high: number | null }[] = [
  { label: "In range", status: "in_range", value: 92, low: 70, high: 100 },
  { label: "Slightly high", status: "high", value: 102, low: 70, high: 100 },
  { label: "High", status: "high", value: 128, low: 70, high: 100 },
  { label: "Low", status: "low", value: 9.8, low: 12, high: 15.5 },
  { label: "Lab-flagged critical", status: "critical_high", value: 6.8, low: 3.5, high: 5.1 },
  { label: "Upper bound only (< 200)", status: "in_range", value: 182, low: null, high: 200 },
  { label: "Lower bound only (> 40)", status: "low", value: 36, low: 40, high: null },
];

const trend: TrendPoint[] = [
  ["2025-11-02", "Nov 2025", 5.9, "high"],
  ["2026-02-14", "Feb 2026", 6.3, "high"],
  ["2026-05-20", "May 2026", 6.0, "high"],
  ["2026-08-30", "Aug 2026", 5.6, "in_range"],
  ["2026-11-10", "Nov 2026", 5.4, "in_range"],
].map(([date, dateLabel, value, status]) => ({
  date: date as string,
  dateLabel: dateLabel as string,
  value: value as number,
  valueLabel: String(value),
  status: status as MarkerStatus,
  tone: toneFor(status as MarkerStatus, value as number, { low: 4, high: 5.6 }),
}));

function Section({ id, title, desc, children }: { id: string; title: string; desc?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-12 first:border-t-0 first:pt-4">
      <h2 className="text-h2 font-semibold text-ink">{title}</h2>
      {desc && <p className="mt-1 max-w-xl text-small text-ink-3">{desc}</p>}
      <div className="mt-6">{children}</div>
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-caption font-medium text-ink-3">{children}</p>;
}

const SWATCHES = [
  ["bg", "--bg"], ["surface", "--surface"], ["surface-2", "--surface-2"], ["line", "--line"],
  ["ink", "--ink"], ["ink-2", "--ink-2"], ["ink-3", "--ink-3"], ["primary", "--primary"],
  ["primary-soft", "--primary-soft"], ["ok", "--ok"], ["warn", "--warn"], ["out", "--out"], ["crit", "--crit"],
] as const;

const NAV = [
  ["foundations", "Foundations"], ["buttons", "Buttons"], ["inputs", "Inputs"], ["status", "Status"],
  ["gauges", "Range gauge"], ["markers", "Marker card"], ["summary", "Summary"], ["specialist", "Specialist"],
  ["trends", "Trend chart"], ["upload", "Upload"], ["processing", "Processing"], ["feedback", "Toast & dialog"],
  ["states", "Empty & error"], ["switchers", "Switchers"], ["paywall", "Paywall"],
] as const;

function subscribeTheme(cb: () => void) {
  const mo = new MutationObserver(cb);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
  return () => mo.disconnect();
}

export function Gallery({ region, locales, methods }: { region: RegionId; locales: readonly Locale[]; methods: readonly string[] }) {
  const theme = React.useSyncExternalStore(
    subscribeTheme,
    () => (document.documentElement.dataset.theme === "dark" ? "dark" : "light"),
    () => "light" as const,
  );
  const [step, setStep] = React.useState(0);
  const [seg, setSeg] = React.useState<"conventional" | "si">("conventional");
  const [sw, setSw] = React.useState(true);

  React.useEffect(() => {
    const id = setInterval(() => setStep((s) => (s + 1) % 4), 1800);
    return () => clearInterval(id);
  }, []);
  const flip = () => {
    const next = theme === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themePref = next;
  };

  return (
    <div className="min-h-dvh">
      <header className="glass sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[var(--container-wide)] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo />
            <span className="hidden rounded-full border border-line px-2 py-0.5 text-caption text-ink-3 sm:inline">Design system</span>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher locales={locales} compact />
            <Button variant="ghost" size="icon" onClick={flip} aria-label={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}>
              {theme === "light" ? <Moon /> : <Sun />}
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[var(--container-wide)] px-4 sm:px-6 lg:grid lg:grid-cols-[180px_1fr] lg:gap-12">
        <nav aria-label="Sections" className="hidden lg:block">
          <ul className="sticky top-24 space-y-0.5 py-10 text-small">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-[8px] px-2.5 py-1.5 text-ink-3 transition-colors hover:bg-surface-2 hover:text-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main id="main" className="min-w-0 pb-24 pt-8">
          <div className="mb-6">
            <Eyebrow>Labwise</Eyebrow>
            <h1 className="mt-2 font-display text-display text-ink">Design system</h1>
            <p className="mt-2 max-w-xl text-lead text-ink-2">Every component and state in one place. All data shown is synthetic.</p>
          </div>

          <Section id="foundations" title="Foundations" desc="Near-white paper, near-black ink, one emerald primary used sparingly. Status always pairs icon, label and colour.">
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-7">
              {SWATCHES.map(([name, v]) => (
                <div key={name}>
                  <div className="h-14 rounded-[12px] border border-line" style={{ background: `var(${v})` }} />
                  <p className="mt-1.5 text-caption font-medium text-ink-2">{name}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              <div className="space-y-4">
                <Label>Type scale</Label>
                <p className="font-display text-display text-ink">Clear and calm</p>
                <p className="text-h1 font-semibold text-ink">Heading one</p>
                <p className="text-h2 font-semibold text-ink">Heading two</p>
                <p className="text-h3 font-semibold text-ink">Heading three</p>
                <p className="text-body text-ink-2">Body text is set at 16px with a comfortable 1.6 line height, so longer explanations stay easy to read.</p>
                <p className="text-small text-ink-3">Small text for supporting details.</p>
                <p className="text-value font-semibold tabular text-ink">142.6 <span className="text-small font-normal text-ink-3">mg/dL</span></p>
              </div>
              <div className="space-y-4">
                <Label>Indic scripts (tuned line height)</Label>
                <p lang="hi" className="text-h2 font-semibold text-ink">आपकी रिपोर्ट, आसान भाषा में</p>
                <p lang="hi" className="text-body text-ink-2">यह मापता है कि पिछले दो-तीन महीनों में आपका औसत ब्लड शुगर कितना रहा।</p>
                <p lang="ml" className="text-h2 font-semibold text-ink">നിങ്ങളുടെ റിപ്പോർട്ട്, ലളിതമായ ഭാഷയിൽ</p>
                <p lang="ml" className="text-body text-ink-2">കഴിഞ്ഞ രണ്ടോ മൂന്നോ മാസത്തെ ശരാശരി രക്തത്തിലെ പഞ്ചസാരയുടെ അളവാണ് ഇത് കാണിക്കുന്നത്.</p>
                <Label>Radii & depth</Label>
                <div className="flex flex-wrap gap-3">
                  {["sm", "md", "lg", "xl", "2xl"].map((r, i) => (
                    <div
                      key={r}
                      className="grid size-16 place-items-center border border-line bg-surface text-caption text-ink-3"
                      style={{ borderRadius: `var(--radius-${r})`, boxShadow: `var(--shadow-${["xs", "sm", "md", "lg", "lg"][i]})` }}
                    >
                      {r}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

          <Section id="buttons" title="Buttons">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="soft">Soft</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger"><Trash2 /> Delete</Button>
                <Button variant="link">Link</Button>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg"><Upload /> Large with icon</Button>
                <Button size="icon" variant="secondary" aria-label="Add"><Plus /></Button>
                <Button loading>Saving</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </Section>

          <Section id="inputs" title="Inputs">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Name" htmlFor="g-name" hint="As you'd like it shown on reports.">
                <Input placeholder="e.g. Asha" />
              </Field>
              <Field label="Mobile number" htmlFor="g-phone" error="Please enter a valid mobile number.">
                <Input defaultValue="12345" inputMode="tel" />
              </Field>
              <Field label="Relation" htmlFor="g-rel">
                <Select defaultValue="mother">
                  <option value="self">Me</option>
                  <option value="mother">Mother</option>
                  <option value="father">Father</option>
                </Select>
              </Field>
              <Field label="Disabled" htmlFor="g-dis">
                <Input disabled defaultValue="Read only" />
              </Field>
              <Field label="Note" htmlFor="g-note" optional="Optional" className="sm:col-span-2">
                <Textarea placeholder="Anything you want to remember to ask" />
              </Field>
              <div className="flex items-center justify-between rounded-[14px] border border-line bg-surface p-4">
                <div>
                  <p className="text-small font-medium text-ink">Larger text</p>
                  <p className="text-caption text-ink-3">Easier reading everywhere</p>
                </div>
                <Switch checked={sw} onCheckedChange={setSw} aria-label="Larger text" />
              </div>
              <div className="flex items-center">
                <Segmented
                  label="Units"
                  value={seg}
                  onChange={setSeg}
                  options={[
                    { value: "conventional", label: "mg/dL" },
                    { value: "si", label: "mmol/L" },
                  ]}
                />
              </div>
            </div>
          </Section>

          <Section id="status" title="Status pills" desc="Computed in code from the printed range. Icon + label + colour, never colour alone.">
            <div className="flex flex-wrap gap-2">
              <StatusPill status="in_range" tone="ok" />
              <StatusPill status="high" tone="borderline" />
              <StatusPill status="low" tone="borderline" />
              <StatusPill status="high" tone="out" />
              <StatusPill status="low" tone="out" />
              <StatusPill status="critical_high" tone="critical" />
              <StatusPill status="critical_low" tone="critical" />
              <StatusPill status="no_range" tone="neutral" />
              <StatusPill status="unparsed" tone="neutral" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusPill size="sm" status="in_range" tone="ok" />
              <StatusPill size="sm" status="high" tone="out" />
              <StatusPill size="sm" status="critical_low" tone="critical" />
            </div>
          </Section>

          <Section id="gauges" title="Range gauge" desc="Shaded band is the range printed on the report; the dot is the value. Values far outside pin to the edge.">
            <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
              {gauges.map((g) => {
                const tone = toneFor(g.status, g.value, { low: g.low, high: g.high });
                return (
                  <div key={g.label}>
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-small text-ink-2">{g.label}</span>
                      <span className="text-small font-medium tabular text-ink">{g.value}</span>
                    </div>
                    <RangeGauge value={g.value} range={{ low: g.low, high: g.high }} tone={tone} />
                  </div>
                );
              })}
            </div>
          </Section>

          <Section id="markers" title="Marker card">
            <div className="grid gap-4 lg:grid-cols-2">
              {markers.map((m, i) => (
                <MarkerCard key={m.id} data={m} index={i} />
              ))}
              <MarkerCardSkeleton />
            </div>
          </Section>

          <Section id="summary" title="Summary, overview & urgency">
            <div className="space-y-4">
              <SummaryCard
                eyebrow="The big picture"
                title="Most of your results are in range."
                meta="Sample Diagnostics · 10 Nov 2026"
                bullets={[
                  "22 of 26 results are within your lab's printed ranges.",
                  "Your blood sugar markers are a little above range — worth discussing at your next visit.",
                  "Your thyroid, kidney and liver results are all in range.",
                ]}
                reassurance="Results slightly outside a range are common and often have simple explanations. Your doctor can tell you what they mean for you."
              />
              <OverviewStrip
                items={[
                  { label: "In range", value: 22, tone: "ok" },
                  { label: "Worth discussing", value: 3, tone: "attention" },
                  { label: "No range", value: 1, tone: "neutral" },
                ]}
              />
              <UrgencyBanner
                title="Please speak to a doctor soon about this result."
                body="Your lab marked potassium as critical. This doesn't mean something is wrong, but it's best checked quickly."
              />
              <InlineNotice tone="warn" icon={<Bell />}>
                We couldn&apos;t read two values clearly. Please confirm them before we explain your report.
              </InlineNotice>
              <Disclaimer>Labwise explains reports. It doesn&apos;t diagnose or replace a doctor.</Disclaimer>
            </div>
          </Section>

          <Section id="specialist" title="Specialist card">
            <SpecialistCard
              title="Who to see"
              intro="Based on the results that are outside range. A general physician is always a good place to start."
              findLabel="Find near me"
              items={[
                { id: "pc", label: "General physician", reason: "Can review the whole report with you and refer if needed.", mapsUrl: "https://www.google.com/maps/search/general+physician+near+me", primary: true },
                { id: "endo", label: "Endocrinologist", reason: "Specialises in blood sugar and hormones (HbA1c, glucose).", mapsUrl: "https://www.google.com/maps/search/endocrinologist+near+me" },
              ]}
            />
          </Section>

          <Section id="trends" title="Trend chart">
            <div className="grid gap-4 lg:grid-cols-2">
              <TrendChart title="HbA1c" unit="%" bandLow={4} bandHigh={5.6} points={trend} />
              <Card>
                <EmptyState
                  icon={<FileText />}
                  title="Trends appear after two reports"
                  body="Add another report for this person and we&apos;ll chart how each result changes over time."
                  action={<Button variant="secondary"><Plus /> Add report</Button>}
                />
              </Card>
            </div>
          </Section>

          <Section id="upload" title="Upload">
            <div className="grid gap-4 lg:grid-cols-2">
              <Dropzone onFiles={(f) => toast({ title: `${f.length} file(s) selected`, tone: "success" })} onCamera={() => toast({ title: "Camera opens here" })} />
              <Dropzone onFiles={() => {}} error="That file is larger than 20 MB. Try a smaller PDF or a photo." />
            </div>
          </Section>

          <Section id="processing" title="Processing">
            <div className="grid gap-6 sm:grid-cols-2">
              <Card className="p-6">
                <ProcessingSteps steps={["Reading your report", "Checking ranges", "Writing it in plain language"]} active={step} />
              </Card>
              <Card className="space-y-3 p-6">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-3/4" />
              </Card>
            </div>
          </Section>

          <Section id="feedback" title="Toast & dialog">
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => toast({ title: "Saved to Asha's reports", tone: "success" })}>Success toast</Button>
              <Button variant="secondary" onClick={() => toast({ title: "Couldn't upload", body: "Check your connection and try again.", tone: "error" })}>Error toast</Button>
              <Button variant="secondary" onClick={() => toast({ title: "Report deleted", action: { label: "Undo", onClick: () => toast({ title: "Restored", tone: "success" }) } })}>Toast with action</Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="danger"><Trash2 /> Delete report</Button>
                </DialogTrigger>
                <DialogContent title="Delete this report?" description="This permanently removes the report, its photos and its explanation. This can't be undone.">
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                    <DialogClose asChild><Button variant="danger" onClick={() => toast({ title: "Report deleted", tone: "success" })}>Delete permanently</Button></DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Section>

          <Section id="states" title="Empty, error & offline">
            <div className="grid gap-4 lg:grid-cols-3">
              <Card><EmptyState icon={<Inbox />} title="No reports yet" body="Add your first report and we'll explain it in plain language." action={<Button><Plus /> Add report</Button>} /></Card>
              <Card><ErrorState title="We couldn't read this file" body="It may be blurry or password-protected. Try a clearer photo or a different PDF." action={<Button variant="secondary">Try again</Button>} /></Card>
              <Card><ErrorState offline title="You're offline" body="Check your connection. Anything you've saved is still here." /></Card>
            </div>
          </Section>

          <Section id="switchers" title="Language & region">
            <div className="flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-surface p-2">
              <LanguageSwitcher locales={locales.length > 1 ? locales : ["en", "hi", "ml"]} />
              <RegionSwitcher region={region} />
            </div>
          </Section>

          <Section id="paywall" title="Paywall">
            <div className="grid gap-4 sm:grid-cols-2">
              <PaywallCard plan={{ id: "single_report", name: "One report", price: "₹49", cadence: "per report", features: ["Full explanation", "Questions for your doctor", "Share card and PDF"], cta: "Pay ₹49" }} onSelect={() => {}} />
              <PaywallCard plan={{ id: "monthly", name: "Family", price: "₹149", cadence: "per month", badge: "Best for families", highlighted: true, features: ["Up to 10 reports a month", "Profiles for the whole family", "Trends across reports", "Cancel any time"], cta: "Start monthly" }} onSelect={() => {}} />
            </div>
            <PaymentTrust className="mt-6" methods={methods} note="Secure checkout. We never see your card or UPI details." />
          </Section>
        </main>
      </div>
    </div>
  );
}
