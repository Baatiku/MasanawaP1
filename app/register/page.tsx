import Link from "next/link";
import { ArrowRight, Gift, LockKeyhole, Mail, UserRound } from "lucide-react";
import { register } from "../auth/actions";

export default async function RegisterPage({ searchParams }: { searchParams?: Promise<{ error?: string; ref?: string }> }) {
  const params = (await searchParams) ?? {};
  const referralCode = (params.ref ?? "").trim().toUpperCase().slice(0,24);
  return (
    <main className="min-h-screen px-5 py-8 sm:px-8 lg:grid lg:grid-cols-[.92fr_1.08fr] lg:p-0">
      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center lg:min-h-screen">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 font-black text-slate-950">M</div><p className="text-lg font-extrabold">Masanawa</p></div>
          <p className="text-sm font-semibold text-cyan-300">Get started</p><h1 className="mt-2 text-3xl font-extrabold tracking-[-.04em]">Create your Masanawa account</h1><p className="muted mt-2 text-sm">One account for payments, digital services and crypto.</p>
          {params.error && <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}
          {referralCode && <div className="mt-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.05] px-4 py-3 text-xs text-cyan-100">Referral code <span className="font-bold text-cyan-300">{referralCode}</span> will be attached to your account after signup.</div>}
          <form action={register} className="mt-8 space-y-4">
            <Field name="full_name" label="Full name" placeholder="Your full name" icon={UserRound} />
            <Field name="email" label="Email address" placeholder="you@example.com" type="email" icon={Mail} />
            <Field name="password" label="Password" placeholder="At least 8 characters" type="password" icon={LockKeyhole} />
            <Field name="referral_code" label="Referral code (optional)" placeholder="Enter referral code" icon={Gift} defaultValue={referralCode} required={false} />
            <label className="flex gap-3 text-xs leading-5 text-slate-400"><input required type="checkbox" className="mt-1 accent-cyan-300" /> <span>I agree to the Terms of Service and Privacy Policy.</span></label>
            <button type="submit" className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 text-sm font-bold text-slate-950 transition hover:bg-cyan-200">Create account <ArrowRight size={17} /></button>
          </form>
          <p className="muted mt-8 text-center text-sm">Already have an account? <Link href="/login" className="font-semibold text-cyan-300">Sign in</Link></p>
        </div>
      </section>
      <section className="relative hidden min-h-screen overflow-hidden border-l border-white/7 bg-[#091726] p-12 lg:flex lg:flex-col lg:justify-end"><div className="absolute right-[-10%] top-[-8%] h-[500px] w-[500px] rounded-full bg-cyan-300/10 blur-3xl" /><div className="relative grid max-w-xl grid-cols-2 gap-4"><InfoCard value="24/7" label="Access your account" /><InfoCard value="Fast" label="Instant digital services" /><InfoCard value="Secure" label="Transaction protection" /><InfoCard value="One" label="Unified wallet experience" /></div><div className="relative mt-10 max-w-xl"><h2 className="text-4xl font-extrabold tracking-[-.045em]">Built for everyday money.</h2><p className="muted mt-4 text-sm leading-7">Fund your wallet, buy airtime and data, settle bills, and access digital assets without juggling multiple services.</p></div></section>
    </main>
  );
}

function Field({ name, label, placeholder, type = "text", icon: Icon, defaultValue = "", required = true }: { name: string; label: string; placeholder: string; type?: string; icon: typeof Mail; defaultValue?: string; required?: boolean }) {
  return <div><label htmlFor={name} className="mb-2 block text-xs font-semibold text-slate-300">{label}</label><div className="flex h-13 items-center gap-3 rounded-2xl border border-white/9 bg-white/[.035] px-4 focus-within:border-cyan-300/35"><Icon size={17} className="text-slate-500" /><input id={name} name={name} required={required} type={type} defaultValue={defaultValue} placeholder={placeholder} autoCapitalize={name === "referral_code" ? "characters" : undefined} className="h-full min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-600" /></div></div>;
}

function InfoCard({ value, label }: { value: string; label: string }) {
  return <div className="rounded-[26px] border border-white/8 bg-white/[.035] p-5"><p className="text-xl font-extrabold text-cyan-300">{value}</p><p className="muted mt-2 text-xs">{label}</p></div>;
}
