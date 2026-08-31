import Link from "next/link";
import { ArrowRight, Mail, ShieldCheck } from "lucide-react";

const nav = [
  { label: "Products", href: "/products" },
  { label: "Services", href: "/products#services" },
  { label: "Fees", href: "/fees" },
  { label: "Security", href: "/security" },
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
];

export function PublicHeader() {
  return <header className="sticky top-0 z-50 border-b border-white/7 bg-[#07111f]/88 backdrop-blur-xl">
    <div className="mx-auto flex h-[74px] max-w-7xl items-center justify-between px-5 md:px-8">
      <Link href="/" aria-label="Masanawa home" className="flex items-center gap-2.5"><img src="/masanawa-mark.svg" alt="" className="h-9 w-9"/><span className="text-lg font-extrabold tracking-[-.035em]">Masanawa</span></Link>
      <nav className="hidden items-center gap-7 lg:flex">{nav.map(item=><Link key={item.label} href={item.href} className="text-xs font-semibold text-slate-400 transition hover:text-white">{item.label}</Link>)}</nav>
      <div className="hidden items-center gap-3 sm:flex"><Link href="/login" className="px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white">Sign in</Link><Link href="/register" className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-200">Get started <ArrowRight size={14}/></Link></div>
      <details className="relative sm:hidden"><summary className="cursor-pointer list-none rounded-xl border border-white/8 px-3 py-2 text-xs font-semibold">Menu</summary><div className="absolute right-0 mt-3 w-64 rounded-2xl border border-white/10 bg-[#0d1a2b] p-3 shadow-2xl">{nav.map(item=><Link key={item.label} href={item.href} className="block rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/[.04]">{item.label}</Link>)}<div className="mt-2 grid grid-cols-2 gap-2 border-t border-white/8 pt-3"><Link href="/login" className="rounded-xl border border-white/8 px-3 py-2.5 text-center text-xs font-semibold">Sign in</Link><Link href="/register" className="rounded-xl bg-cyan-300 px-3 py-2.5 text-center text-xs font-bold text-slate-950">Join</Link></div></div></details>
    </div>
  </header>;
}

export function PublicFooter() {
  return <footer className="border-t border-white/7 bg-[#06101c]">
    <div className="mx-auto max-w-7xl px-5 py-14 md:px-8">
      <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_.8fr_.8fr_.8fr]">
        <div><Link href="/" className="flex items-center gap-2.5"><img src="/masanawa-mark.svg" alt="" className="h-10 w-10"/><span className="text-lg font-extrabold">Masanawa</span></Link><p className="mt-4 max-w-sm text-sm leading-7 text-slate-400">A unified wallet for payments, transfers, digital services and provider-backed digital assets.</p><div className="mt-5 flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={15} className="text-cyan-300"/>Security controls built into every transaction.</div></div>
        <FooterGroup title="Product" links={[["Wallet","/products"],["Services","/products#services"],["Digital assets","/products"],["Fees","/fees"]]}/>
        <FooterGroup title="Company" links={[["About","/about"],["Contact","/contact"],["Security","/security"],["Help center","/help"]]}/>
        <FooterGroup title="Legal" links={[["Terms of Service","/terms"],["Privacy Notice","/privacy"],["Sign in","/login"],["Create account","/register"]]}/>
      </div>
      <div className="mt-12 flex flex-col gap-3 border-t border-white/7 pt-6 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between"><p>© {new Date().getFullYear()} Masanawa. All rights reserved.</p><Link href="/contact" className="inline-flex items-center gap-2 hover:text-cyan-300"><Mail size={14}/>Contact Masanawa</Link></div>
    </div>
  </footer>;
}

function FooterGroup({title,links}:{title:string;links:Array<[string,string]>}) { return <div><p className="text-sm font-bold">{title}</p><div className="mt-4 space-y-3">{links.map(([label,href])=><Link key={label} href={href} className="block text-xs text-slate-400 transition hover:text-cyan-300">{label}</Link>)}</div></div>; }
export function PublicPage({children}:{children:React.ReactNode}) { return <><PublicHeader/><main>{children}</main><PublicFooter/></>; }
