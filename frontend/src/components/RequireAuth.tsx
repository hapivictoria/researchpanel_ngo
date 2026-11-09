"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { Role, User } from "@/lib/api";
import { homeFor, useAuth } from "@/lib/auth";

export default function RequireAuth({
  roles,
  children,
}: {
  roles?: Role[];
  children: (user: User) => React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const allowed = user && (!roles || roles.includes(user.role));

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (!allowed) router.replace(homeFor(user));
  }, [loading, user, allowed, router]);

  if (loading || !allowed) {
    return <div className="py-24 text-center text-sm text-slate-500">Loading…</div>;
  }
  return <>{children(user)}</>;
}
