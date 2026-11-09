"use client";

import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import StatCards from "@/components/StatCards";
import SubmissionTable from "@/components/SubmissionTable";
import { api, type Stats, type Submission, type SubmissionStatus } from "@/lib/api";

const TABS: { key: SubmissionStatus | "all"; label: string }[] = [
  { key: "pending", label: "Awaiting review" },
  { key: "under_review", label: "In progress" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];

export default function PanelPage() {
  return <RequireAuth roles={["panel", "admin"]}>{() => <ReviewQueue />}</RequireAuth>;
}

function ReviewQueue() {
  const [tab, setTab] = useState<SubmissionStatus | "all">("pending");
  const [query, setQuery] = useState("");
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => {
      api
        .listSubmissions({ status: tab === "all" ? undefined : tab, q: query || undefined })
        .then((s) => {
          setSubs(s);
          setError(null);
        })
        .catch((e) => setError(e.message));
    }, 250);
    return () => clearTimeout(handle);
  }, [tab, query]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Review queue</h1>
        <p className="mt-1 text-sm text-slate-500">Read submissions and record your decision.</p>
      </div>

      <StatCards stats={stats} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <input
          className="input sm:w-64"
          placeholder="Search title, author, keyword"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {subs === null ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        <SubmissionTable submissions={subs} showSubmitter empty="Nothing here right now." />
      )}
    </div>
  );
}
