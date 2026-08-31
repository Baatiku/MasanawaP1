import Link from "next/link";
import type { ReactNode } from "react";
import { Plus } from "lucide-react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>{children}<Link href="/admin/catalog/new" className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-xs font-bold text-slate-950 shadow-2xl transition hover:bg-cyan-200"><Plus size={16}/>New product</Link></>;
}
