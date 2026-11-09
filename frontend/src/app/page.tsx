"use client";

import Link from "next/link";
import { homeFor, useAuth } from "@/lib/auth";

const STEPS = [
  { title: "Submit", text: "Researchers upload their paper (PDF or Word) with title, abstract and keywords." },
  { title: "Review", text: "Panel members read the work and record an approve or reject decision with comments." },
  { title: "Decide", text: "Researchers track status in real time and see the panel's feedback." },
];

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="py-10 sm:py-16">
      <section className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Research review portal</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          From submission to decision, in one place.
        </h1>
        <p className="mt-5 text-lg text-slate-600">
          Upload your research, let the review panel assess it, and follow every decision with clear feedback.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          {user ? (
            <Link href={homeFor(user)} className="btn-primary px-6 py-3">
              Go to your dashboard
            </Link>
          ) : (
            <>
              <Link href="/register" className="btn-primary px-6 py-3">
                Submit your research
              </Link>
              <Link href="/login" className="btn-secondary px-6 py-3">
                Panel sign in
              </Link>
            </>
          )}
        </div>
      </section>

      <section className="mx-auto mt-16 grid max-w-5xl gap-6 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="card">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-indigo-50 text-sm font-semibold text-indigo-700">
              {i + 1}
            </span>
            <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{s.text}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
