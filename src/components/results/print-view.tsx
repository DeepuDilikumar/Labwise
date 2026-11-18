import { getTranslations } from "next-intl/server";
import { StatusPill } from "@/components/ui/status-pill";
import { Logo } from "@/components/ui/logo";
import type { LoadedReport } from "@/server/views/report";
import { PrintTrigger } from "./print-trigger";

/** Static, print-friendly layout. Browser "Save as PDF" keeps Indic text shaping correct. */
export async function PrintView({ report }: { report: LoadedReport }) {
  const t = await getTranslations("print");
  const tr = await getTranslations("results");
  const tm = await getTranslations("marker");
  const trx = await getTranslations("rx");
  return (
    <div className="mx-auto max-w-[48rem] bg-white px-8 py-10 text-[#0f1a17] print:p-0">
      <PrintTrigger label={t("save")} hint={t("hint")} />
      <header className="flex items-center justify-between border-b border-[#e7e7e0] pb-4">
        <Logo />
        <p className="text-caption text-[#5f6b67]">{report.meta}</p>
      </header>
      {report.kind === "lab" ? (
        <>
          <h1 className="mt-6 font-display text-[2.25rem] leading-tight">{report.view.bigPicture.headline}</h1>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-body">
            {report.view.bigPicture.bullets.map((b) => <li key={b}>{b}</li>)}
          </ul>
          {report.view.urgent && <p className="mt-4 rounded-lg border border-[#eab8be] bg-[#f9e2e4] p-3 font-semibold">{tr("urgentTitle")}</p>}
          {report.view.groups.map((g) => (
            <section key={g.panel} className="mt-8 break-inside-avoid-page">
              <h2 className="text-h2 font-semibold">{g.title}</h2>
              <table className="mt-2 w-full text-small">
                <tbody>
                  {g.markers.map((m) => (
                    <tr key={m.id} className="border-b border-[#e7e7e0] align-top">
                      <td className="py-2 pr-3">
                        <p className="font-semibold">{m.name}</p>
                        {m.explanation && <p className="mt-0.5 text-caption text-[#3d4945]">{m.explanation.measures}</p>}
                        {m.explanation?.questions[0] && <p className="mt-1 text-caption italic text-[#5f6b67]">{tm("questions")}: “{m.explanation.questions[0]}”</p>}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 text-right font-semibold tabular">{m.valueLabel} <span className="font-normal text-[#5f6b67]">{m.unit}</span></td>
                      <td className="whitespace-nowrap py-2 pr-3 text-[#5f6b67]">{m.rangeLabel ?? "—"}</td>
                      <td className="py-2 text-right"><StatusPill size="sm" status={m.status} tone={m.tone} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
          <section className="mt-8 break-inside-avoid">
            <h2 className="text-h2 font-semibold">{tr("whoToSee")}</h2>
            <ul className="mt-2 space-y-1 text-small">
              {report.view.specialists.map((s) => <li key={s.id}><b>{s.label}</b> — {s.reason}</li>)}
            </ul>
          </section>
        </>
      ) : (
        <>
          <h1 className="mt-6 font-display text-[2.25rem] leading-tight">{trx("title", { count: report.view.items.length })}</h1>
          <p className="mt-2 font-semibold">{trx("followDoctor")}</p>
          {report.view.items.map((i) => (
            <section key={i.id} className="mt-6 break-inside-avoid border-b border-[#e7e7e0] pb-4">
              <h2 className="text-h3 font-semibold">{i.written}</h2>
              {i.brandNote && <p className="text-caption text-[#5f6b67]">{i.brandNote}</p>}
              <p className="mt-2 text-small">{i.howToTake.map((h) => `${h.label}: ${h.value}`).join(" · ")}</p>
              {i.usedFor && <p className="mt-1 text-small text-[#3d4945]">{i.usedFor}</p>}
              {i.confirmWithPharmacist && <p className="mt-1 text-caption font-semibold text-[#855400]">{trx("confirmNote")}</p>}
            </section>
          ))}
        </>
      )}
      <footer className="mt-10 border-t border-[#e7e7e0] pt-4 text-caption text-[#5f6b67]">
        <p>{tr("disclaimer")}</p>
        <p className="mt-1">{t("watermark")}</p>
      </footer>
    </div>
  );
}
