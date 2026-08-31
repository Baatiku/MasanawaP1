import Link from "next/link";
import { ArrowDownToLine, ArrowUpFromLine, Copy, Landmark, Plus, Send, WalletCards } from "lucide-react";
import AppShell from "../components/AppShell";

export default function WalletPage() {
  return (
    <AppShell active="Wallet" title="Wallet" subtitle="Fund, transfer and manage your naira balance.">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <section className="panel relative overflow-hidden rounded-[30px] p-6 md:p-8">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
          <div className="relative">
            <div className="flex items-start justify-between"><div><p className="muted text-sm">Available balance</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.04em] md:text-5xl">₦125,450.00</h1><p className="mt-2 text-xs text-emerald-300">Wallet active</p></div><WalletCards className="text-cyan-300" /></div>
            <div className="mt-8 grid grid-cols-3 gap-3">
              <Link href="/wallet/fund" className="flex items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-3 py-3 text-xs font-bold text-slate-950"><ArrowDownToLine size={16}/>Fund</Link>
              <Link href="/wallet/transfer" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><Send size={16}/>Transfer</Link>
              <Link href="/wallet/withdraw" className="flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.04] px-3 py-3 text-xs font-semibold"><ArrowUpFromLine size={16}/>Withdraw</Link>
            </div>
          </div>
        </section>
        <section className="panel rounded-[30px] p-5 md:p-6">
          <div className="flex items-center justify-between"><div><h2 className="font-bold">Virtual account</h2><p className="muted mt-1 text-xs">Use this account to fund Masanawa</p></div><Landmark className="text-cyan-300" size={21}/></div>
          <div className="soft-panel mt-5 rounded-2xl p-4"><p className="muted text-[11px] uppercase tracking-[.12em]">Account number</p><div className="mt-1 flex items-center justify-between"><p className="text-xl font-bold tracking-wider">6647 709 988</p><button className="text-cyan-300"><Copy size={17}/></button></div><div className="mt-4 border-t border-white/7 pt-3"><p className="text-xs font-semibold">Masanawa / Abdullahi Nasir</p><p className="muted mt-1 text-[11px]">Wema Bank</p></div></div>
        </section>
      </div>
      <section className="panel mt-5 rounded-[30px] p-5 md:p-6"><div className="flex items-center justify-between"><div><h2 className="font-bold">Wallet activity</h2><p className="muted mt-1 text-xs">Recent money movements</p></div><Link href="/transactions" className="text-xs font-semibold text-cyan-300">View history</Link></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[["Total funded","₦410,000"],["Total spent","₦271,550"],["This month","+₦18,350"]].map(([a,b])=><div key={a} className="soft-panel rounded-2xl p-4"><p className="muted text-xs">{a}</p><p className="mt-2 text-lg font-bold">{b}</p></div>)}</div></section>
    </AppShell>
  );
}
