"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { homeFor, useAuth } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { login, register } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const isLogin = mode === "login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const user = isLogin ? await login(email, password) : await register(name, email, password);
      router.push(homeFor(user));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md py-8">
      <div className="card">
        <h1 className="text-2xl font-semibold text-slate-900">{isLogin ? "Sign in" : "Create a researcher account"}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {isLogin ? "Researchers and panel members sign in here." : "Submit your work for panel review."}
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <div>
              <label className="label" htmlFor="name">Full name</label>
              <input id="name" className="input" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          )}
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input id="email" type="email" className="input" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="input"
              required
              minLength={isLogin ? undefined : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={busy}>
            {busy ? "Please wait…" : isLogin ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isLogin ? (
            <>No account? <Link href="/register" className="font-medium text-indigo-600 hover:underline">Register</Link></>
          ) : (
            <>Already registered? <Link href="/login" className="font-medium text-indigo-600 hover:underline">Sign in</Link></>
          )}
        </p>
      </div>

      {isLogin && (
        <div className="mt-4 rounded-xl border border-dashed border-slate-300 p-4 text-xs text-slate-500">
          <p className="font-medium text-slate-600">Demo accounts (password: demo1234)</p>
          <p className="mt-1">researcher@demo.com · panel@demo.com · panel2@demo.com</p>
        </div>
      )}
    </div>
  );
}
