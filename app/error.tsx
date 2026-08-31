"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="flex min-h-screen items-center justify-center px-5 py-10"><section className="panel w-full max-w-lg rounded-[30px] p-7 text-center md:p-9"><img src="/masanawa-mark.svg" alt="" className="mx-auto h-11 w-11"/><div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><AlertTriangle size={21}/></div><h1 className="mt-5 text-2xl font-extrabold tracking-[-.03em]">Something went wrong</h1><p className="muted mx-auto mt-3 max-w-md text-sm leading-6">The page could not be completed. You can retry safely; financial state is confirmed from the server rather than from this screen.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><button onClick={reset} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950"><RotateCcw size={15}/>Try again</button><Link href="/dashboard" className="rounded-2xl border border-white/8 bg-white/[.035] px-5 py-3 text-sm font-semibold">Dashboard</Link></div></section></main>;
}
