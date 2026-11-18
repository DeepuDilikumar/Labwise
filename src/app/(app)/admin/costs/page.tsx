import { notFound } from "next/navigation";
import { requireApp } from "@/server/context";
import { asService } from "@/server/db/client";
import { env } from "@/server/env";

/** Admin-only: token and cost per stage/day. Contains no report content. */
export default async function CostsPage() {
  const { session, profile } = await requireApp("/admin/costs");
  const admins = env().ADMIN_EMAILS.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  if (profile.role !== "admin" && !admins.includes(session.contact.toLowerCase())) notFound();
  const [daily, perReport] = await asService(async (sql) => [
    await sql.query<{ day: string; stage: string; provider: string; calls: number; input: number; output: number; usd: number; cached: number }>(
      `select to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day, stage, provider, count(*)::int as calls,
              sum(input_tokens)::int as input, sum(output_tokens)::int as output, (sum(cost_usd_micros) / 1e6)::float as usd,
              count(*) filter (where cached)::int as cached
       from public.ai_usage group by 1,2,3 order by 1 desc, 2 limit 120`,
    ),
    await sql.query<{ reports: number; avg_usd: number; max_usd: number }>(
      `select count(*)::int as reports, coalesce(avg(c),0)::float as avg_usd, coalesce(max(c),0)::float as max_usd
       from (select document_id, sum(cost_usd_micros)/1e6 as c from public.ai_usage where document_id is not null group by 1) x`,
    ),
  ]);
  const p = perReport[0];
  return (
    <div className="mx-auto max-w-[var(--container-wide)] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-h1 font-semibold text-ink">AI usage and cost</h1>
      <p className="mt-1 text-small text-ink-3">Admin only. Token counts and estimated cost; no prompts, outputs or report content are stored.</p>
      <dl className="mt-6 grid grid-cols-3 gap-3">
        {[["Reports", String(p.reports)], ["Avg cost / report", `$${p.avg_usd.toFixed(4)}`], ["Max cost / report", `$${p.max_usd.toFixed(4)}`]].map(([k, v]) => (
          <div key={k} className="rounded-[16px] border border-line bg-surface p-4">
            <dt className="text-caption text-ink-3">{k}</dt>
            <dd className="mt-1 text-h2 font-semibold tabular text-ink">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 overflow-x-auto rounded-[16px] border border-line bg-surface">
        <table className="w-full text-small">
          <thead className="bg-surface-2 text-left text-caption text-ink-3">
            <tr>{["Day", "Stage", "Provider", "Calls", "Cached", "Input tok", "Output tok", "USD"].map((h) => <th key={h} className="px-3 py-2 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line tabular">
            {daily.map((r, i) => (
              <tr key={i}>
                <td className="px-3 py-2">{r.day}</td><td className="px-3 py-2">{r.stage}</td><td className="px-3 py-2">{r.provider}</td>
                <td className="px-3 py-2">{r.calls}</td><td className="px-3 py-2">{r.cached}</td><td className="px-3 py-2">{r.input}</td>
                <td className="px-3 py-2">{r.output}</td><td className="px-3 py-2">${r.usd.toFixed(4)}</td>
              </tr>
            ))}
            {daily.length === 0 && <tr><td colSpan={8} className="px-3 py-6 text-center text-ink-3">No usage yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
