import Link from "next/link";
import type { ReactNode } from "react";
import { Gauge, Plus, ServerCog } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}<div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 sm:flex-row"><Link href="/admin/readiness" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#101a2b] px-4 py-3 text-xs font-semibold text-slate-200 shadow-2xl transition hover:bg-[#15243a]"><Gauge size={16}/>Readiness</Link><Link href="/admin/vtpass" className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#101a2b] px-4 py-3 text-xs font-semibold text-cyan-300 shadow-2xl transition hover:bg-[#15243a]"><ServerCog size={16}/>VTpass catalog</Link><Link href="/admin/catalog/new" className="flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-xs font-bold text-slate-950 shadow-2xl transition hover:bg-cyan-200"><Plus size={16}/>New product</Link></div></>;
}
