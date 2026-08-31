import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { PublicPage } from "./components/PublicChrome";

export default function NotFound(){return <PublicPage><section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-5 py-20 text-center md:px-8"><div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-cyan-300/9 text-cyan-300"><Compass size={24}/></div><p className="mt-6 text-sm font-semibold text-cyan-300">404</p><h1 className="mt-2 text-4xl font-extrabold tracking-[-.05em]">This page isn&apos;t here.</h1><p className="muted mt-4 max-w-lg text-sm leading-7">The link may be outdated, the page may have moved, or the address may be incorrect.</p><Link href="/" className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950"><ArrowLeft size={15}/>Back to Masanawa</Link></section></PublicPage>}
