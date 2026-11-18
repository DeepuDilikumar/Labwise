const MARKERS = [
  "Haemoglobin", "HbA1c", "Fasting glucose", "TSH", "Free T4", "Vitamin D", "Vitamin B12", "LDL cholesterol",
  "HDL cholesterol", "Triglycerides", "Creatinine", "eGFR", "Urea", "ALT", "AST", "Bilirubin", "Ferritin",
  "Platelets", "WBC count", "Sodium", "Potassium", "CRP", "Uric acid", "Calcium",
];

export function Marquee({ label }: { label: string }) {
  const row = (hidden?: boolean) => (
    <ul className="flex shrink-0 items-center gap-3 pr-3" aria-hidden={hidden || undefined}>
      {MARKERS.map((m, i) => (
        <li
          key={m}
          className={[
            "whitespace-nowrap rounded-full border px-4 py-2 text-small font-medium",
            ["bg-mint text-mint-ink border-transparent", "bg-surface text-ink-2 border-line", "bg-peach text-peach-ink border-transparent", "bg-surface text-ink-2 border-line", "bg-lilac text-lilac-ink border-transparent", "bg-sky text-sky-ink border-transparent"][i % 6],
          ].join(" ")}
        >
          {m}
        </li>
      ))}
    </ul>
  );
  return (
    <section aria-label={label} className="mask-fade-x overflow-hidden py-6">
      <div className="animate-marquee flex w-max hover:[animation-play-state:paused]">
        {row()}
        {row(true)}
      </div>
    </section>
  );
}
