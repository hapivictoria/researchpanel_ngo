import type { SubmissionStatus } from "@/lib/api";

const STYLES: Record<SubmissionStatus, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-amber-50 text-amber-700 ring-amber-600/20" },
  under_review: { label: "Under review", className: "bg-sky-50 text-sky-700 ring-sky-600/20" },
  approved: { label: "Approved", className: "bg-emerald-50 text-emerald-700 ring-emerald-600/20" },
  rejected: { label: "Rejected", className: "bg-rose-50 text-rose-700 ring-rose-600/20" },
};

export const statusLabel = (s: SubmissionStatus) => STYLES[s].label;

export default function StatusBadge({ status }: { status: SubmissionStatus }) {
  const { label, className } = STYLES[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}
