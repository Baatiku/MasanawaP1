import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserRound } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";
import { updatePersonalProfile } from "./actions";

export default async function PersonalPage({ searchParams }: { searchParams?: Promise<{ error?: string; message?: string }> }) {
  const params = (await searchParams) ?? {};
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const [{ data: profile }, { data: userData }] = await Promise.all([
    supabase.from("profiles").select("full_name,phone,username").eq("id", userId).single(),
    supabase.auth.getUser(),
  ]);

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl"><Link href="/profile" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to profile</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><UserRound size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">Personal information</h1><p className="muted mt-2 text-sm">Keep your Masanawa profile details current.</p></div>{params.error && <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-200">{params.error}</div>}{params.message && <div className="mt-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/8 px-4 py-3 text-sm text-emerald-200">{params.message}</div>}<section className="panel mt-7 rounded-[30px] p-5 md:p-7"><form action={updatePersonalProfile} className="space-y-5"><div><label className="text-xs font-semibold">Email address</label><input disabled value={userData.user?.email ?? ""} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.02] px-4 py-3.5 text-sm text-slate-500 outline-none"/></div><div><label htmlFor="full_name" className="text-xs font-semibold">Full name</label><input id="full_name" name="full_name" required defaultValue={profile?.full_name ?? ""} className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none focus:border-cyan-300/30"/></div><div><label htmlFor="phone" className="text-xs font-semibold">Phone number</label><input id="phone" name="phone" inputMode="tel" defaultValue={profile?.phone ?? ""} placeholder="08012345678" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></div><div><label htmlFor="username" className="text-xs font-semibold">Username</label><input id="username" name="username" defaultValue={profile?.username ?? ""} placeholder="your_username" className="mt-3 w-full rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3.5 text-sm outline-none placeholder:text-slate-600 focus:border-cyan-300/30"/></div><button type="submit" className="flex w-full items-center justify-center rounded-2xl bg-cyan-300 py-3.5 text-sm font-bold text-slate-950">Save personal information</button></form></section></div></main>;
}
