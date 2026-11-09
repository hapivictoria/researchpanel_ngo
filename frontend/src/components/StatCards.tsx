import type { Stats } from "@/lib/api";

export default function StatCards({ stats }: { stats: Stats | null }) {
  const items = [
    { label: "Total", value: stats?.total, accent: "text-slate-900" },
    { label: "Pending", value: stats ? stats.pending + stats.under_review : undefined, accent: "text-amber-600" },
    { label: "Approved", value: stats?.approved, accent: "text-emerald-600" },
    { label: "Rejected", value: stats?.rejected, accent: "text-rose-600" },
  ];
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{it.label}</p>
          <p className={`mt-1 text-2xl font-semibold tabular-nums ${it.accent}`}>{it.value ?? "–"}</p>
        </div>
      ))}
    </div>
  );
}
