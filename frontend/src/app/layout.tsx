import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ResearchReview",
  description: "Submit research and get it reviewed by an expert panel.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900">
        <AuthProvider>
          {/* URL hooks (usePathname/useParams) must render inside Suspense in this Next.js version. */}
          <Suspense fallback={<div className="h-16 border-b border-slate-200 bg-white" />}>
            <Navbar />
          </Suspense>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
            <Suspense fallback={<p className="py-24 text-center text-sm text-slate-500">Loading…</p>}>{children}</Suspense>
          </main>
          <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500">
            developed by{" "}
            <a
              href="https://www.joyvictoria.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-indigo-600 hover:underline"
            >
              joyvictoria
            </a>{" "}
            · 2026 · demo build
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
