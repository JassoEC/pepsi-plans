import { Suspense } from "react";
import Link from "next/link";

import { getActivePlansPageByVibe } from "@/lib/catalog/plans";
import { getActiveVibes } from "@/lib/catalog/vibes";
import PlanDiscovery from "@/components/discovery/plan-discovery";

const vibeCopy: Record<string, { feeling: string; detail: string }> = {
  "pepsi-original": {
    feeling: "Classic moments, made together.",
    detail: "For the familiar, feel-good plans: good food, iconic spots and time to reconnect.",
  },
  "pepsi-zero-sugar": {
    feeling: "A little more energy in the day.",
    detail: "For getting outside, moving around and discovering something new.",
  },
  "pepsi-wild-cherry": {
    feeling: "Make room for the unexpected.",
    detail: "For expressive nights, playful plans and stories worth sharing.",
  },
};

export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<DiscoveryLoading />}>
      <DiscoveryContent searchParams={searchParams} />
    </Suspense>
  );
}

async function DiscoveryContent({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const [{ vibe: vibeParam }, vibes] = await Promise.all([
    searchParams,
    getActiveVibes(),
  ]);

  const selectedVibeId =
    typeof vibeParam === "string" ? vibeParam : undefined;
  const selectedVibe = vibes.find((vibe) => vibe.id === selectedVibeId);
  const plansPage = selectedVibe
    ? await getActivePlansPageByVibe(selectedVibe.id)
    : { plans: [], hasMore: false };
  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-1 flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="Pepsi Vibes home"
        >
          <span className="flex size-9 items-center justify-center rounded-full bg-[#005CB4] text-lg font-black italic text-white shadow-sm">
            P
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">
            Pepsi <span className="text-[#005CB4]">Vibes</span>
          </span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">
          MIAMI, FL
        </span>
      </header>

      {!selectedVibe ? (
        <section
          key="vibe-step"
          className="step-enter mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-8"
          aria-labelledby="vibe-heading"
        >
          <div className="mb-7 text-center">
            <h1
              id="vibe-heading"
              className="text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl"
            >
              Choose a Vibe
            </h1>
            <p className="mx-auto mt-3 text-base font-medium leading-6 text-slate-500 sm:text-lg">
              What are you in the mood for?
            </p>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Pick the Vibe that feels right today.
            </p>
          </div>

          {vibes.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {vibes.map((vibe, index) => {
                const accents = [
                  "from-[#005CB4] to-[#1689D8]",
                  "from-[#102D58] to-[#3169A4]",
                  "from-[#7C315B] to-[#D45C86]",
                ];
                const copy = vibeCopy[vibe.slug];

                return (
                  <Link
                    key={vibe.id}
                    href={`/?vibe=${vibe.id}`}
                    className="group flex min-h-44 flex-col rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#005CB4] sm:min-h-52 sm:p-6"
                  >
                    <span
                      className={`mb-5 flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${accents[index % accents.length]} text-sm font-black text-white shadow-sm`}
                    >
                      {vibe.name.split(" ").at(-1)?.slice(0, 1) ?? "P"}
                    </span>
                    <span className="text-lg font-extrabold tracking-tight text-slate-950">
                      {vibe.name}
                    </span>
                    <span className="mt-2 text-sm font-semibold leading-5 text-[#005CB4]">
                      {copy?.feeling ??
                        vibe.description ??
                        "Find a plan that fits your day."}
                    </span>
                    <span className="mt-auto flex items-center justify-between pt-5 text-sm font-bold text-slate-500 transition group-hover:text-[#005CB4]">
                      Explore this Vibe <span aria-hidden="true">→</span>
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              No Vibes are available right now. Please check back soon.
            </div>
          )}
          <p className="mt-7 text-center text-xs text-slate-400">
            No sign-up. Just find a plan that feels right.
          </p>
        </section>
      ) : (
        <section
          key="plans-step"
          className="step-enter mx-auto w-full max-w-3xl flex-1 py-7"
          aria-labelledby="plans-heading"
        >
          <div className="mb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-[#005CB4] hover:underline"
            >
              <span aria-hidden="true">←</span> Back to Vibes
            </Link>
            <div className="mt-5 rounded-3xl bg-[#071B3A] p-5 text-white sm:p-7">
              <h1
                id="plans-heading"
                className="text-2xl font-black tracking-tight sm:text-3xl"
              >
                {selectedVibe.name}
              </h1>
            </div>
          </div>
          <PlanDiscovery
            key={selectedVibe.id}
            vibeId={selectedVibe.id}
            initialPlans={plansPage.plans}
            initialHasMore={plansPage.hasMore}
          />
        </section>
      )}

      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">
        Good plans. Better together.
      </footer>
    </main>
  );
}

function DiscoveryLoading() {
  return (
    <main
      className="mx-auto flex min-h-[100svh] w-full max-w-5xl flex-1 flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-8"
      aria-busy="true"
      aria-live="polite"
    >
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#005CB4] text-lg font-black italic text-white shadow-sm">
            P
          </span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">
            Pepsi <span className="text-[#005CB4]">Vibes</span>
          </span>
        </div>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">
          MIAMI, FL
        </span>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center py-8">
        <div className="mb-7 text-center">
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-5xl">
            Choose a Vibe
          </h1>
          <p className="mx-auto mt-3 text-base font-medium leading-6 text-slate-500 sm:text-lg">
            What are you in the mood for?
          </p>
          <p className="mt-2 text-xs font-medium text-slate-400">
            Pick the Vibe that feels right today.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="min-h-44 animate-pulse rounded-3xl border border-slate-200 bg-white p-5 sm:min-h-52 sm:p-6"
            >
              <div className="size-11 rounded-2xl bg-slate-100" />
              <div className="mt-6 h-5 w-2/3 rounded bg-slate-100" />
              <div className="mt-3 h-4 w-full rounded bg-slate-100" />
              <div className="mt-2 h-4 w-4/5 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </section>
      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">
        Good plans. Better together.
      </footer>
    </main>
  );
}
