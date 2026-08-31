"use client";

import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bell,
  Bitcoin,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Gift,
  History,
  Home,
  Landmark,
  LayoutGrid,
  MoreHorizontal,
  Phone,
  ReceiptText,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  UserRound,
  WalletCards,
  Wifi,
  Zap,
} from "lucide-react";

const services = [
  { label: "Airtime", icon: Phone },
  { label: "Data", icon: Wifi },
  { label: "Electricity", icon: Zap },
  { label: "Cable TV", icon: Tv },
  { label: "Crypto", icon: Bitcoin },
  { label: "Gift Cards", icon: Gift },
  { label: "Telegram", icon: Sparkles },
  { label: "More", icon: MoreHorizontal },
];

const markets = [
  { name: "Bitcoin", symbol: "BTC", price: "₦168,402,311", change: "+2.42%" },
  { name: "Ethereum", symbol: "ETH", price: "₦6,428,950", change: "+1.16%" },
  { name: "Tether", symbol: "USDT", price: "₦1,582.40", change: "+0.08%" },
];

const transactions = [
  { title: "Wallet funding", meta: "Bank transfer · Today, 11:42", amount: "+₦75,000.00", positive: true },
  { title: "MTN Data", meta: "10GB plan · Today, 09:18", amount: "-₦4,500.00", positive: false },
  { title: "USDT purchase", meta: "Crypto · Yesterday, 20:31", amount: "-₦31,648.00", positive: false },
  { title: "Airtime", meta: "Airtel · Yesterday, 16:04", amount: "-₦1,000.00", positive: false },
];

const nav = [
  { label: "Home", icon: Home, active: true },
  { label: "Services", icon: LayoutGrid },
  { label: "Wallet", icon: WalletCards },
  { label: "Transactions", icon: History },
  { label: "Profile", icon: UserRound },
];

