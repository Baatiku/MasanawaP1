import Link from "next/link";
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { login } from "../auth/actions";

export default async function LoginPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:grid lg:grid-cols-[1.05fr_.95fr] lg:p-0">
      <section className="hidden min-h-screen flex-col justify-between overflow-hidden border-r border-white/7 bg-[#091726] p-12 lg:flex">
        <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 font-black text-slate-950">M</div><div><p className="text-lg font-extrabold tracking-[-.03em]">Masanawa</p><p className="muted text-[10px] uppercase tracking-[.18em]">Pay · Trade · Connect</p></div></div>
        <div className="max-w-xl"><div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-300/10 text-cyan-300"><ShieldCheck size={26} /></div><h1 className="text-5xl font-extrabold leading-[1.04] tracking-[-.05em]">Everything you need to move money, pay bills and trade digital assets.</h1><p className="muted mt-6 max-w-lg text-base leading-7">Fast payments, dependable digital services and a modern crypto experience from one secure account.</p></div>
        <p className="muted text-xs">© 2026 Masanawa. Secure by design.</p>
      </section>
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 font-black text-slate-950">M</div><p className="text-lg font-extrabold">Masanawa</p></div>
          <p className="text-sm font-semibold text-cyan-300">Welcome back</p><h2 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Sign in to your account</h2><p className="muted mt-2 text-sm">Enter your details to continue.</p>
          {params.error && <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
          {params.message && <div className="mt-5 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}
          <form action={login} className="mt-8 space-y-5">
            <Field name="email" label="Email address" type="email" placeholder="you@example.com" icon={Mail} />
            <Field name="password" label="Password" type="password" placeholder="Enter your password" icon={LockKeyhole} />
            <button type="submit" className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">Sign in <ArrowRight size={17} /></button>
          </form>
          <p className="muted mt-8 text-center text-sm">New to Masanawa? <Link href="/register" className="font-semibold text-cyan-300">Create an account</Link></p>
        </div>
      </section>
    </main>
  );
}

function Field({ name, label, type, placeholder, icon: Icon }: { name: string; label: string; type: string; placeholder: string; icon: typeof Mail }) {
  return <div><label htmlFor={name} className="mb-2 block text-xs font-semibold text-slate-300">{label}</label><div className="flex h-13 items-center gap-3 rounded-2xl border border-white/9 bg-white/[.035] px-4 focus-within:border-cyan-300/35"><Icon size={17} className="text-slate-500" /><input id={name} name={name} required type={type} placeholder={placeholder} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" /></div></div>;
}
