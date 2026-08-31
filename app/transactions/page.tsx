import Link from "next/link";
import { ArrowLeft, Download, Filter, ReceiptText, Search } from "lucide-react";

const rows = [
  ["Wallet funding", "Bank transfer", "+₦75,000.00", "Successful", "Today, 11:42"],
  ["MTN Data", "10GB plan", "-₦4,500.00", "Successful", "Today, 09:18"],
  ["USDT purchase", "Crypto", "-₦31,648.00", "Successful", "Yesterday, 20:31"],
  ["Airtime", "Airtel", "-₦1,000.00", "Successful", "Yesterday, 16:04"],
  ["Electricity", "KEDCO prepaid", "-₦12,500.00", "Successful", "Aug 29, 14:12"],
  ["Wallet withdrawal", "Bank transfer", "-₦25,000.00", "Processing", "Aug 29, 09:40"],
];

export default function TransactionsPage() {
  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4"><Link href="/" className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035]"><ArrowLeft size={18}/></Link><div><h1 className="text-2xl font-extrabold tracking-[-.035em]">Transactions</h1><p className="muted mt-1 text-xs">Track all activity across your Masanawa account.</p></div></div>
          <button className="hidden items-center gap-2 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-2.5 text-xs font-semibold sm:flex"><Download size={15}/> Export</button>
        </div>

        <section className="panel mt-7 rounded-[30px] p-4 md:p-6">
          <div className="flex flex-col gap-3 md:flex-row">
            <div className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-white/8 bg-white/[.03] px-4"><Search size={17} className="text-slate-500"/><input placeholder="Search transactions" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600"/></div>
            <button className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[.03] px-5 text-xs font-semibold"><Filter size={15}/> Filter</button>
          </div>
          <div className="mt-5 divide-y divide-white/6">
            {rows.map(([title, meta, amount, status, date]) => <div key={title+date} className="flex items-center justify-between gap-4 py-4"><div className="flex min-w-0 items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-300/8 text-cyan-300"><ReceiptText size={18}/></div><div className="min-w-0"><p className="truncate text-sm font-semibold">{title}</p><p className="muted mt-1 truncate text-[11px]">{meta} · {date}</p></div></div><div className="text-right"><p className={`text-sm font-bold ${amount.startsWith('+') ? 'text-emerald-300' : ''}`}>{amount}</p><p className={`mt-1 text-[10px] ${status === 'Successful' ? 'text-emerald-300/80' : 'text-amber-300'}`}>{status}</p></div></div>)}
          </div>
        </section>
      </div>
    </main>
  );
}
