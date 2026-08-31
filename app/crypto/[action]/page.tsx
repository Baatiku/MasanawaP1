import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ArrowLeftRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";

export default async function CryptoActionPage({params}:{params:Promise<{action:string}>}) {
  const {action}=await params;
  if (!['sell','swap'].includes(action)) redirect('/crypto');
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect('/login');
  const swap=action==='swap';
  const Icon=swap?ArrowLeftRight:ArrowUpRight;
  const title=swap?'Swap crypto':'Sell crypto';

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:py-10"><div className="mx-auto max-w-2xl"><Link href="/crypto" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to crypto</Link><div className="mt-7"><div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Icon size={22}/></div><h1 className="mt-5 text-2xl font-bold md:text-3xl">{title}</h1><p className="muted mt-2 text-sm">{swap?'Exchange one supported digital asset for another.':'Convert supported crypto assets into your naira wallet.'}</p></div><section className="panel mt-7 rounded-[30px] p-7 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-300/10 text-amber-300"><ShieldCheck size={21}/></div><h2 className="mt-4 text-base font-bold">{title} is not active yet</h2><p className="muted mx-auto mt-2 max-w-lg text-xs leading-6">Masanawa does not yet have a custody/asset-balance and provider settlement path for this action. The previous preview-only form has been removed so users cannot mistake a mock flow for an executable financial transaction.</p></section></div></main>;
}
