import { CheckCircle2 } from "lucide-react";
import { PublicPage } from "../components/PublicChrome";

export const metadata = { title: "Perfect Naira Fees", description: "How Perfect Naira presents transaction and provider fees." };

const rows = [
  ["Perfect Naira-to-Perfect Naira transfer", "Shown before confirmation", "Any applicable platform fee is disclosed before authorization."],
  ["Bank withdrawal", "Provider-backed", "The final fee is shown before the payout request is submitted."],
  ["Airtime, data and bills", "Product-specific", "Pricing comes from the active service catalog and configured provider route."],
  ["Wallet funding", "Provider-specific", "Any checkout or bank-transfer charge is determined by the enabled funding provider."],
  ["Crypto buy, sell or swap", "Quote-specific", "Executable pricing and fees are supplied by the configured liquidity provider."],
];

export default function FeesPage(){return <PublicPage><section className="mx-auto max-w-5xl px-5 py-16 md:px-8 lg:py-24"><div className="max-w-2xl"><h1 className="text-4xl font-extrabold tracking-[-.05em] md:text-5xl">Clear fees before you confirm.</h1><p className="muted mt-5 text-sm leading-7">Perfect Naira is designed to show the applicable amount and fee before a financial action is authorized. Exact fees can vary by provider, service and transaction type, so this page does not publish invented fixed prices.</p></div><div className="mt-12 overflow-hidden rounded-[30px] border border-white/8"><div className="hidden grid-cols-[1fr_.6fr_1.3fr] gap-4 border-b border-white/8 bg-white/[.035] px-6 py-4 text-[11px] font-bold uppercase tracking-[.11em] text-slate-500 md:grid"><span>Transaction</span><span>Fee model</span><span>What you see</span></div>{rows.map(([name,model,detail])=><div key={name} className="grid gap-2 border-b border-white/6 px-5 py-5 last:border-0 md:grid-cols-[1fr_.6fr_1.3fr] md:gap-4 md:px-6"><p className="text-sm font-semibold">{name}</p><p className="text-xs font-semibold text-emerald-400">{model}</p><p className="muted text-xs leading-6">{detail}</p></div>)}</div><div className="mt-7 flex gap-3 rounded-2xl border border-emerald-400/12 bg-emerald-400/[.045] p-4"><CheckCircle2 className="mt-0.5 shrink-0 text-emerald-400" size={18}/><p className="muted text-xs leading-6">If a provider or product cannot return verifiable pricing, Perfect Naira should keep that action unavailable rather than display a fabricated amount.</p></div></section></PublicPage>}
