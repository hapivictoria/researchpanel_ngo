"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import RequireAuth from "@/components/RequireAuth";
import { api } from "@/lib/api";

const MAX_MB = 20;
const ACCEPT = ".pdf,.doc,.docx";

export default function NewSubmissionPage() {
  return <RequireAuth roles={["researcher"]}>{() => <NewSubmissionForm />}</RequireAuth>;
}

function NewSubmissionForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function pickFile(f: File | undefined) {
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setError(`File is larger than ${MAX_MB} MB`);
      return;
    }
    setError(null);
    setFile(f);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!file) {
      setError("Please attach your paper");
      return;
    }
    const form = new FormData(e.currentTarget);
    form.set("file", file);
    setBusy(true);
    setError(null);
    try {
      const sub = await api.createSubmission(form);
      router.push(`/submissions/${sub.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-700">← Back to dashboard</Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">Submit research</h1>
      <p className="mt-1 text-sm text-slate-500">Your submission will be sent to the review panel.</p>

      <form onSubmit={onSubmit} className="card mt-6 space-y-5">
        <div>
          <label className="label" htmlFor="title">Title</label>
          <input id="title" name="title" className="input" required minLength={3} maxLength={300} />
        </div>
        <div>
          <label className="label" htmlFor="authors">Authors</label>
          <input id="authors" name="authors" className="input" required placeholder="e.g. A. Lovelace, C. Babbage" />
        </div>
        <div>
          <label className="label" htmlFor="abstract">Abstract</label>
          <textarea id="abstract" name="abstract" className="input min-h-36" required minLength={10} />
        </div>
        <div>
          <label className="label" htmlFor="keywords">Keywords <span className="font-normal text-slate-400">(optional, comma separated)</span></label>
          <input id="keywords" name="keywords" className="input" placeholder="e.g. climate, public health" />
        </div>

        <div>
          <span className="label">Paper</span>
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files[0]);
            }}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
              dragging ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-slate-400"
            }`}
          >
            <input type="file" accept={ACCEPT} className="sr-only" onChange={(e) => pickFile(e.target.files?.[0])} />
            {file ? (
              <>
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="mt-1 text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB · click to replace</p>
              </>
            ) : (
              <>
                <p className="font-medium text-slate-700">Drop your file here or click to browse</p>
                <p className="mt-1 text-xs text-slate-500">PDF or Word, up to {MAX_MB} MB</p>
              </>
            )}
          </label>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}

        <div className="flex justify-end gap-3">
          <Link href="/dashboard" className="btn-secondary">Cancel</Link>
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Uploading…" : "Submit for review"}
          </button>
        </div>
      </form>
    </div>
  );
}
