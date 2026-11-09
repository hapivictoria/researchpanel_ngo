"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import StatCards from "@/components/StatCards";
import SubmissionTable from "@/components/SubmissionTable";
import { api, type Stats, type Submission, type User } from "@/lib/api";

export default function DashboardPage() {
  return <RequireAuth roles={["researcher"]}>{(user) => <Dashboard user={user} />}</RequireAuth>;
}

function Dashboard({ user }: { user: User }) {
  const [subs, setSubs] = useState<Submission[] | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.listSubmissions(), api.stats()])
      .then(([s, st]) => {
        setSubs(s);
        setStats(st);
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Welcome, {user.name.split(" ")[0]}</h1>
          <p className="mt-1 text-sm text-slate-500">Track the status of your research submissions.</p>
        </div>
        <Link href="/submissions/new" className="btn-primary">+ New submission</Link>
      </div>

      <StatCards stats={stats} />

      {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      {subs === null && !error ? (
        <p className="text-sm text-slate-500">Loading…</p>
      ) : (
        subs && (
          <section>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">My submissions</h2>
            <SubmissionTable
              submissions={subs}
              empty={
                <>
                  You haven&apos;t submitted anything yet.{" "}
                  <Link href="/submissions/new" className="font-medium text-indigo-600 hover:underline">Submit your first paper</Link>
                </>
              }
            />
          </section>
        )
      )}
    </div>
  );
}
