import Link from "next/link";

import { getActivePlansByVibe } from "@/lib/catalog/plans";
import { getActiveVibes } from "@/lib/catalog/vibes";
import PlanDiscovery from "@/components/discovery/plan-discovery";

type HomeProps = {
  searchParams: Promise<{ vibe?: string | string[] }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const [{ vibe: vibeParam }, vibes] = await Promise.all([
    searchParams,
    getActiveVibes(),
  ]);

  const selectedVibeId =
    typeof vibeParam === "string" ? vibeParam : undefined;
  const selectedVibe = vibes.find((vibe) => vibe.id === selectedVibeId);
  const plans = selectedVibe
    ? await getActivePlansByVibe(selectedVibe.id)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-5 pb-16 pt-8 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pepsi Plans home">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#005CB4] text-lg font-black italic text-white shadow-sm">
            P
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">
            pepsi<span className="text-[#005CB4]">plans</span>
          </span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">
          MIAMI, FL
        </span>
      </header>

      <section className="relative mt-10 overflow-hidden rounded-[2rem] bg-[#071B3A] px-6 py-10 text-white shadow-xl shadow-blue-950/10 sm:px-10 sm:py-14">
        <div className="pointer-events-none absolute -right-12 -top-24 size-72 rounded-full border-[36px] border-[#1479D1]/30" />
        <div className="pointer-events-none absolute -bottom-32 right-24 size-64 rounded-full bg-[#005CB4]/40 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
            <span className="size-2 rounded-full bg-[#4CC9F0]" />
            Good plans. Better together.
          </p>
          <h1 className="max-w-xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Make a plan worth <span className="text-[#54C8F2]">showing up for.</span>
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-blue-100/85 sm:text-lg">
            Find your group&apos;s vibe, pick a few ideas, and get everyone on the same page.
          </p>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="vibe-heading">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#005CB4]">
              Step 01
            </p>
            <h2 id="vibe-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              What&apos;s the vibe?
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Pick the mood that feels right for your group.
            </p>
          </div>
          {selectedVibe ? (
            <Link href="/" className="text-sm font-semibold text-[#005CB4] hover:underline">
              Change vibe
            </Link>
          ) : null}
        </div>

        {vibes.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {vibes.map((vibe, index) => {
              const isSelected = vibe.id === selectedVibe?.id;
              const accents = [
                "from-[#005CB4] to-[#1689D8]",
                "from-[#102D58] to-[#3169A4]",
                "from-[#7C315B] to-[#D45C86]",
              ];

              return (
                <Link
                  key={vibe.id}
                  href={isSelected ? "/" : `/?vibe=${vibe.id}`}
                  aria-current={isSelected ? "true" : undefined}
                  className={`group relative min-h-36 overflow-hidden rounded-2xl border p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005CB4] ${
                    isSelected
                      ? "border-[#005CB4] bg-blue-50 ring-2 ring-[#005CB4]/15"
                      : "border-slate-200 bg-white hover:border-blue-200"
                  }`}
                >
                  <span className={`mb-5 inline-flex size-9 items-center justify-center rounded-xl bg-gradient-to-br ${accents[index % accents.length]} text-sm font-black text-white shadow-sm`}>
                    {vibe.name.split(" ").at(-1)?.slice(0, 1) ?? "P"}
                  </span>
                  <span className="block text-base font-bold text-slate-950">
                    {vibe.name}
                  </span>
                  <span className="mt-1 block max-w-xs text-sm leading-5 text-slate-500">
                    {vibe.description ?? "A curated set of ideas for your next group plan."}
                  </span>
                  {isSelected ? (
                    <span className="absolute right-4 top-4 flex size-6 items-center justify-center rounded-full bg-[#005CB4] text-xs font-bold text-white">
                      ✓
                    </span>
                  ) : (
                    <span className="absolute right-4 top-4 text-lg text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#005CB4]">
                      →
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
            No Vibes are available right now. Please check back soon.
          </div>
        )}
      </section>

      {selectedVibe ? (
        <section className="mt-12" aria-labelledby="plans-heading">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#005CB4]">
              Step 02
            </p>
            <h2 id="plans-heading" className="mt-1 text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">
              Build your plan deck
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Choose 2–10 ideas. You can mix picks from every batch.
            </p>
          </div>
          <PlanDiscovery key={selectedVibe.id} plans={plans} />
        </section>
      ) : (
        <div className="mt-10 flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xl text-[#005CB4]">
            ✦
          </span>
          <div>
            <p className="font-bold text-slate-900">Your group, your call.</p>
            <p className="mt-1 text-sm leading-5 text-slate-500">
              Choose a Vibe to explore handpicked things to do around Miami.
            </p>
          </div>
        </div>
      )}

      <footer className="mt-auto pt-14 text-center text-xs text-slate-400">
        Made for the moments you make together.
      </footer>
    </main>
  );
}
