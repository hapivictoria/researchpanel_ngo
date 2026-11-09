import Link from "next/link";
import type { Submission } from "@/lib/api";
import { formatDate } from "@/lib/format";
import StatusBadge from "./StatusBadge";

export default function SubmissionTable({
  submissions,
  showSubmitter = false,
  empty,
}: {
  submissions: Submission[];
  showSubmitter?: boolean;
  empty: React.ReactNode;
}) {
  if (submissions.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center text-sm text-slate-500">
        {empty}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-slate-200 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {submissions.map((s) => (
        <li key={s.id}>
          <Link href={`/submissions/${s.id}`} className="flex flex-col gap-2 px-5 py-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-900">{s.title}</p>
              <p className="mt-0.5 truncate text-sm text-slate-500">
                {s.authors}
                {showSubmitter && <> · submitted by {s.submitter.name}</>}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-4 text-sm text-slate-500">
              <span>{formatDate(s.created_at)}</span>
              <StatusBadge status={s.status} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
