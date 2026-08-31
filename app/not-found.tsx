import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-10">
      <section className="panel w-full max-w-lg rounded-[30px] p-7 text-center md:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-cyan-300/10 text-cyan-300"><SearchX size={24}/></div>
        <p className="muted mt-5 text-xs font-semibold uppercase tracking-[.16em]">404</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-[-.03em]">Page not found</h1>
        <p className="muted mx-auto mt-3 max-w-md text-sm leading-6">The page or transaction you requested does not exist, is unavailable, or is not accessible from your account.</p>
        <Link href="/" className="mt-7 inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950"><ArrowLeft size={16}/>Back to dashboard</Link>
      </section>
    </main>
  );
}
