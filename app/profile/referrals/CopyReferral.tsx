"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export default function CopyReferral({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }
  return <div className="flex gap-2"><input readOnly value={value} aria-label="Referral link" className="min-w-0 flex-1 rounded-2xl border border-white/8 bg-white/[.035] px-4 py-3 text-xs text-slate-300 outline-none"/><button type="button" onClick={copy} className="flex shrink-0 items-center gap-2 rounded-2xl bg-emerald-400 px-4 py-3 text-xs font-bold text-slate-950">{copied ? <Check size={15}/> : <Copy size={15}/>} {copied ? "Copied" : "Copy"}</button></div>;
}
