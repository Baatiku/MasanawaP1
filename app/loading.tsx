export default function Loading() {
  return (
    <main className="min-h-screen px-5 py-6 md:px-8 lg:px-12 lg:py-10">
      <div className="mx-auto max-w-7xl animate-pulse">
        <div className="h-10 w-40 rounded-2xl bg-white/[.05]" />
        <div className="mt-8 grid gap-5 lg:grid-cols-[1.3fr_.7fr]">
          <div className="panel rounded-[30px] p-6 md:p-8">
            <div className="h-4 w-28 rounded bg-white/[.06]" />
            <div className="mt-5 h-10 w-56 rounded-xl bg-white/[.07]" />
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[0,1,2].map(item => <div key={item} className="h-20 rounded-2xl bg-white/[.045]" />)}
            </div>
          </div>
          <div className="panel rounded-[30px] p-6">
            <div className="h-4 w-36 rounded bg-white/[.06]" />
            <div className="mt-5 h-24 rounded-2xl bg-white/[.045]" />
          </div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {[0,1,2].map(item => <div key={item} className="panel h-44 rounded-[30px]" />)}
        </div>
      </div>
    </main>
  );
}
