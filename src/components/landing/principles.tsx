"use client";
import { animate, motion, useInView } from "motion/react";
import { Ban, Scale, Stethoscope } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  React.useEffect(() => {
    if (!inView || !ref.current) return;
    const el = ref.current;
    const c = animate(0, to, { duration: 1.4, ease: [0.25, 1, 0.5, 1], onUpdate: (v) => (el.textContent = `${Math.round(v)}${suffix}`) });
    return () => c.stop();
  }, [inView, to, suffix]);
  return (
    <span ref={ref} className="tabular">
      {to}
      {suffix}
    </span>
  );
}

export function Principles() {
  const t = useTranslations("landing.principles");
  const items = [
    { icon: Scale, title: t("p1Title"), body: t("p1Body") },
    { icon: Ban, title: t("p2Title"), body: t("p2Body") },
    { icon: Stethoscope, title: t("p3Title"), body: t("p3Body") },
  ];
  const stats = [
    { n: 40, s: "+", label: t("stat1") },
    { n: 3, s: "", label: t("stat2") },
    { n: 10, s: "", label: t("stat3") },
    { n: 0, s: "", label: t("stat4") },
  ];
  return (
    <section aria-labelledby="principles-title" className="px-3 sm:px-4">
      <div className="grain relative isolate mx-auto max-w-[84rem] overflow-hidden rounded-[2.5rem] bg-[#0a2a22] px-6 py-20 text-white sm:px-12 sm:py-28">
        <div aria-hidden className="animate-blob-a absolute -right-40 -top-40 size-[36rem] rounded-full bg-[radial-gradient(circle,hsl(160_70%_45%/0.35),transparent_60%)] blur-2xl" />
        <div aria-hidden className="animate-blob-b absolute -bottom-48 -left-32 size-[32rem] rounded-full bg-[radial-gradient(circle,hsl(24_100%_65%/0.18),transparent_60%)] blur-2xl" />
        <div className="relative mx-auto max-w-[var(--container-wide)]">
          <p className="text-small font-semibold text-[#8fe0c9]">{t("eyebrow")}</p>
          <h2 id="principles-title" className="mt-3 max-w-3xl font-display text-[2.5rem] leading-[1.05] tracking-[-0.015em] text-balance sm:text-[3.5rem]">
            {t("title")}
          </h2>
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {items.map(({ icon: Icon, title, body }, i) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-sm"
              >
                <Icon className="size-6 text-[#8fe0c9]" aria-hidden />
                <h3 className="mt-4 text-h3 font-semibold">{title}</h3>
                <p className="mt-2 text-small leading-relaxed text-white/75">{body}</p>
              </motion.div>
            ))}
          </div>
          <dl className="mt-14 grid grid-cols-2 gap-y-10 border-t border-white/10 pt-10 md:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label}>
                <dd className="font-display text-[3.5rem] leading-none text-white">
                  <Counter to={s.n} suffix={s.s} />
                </dd>
                <dt className="mt-2 text-small text-white/70">{s.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
