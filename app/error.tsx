'use client';

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="panel w-full max-w-lg rounded-[30px] p-7 text-center md:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-rose-400/10 text-rose-300"><AlertTriangle size={24}/></div>
        <h1 className="mt-5 text-2xl font-extrabold tracking-[-.03em]">Something went wrong</h1>
        <p className="muted mx-auto mt-3 max-w-md text-sm leading-6">Masanawa could not complete this screen safely. No financial action should be assumed successful unless it appears in your transaction history.</p>
        <button onClick={reset} className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950"><RotateCcw size={16}/>Try again</button>
      </section>
    </main>
  );
}