export default function HomePage() {
  return (
    <main className="min-h-screen pb-24 lg:pb-0">
      <aside className="glass fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-white/8 px-5 py-6 lg:flex lg:flex-col">
        <Brand />
        <nav className="mt-10 space-y-2">
          {nav.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                item.active
                  ? "bg-cyan-400/12 text-cyan-300 ring-1 ring-cyan-300/15"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <item.icon size={19} strokeWidth={1.9} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto rounded-3xl border border-cyan-300/10 bg-cyan-300/[.055] p-4">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
            <ShieldCheck size={20} />
          </div>
          <p className="text-sm font-semibold">Secure your account</p>
          <p className="muted mt-1 text-xs leading-5">Complete verification to unlock higher transaction limits.</p>
          <button className="mt-4 text-xs font-semibold text-cyan-300">Verify account →</button>
        </div>
      </aside>

      <section className="lg:ml-[248px]">
        <header className="glass sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/7 px-5 md:px-8 lg:px-10">
          <div className="lg:hidden"><Brand compact /></div>
          <div className="hidden lg:block">
            <p className="text-sm font-semibold">Dashboard</p>
            <p className="muted mt-0.5 text-xs">Your money, services and digital assets in one place.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-white/8 bg-white/[.035] text-slate-300">
              <Bell size={18} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-cyan-300" />
            </button>
            <div className="hidden items-center gap-3 sm:flex">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 to-sky-500 text-sm font-extrabold text-slate-950">AN</div>
              <div className="hidden xl:block">
                <p className="text-xs font-semibold">Abdullahi Nasir</p>
                <p className="muted text-[11px]">Verified account</p>
              </div>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-[1450px] px-5 py-6 md:px-8 lg:px-10 lg:py-9">
          <div className="mb-6 lg:mb-8">
            <p className="muted text-sm">Good afternoon 👋</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Welcome back, Abdullahi</h1>
          </div>

          <div className="grid gap-5 xl:grid-cols-[1.35fr_.65fr]">
            <section className="panel relative overflow-hidden rounded-[30px] p-6 md:p-8">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-300/10 blur-3xl" />
              <div className="relative">
                <div className="flex items-start justify-between gap-5">
                  <div>
                    <p className="muted text-sm">Available balance</p>
                    <div className="mt-2 flex items-end gap-2">
                      <h2 className="text-3xl font-extrabold tracking-[-.04em] sm:text-4xl md:text-5xl">₦125,450.00</h2>
                    </div>
                    <p className="mt-2 text-xs text-emerald-300/80">+₦18,350 this month</p>
                  </div>
                  <button className="rounded-xl border border-white/8 bg-white/[.04] px-3 py-2 text-xs text-slate-300">NGN</button>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3 md:max-w-lg">
                  <QuickAction icon={ArrowDownToLine} label="Fund" primary />
                  <QuickAction icon={Send} label="Transfer" />
                  <QuickAction icon={ArrowUpFromLine} label="Withdraw" />
                </div>
              </div>
            </section>

            <section className="panel rounded-[30px] p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold">Virtual account</p>
                  <p className="muted mt-1 text-xs">Instant bank transfers</p>
                </div>
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300"><Landmark size={21} /></div>
              </div>
              <div className="soft-panel mt-5 rounded-2xl p-4">
                <p className="muted text-[11px] uppercase tracking-[.12em]">Account number</p>
                <p className="mt-1 text-xl font-bold tracking-wider">6647 709 988</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/7 pt-3">
                  <div>
                    <p className="text-xs font-semibold">Masanawa / Abdullahi Nasir</p>
                    <p className="muted mt-1 text-[11px]">Wema Bank</p>
                  </div>
                  <button className="text-xs font-semibold text-cyan-300">Copy</button>
                </div>
              </div>
            </section>
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_.72fr]">
            <section className="panel rounded-[30px] p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Quick services</h3>
                  <p className="muted mt-1 text-xs">What would you like to do?</p>
                </div>
                <button className="text-xs font-semibold text-cyan-300">View all</button>
              </div>
              <div className="mt-5 grid grid-cols-4 gap-3 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-4 2xl:grid-cols-8">
                {services.map((service) => (
                  <button key={service.label} className="group flex min-h-[100px] flex-col items-center justify-center rounded-2xl border border-white/7 bg-white/[.028] px-2 transition hover:-translate-y-0.5 hover:border-cyan-300/20 hover:bg-cyan-300/[.055]">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-300/9 text-cyan-300 transition group-hover:bg-cyan-300/14">
                      <service.icon size={19} strokeWidth={1.8} />
                    </span>
                    <span className="mt-2 text-[11px] font-medium text-slate-300">{service.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel rounded-[30px] p-5 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold">Crypto market</h3>
                  <p className="muted mt-1 text-xs">Live market overview</p>
                </div>
                <button className="flex items-center gap-1 text-xs font-semibold text-cyan-300">Trade <ChevronRight size={14} /></button>
              </div>
              <div className="mt-4 divide-y divide-white/6">
                {markets.map((coin) => (
                  <div key={coin.symbol} className="flex items-center justify-between py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[.045] text-cyan-300"><CircleDollarSign size={19} /></div>
                      <div>
                        <p className="text-sm font-semibold">{coin.name}</p>
                        <p className="muted text-[11px]">{coin.symbol}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold">{coin.price}</p>
                      <p className="mt-1 text-[11px] text-emerald-300">{coin.change}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="panel mt-5 rounded-[30px] p-5 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Recent transactions</h3>
                <p className="muted mt-1 text-xs">Your latest account activity</p>
              </div>
              <button className="text-xs font-semibold text-cyan-300">See all</button>
            </div>
            <div className="mt-4 divide-y divide-white/6">
              {transactions.map((tx) => (
                <div key={tx.title + tx.meta} className="flex items-center justify-between gap-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/[.04] text-slate-300"><ReceiptText size={19} /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{tx.title}</p>
                      <p className="muted mt-1 truncate text-[11px]">{tx.meta}</p>
                    </div>
                  </div>
                  <p className={`shrink-0 text-xs font-bold sm:text-sm ${tx.positive ? "text-emerald-300" : "text-slate-100"}`}>{tx.amount}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <nav className="glass fixed inset-x-3 bottom-3 z-40 flex items-center justify-around rounded-[24px] border border-white/10 px-2 py-2.5 shadow-2xl lg:hidden">
        {nav.map((item) => (
          <button key={item.label} className={`flex min-w-[58px] flex-col items-center gap-1 rounded-2xl py-1.5 text-[10px] ${item.active ? "text-cyan-300" : "text-slate-500"}`}>
            <item.icon size={19} strokeWidth={item.active ? 2.2 : 1.8} />
            {item.label}
          </button>
        ))}
      </nav>
    </main>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`${compact ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl"} flex items-center justify-center bg-gradient-to-br from-cyan-300 to-sky-500 font-black text-slate-950 shadow-[0_0_28px_rgba(34,195,238,.15)]`}>
        M
      </div>
      <div>
        <p className={`${compact ? "text-base" : "text-lg"} font-extrabold tracking-[-.03em]`}>Masanawa</p>
        {!compact && <p className="muted text-[10px] tracking-[.18em] uppercase">Pay · Trade · Connect</p>}
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, primary = false }: { icon: typeof CreditCard; label: string; primary?: boolean }) {
  return (
    <button className={`flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-semibold transition hover:-translate-y-0.5 ${primary ? "bg-cyan-300 text-slate-950 hover:bg-cyan-200" : "border border-white/8 bg-white/[.04] text-slate-200 hover:bg-white/[.065]"}`}>
      <Icon size={16} strokeWidth={2} />
      <span>{label}</span>
    </button>
  );
}
