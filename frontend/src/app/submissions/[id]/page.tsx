"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import StatusBadge from "@/components/StatusBadge";
import { api, type Decision, type SubmissionDetail, type User } from "@/lib/api";
import { isPanel } from "@/lib/auth";
import { formatDate, formatDateTime } from "@/lib/format";

export default function SubmissionPage() {
  return <RequireAuth>{(user) => <SubmissionView user={user} />}</RequireAuth>;
}

function SubmissionView({ user }: { user: User }) {
  const { id } = useParams<{ id: string }>();
  const [sub, setSub] = useState<SubmissionDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getSubmission(id).then(setSub).catch((e) => setError(e.message));
  }, [id]);

  const back = isPanel(user.role) ? { href: "/panel", label: "Review queue" } : { href: "/dashboard", label: "Dashboard" };

  if (error) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">{error}</p>
        <Link href={back.href} className="mt-4 inline-block text-sm text-indigo-600 hover:underline">← {back.label}</Link>
      </div>
    );
  }
  if (!sub) return <p className="text-sm text-slate-500">Loading…</p>;

  const decided = sub.status === "approved" || sub.status === "rejected";
  const alreadyReviewed = sub.reviews.some((r) => r.reviewer.id === user.id);
  const canReview = isPanel(user.role) && !decided && !alreadyReviewed;
  const keywords = sub.keywords.split(",").map((k) => k.trim()).filter(Boolean);

  return (
    <div className="space-y-6">
      <Link href={back.href} className="text-sm text-slate-500 hover:text-slate-700">← {back.label}</Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <article className="card space-y-6 lg:col-span-2">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={sub.status} />
              <span className="text-sm text-slate-500">Submitted {formatDate(sub.created_at)}</span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-slate-900">{sub.title}</h1>
            <p className="mt-1 text-slate-600">{sub.authors}</p>
          </div>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Abstract</h2>
            <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-700">{sub.abstract}</p>
          </section>

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {keywords.map((k) => (
                <span key={k} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{k}</span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">{sub.file_name}</p>
              <p className="text-xs text-slate-500">Submitted by {sub.submitter.name}</p>
            </div>
            <button
              className="btn-secondary shrink-0"
              onClick={() => api.openFile(sub.id).catch((e) => alert(e.message))}
            >
              Open file
            </button>
          </div>
        </article>

        <aside className="space-y-6">
          {canReview && <ReviewForm id={sub.id} onDone={setSub} />}

          <section className="card">
            <h2 className="font-semibold text-slate-900">Panel decisions</h2>
            {sub.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No reviews yet.</p>
            ) : (
              <ul className="mt-4 space-y-4">
                {sub.reviews.map((r) => (
                  <li key={r.id} className="border-l-2 pl-3 text-sm" style={{ borderColor: r.decision === "approve" ? "#10b981" : "#f43f5e" }}>
                    <p className="font-medium text-slate-900">
                      {r.decision === "approve" ? "Approved" : "Rejected"}
                      <span className="font-normal text-slate-500"> · {r.reviewer.name}</span>
                    </p>
                    <p className="text-xs text-slate-400">{formatDateTime(r.created_at)}</p>
                    {r.comment && <p className="mt-1.5 text-slate-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function ReviewForm({ id, onDone }: { id: number; onDone: (s: SubmissionDetail) => void }) {
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(decision: Decision) {
    if (decision === "reject" && !comment.trim()) {
      setError("Please give a reason when rejecting.");
      return;
    }
    setBusy(decision);
    setError(null);
    try {
      onDone(await api.review(id, decision, comment));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your review");
      setBusy(null);
    }
  }

  return (
    <section className="card">
      <h2 className="font-semibold text-slate-900">Your decision</h2>
      <label htmlFor="comment" className="label mt-4">Comments for the researcher</label>
      <textarea
        id="comment"
        className="input min-h-28"
        placeholder="Required when rejecting"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          className="inline-flex items-center justify-center rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-500 disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => submit("reject")}
        >
          {busy === "reject" ? "Saving…" : "Reject"}
        </button>
        <button
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
          disabled={busy !== null}
          onClick={() => submit("approve")}
        >
          {busy === "approve" ? "Saving…" : "Approve"}
        </button>
      </div>
    </section>
  );
}
