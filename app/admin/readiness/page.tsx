import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2, CircleAlert, ServerCog } from "lucide-react";
import { createClient } from "../../../lib/supabase/server";

function configured(value: string | undefined, placeholders: string[] = []) {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  return !placeholders.some(item => normalized.includes(item));
}

export default async function ReadinessPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) redirect("/login");
  const { data: admin } = await supabase.rpc("is_admin");
  if (!admin) redirect("/");

  const [{ count: activeProviders }, { count: activeProducts }, { count: activeRoutes }] = await Promise.all([
    supabase.from("providers").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("service_products").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("provider_product_routes").select("id", { count: "exact", head: true }).eq("active", true),
  ]);

  const checks = [
    { label: "Supabase public URL", ok: configured(process.env.NEXT_PUBLIC_SUPABASE_URL, ["replace_me"]), note: "Required by browser and server auth clients." },
    { label: "Supabase publishable key", ok: configured(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, ["replace_me"]), note: "Public client key only; never use the service role in the browser." },
    { label: "Supabase server secret", ok: configured(process.env.SUPABASE_SECRET_KEY, ["replace_me"]), note: "Required for settlement, workers and privileged server operations." },
    { label: "Paystack secret key", ok: configured(process.env.PAYSTACK_SECRET_KEY, ["replace_me"]), note: "Required before wallet funding can be enabled." },
    { label: "VTpass API key", ok: configured(process.env.VTPASS_API_KEY, ["replace_me"]), note: "Required for provider catalog and service execution." },
    { label: "VTpass public key", ok: configured(process.env.VTPASS_PUBLIC_KEY, ["replace_me"]), note: "Required by VTpass authenticated requests." },
    { label: "VTpass secret key", ok: configured(process.env.VTPASS_SECRET_KEY, ["replace_me"]), note: "Server-only provider credential." },
    { label: "Worker secret", ok: configured(process.env.MASANAWA_WORKER_SECRET, ["replace_with", "replace_me"]), note: "Protects internal service-processing endpoints." },
    { label: "Production app URL", ok: configured(process.env.NEXT_PUBLIC_APP_URL, ["localhost", "replace_me"]), note: "Must be the deployed HTTPS origin for callbacks." },
  ];
  const configuredCount = checks.filter(item => item.ok).length;
  const providerReady = (activeProviders ?? 0) > 0 && (activeProducts ?? 0) > 0 && (activeRoutes ?? 0) > 0;
  const allReady = configuredCount === checks.length && providerReady;

  return <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10"><div className="mx-auto max-w-5xl">
    <Link href="/admin" className="muted inline-flex items-center gap-2 text-sm hover:text-white"><ArrowLeft size={17}/>Back to admin</Link>
    <div className="mt-7 flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400"><ServerCog size={22}/></div><div><h1 className="text-2xl font-bold md:text-3xl">Deployment readiness</h1><p className="muted mt-2 text-sm">Configuration presence only. Secret values are never displayed.</p></div></div>

    <section className={`mt-7 rounded-[30px] border p-5 md:p-6 ${allReady ? "border-emerald-300/20 bg-emerald-300/[.05]" : "border-amber-300/20 bg-amber-300/[.05]"}`}><div className="flex items-center gap-3">{allReady ? <CheckCircle2 className="text-emerald-300"/> : <CircleAlert className="text-amber-300"/>}<div><p className="font-bold">{allReady ? "Environment ready for live activation" : "Live activation is intentionally blocked"}</p><p className="muted mt-1 text-xs">{configuredCount}/{checks.length} required environment settings detected · {activeProviders ?? 0} active providers · {activeProducts ?? 0} active products · {activeRoutes ?? 0} active routes</p></div></div></section>

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="space-y-3">{checks.map(item => <div key={item.label} className="flex items-start justify-between gap-4 rounded-2xl border border-white/7 bg-white/[.025] p-4"><div><p className="text-sm font-semibold">{item.label}</p><p className="muted mt-1 text-xs leading-5">{item.note}</p></div><span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${item.ok ? "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-300" : "border-amber-300/20 bg-amber-300/[.07] text-amber-300"}`}>{item.ok ? "CONFIGURED" : "MISSING"}</span></div>)}</div></section>

    <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><h2 className="font-bold">Provider activation gate</h2><p className="muted mt-2 text-xs leading-5">Perfect Naira remains fail-closed until at least one provider, product and provider route are active. Activating records without real credentials does not make the system ready.</p><div className="mt-4 grid grid-cols-3 gap-3 text-center"><div className="soft-panel rounded-2xl p-4"><p className="text-xl font-extrabold">{activeProviders ?? 0}</p><p className="muted mt-1 text-[10px]">Active providers</p></div><div className="soft-panel rounded-2xl p-4"><p className="text-xl font-extrabold">{activeProducts ?? 0}</p><p className="muted mt-1 text-[10px]">Active products</p></div><div className="soft-panel rounded-2xl p-4"><p className="text-xl font-extrabold">{activeRoutes ?? 0}</p><p className="muted mt-1 text-[10px]">Active routes</p></div></div></section>
  </div></main>;
}
