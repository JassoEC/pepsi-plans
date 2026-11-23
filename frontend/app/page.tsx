import { Suspense } from "react";
import Link from "next/link";

import PepsiLogo from "@/components/brand/pepsi-logo";
import GuestHome from "@/components/home/guest-home";
import { getGuestDashboard } from "@/lib/guest-identity";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-1 flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pepsi Moments home">
          <PepsiLogo size={40} />
          <span className="text-lg font-extrabold tracking-tight text-slate-950">Pepsi <span className="text-[#005CB4]">Moments</span></span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">MIAMI, FL</span>
      </header>
      <Suspense fallback={<DashboardFallback />}>
        <GuestDashboardContent />
      </Suspense>
      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">Good moments. Better together.</footer>
    </main>
  );
}

async function GuestDashboardContent() {
  const dashboard = await getGuestDashboard();

  return <GuestHome dashboard={dashboard} />;
}

function DashboardFallback() {
  return (
    <section
      aria-label="Loading your dashboard"
      className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center py-10"
    >
      <div className="mx-auto w-full max-w-md animate-pulse">
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="mt-4 h-10 w-3/4 rounded-lg bg-slate-200" />
        <div className="mt-3 h-4 w-full rounded bg-slate-100" />
        <div className="mt-8 h-12 w-48 rounded-full bg-slate-200" />
      </div>
    </section>
  );
}
