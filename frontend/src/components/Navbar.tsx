"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { isPanel, useAuth } from "@/lib/auth";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const links = !user
    ? []
    : isPanel(user.role)
      ? [{ href: "/panel", label: "Review queue" }]
      : [
        { href: "/dashboard", label: "My submissions" },
        { href: "/submissions/new", label: "Submit research" },
      ];

  const logo = (
    <>
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">R</span>
      <span className="hidden sm:inline">ResearchReview</span>
    </>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-8">
          {user ? (
            <div className="flex items-center gap-2 font-semibold text-slate-900">{logo}</div>
          ) : (
            <Link href="/" className="flex items-center gap-2 font-semibold text-slate-900">{logo}</Link>
          )}
          <nav className="flex gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-md px-3 py-2 text-sm font-medium ${pathname === l.href ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium text-slate-900">{user.name}</p>
              <p className="text-xs capitalize text-slate-500">{user.role}</p>
            </div>
            <button
              onClick={() => {
                logout();
                router.push("/login");
              }}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link href="/login" className="px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-slate-900">
              Sign in
            </Link>
            <Link href="/register" className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500">
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
