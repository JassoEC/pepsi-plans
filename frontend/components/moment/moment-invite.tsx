type Invite = {
  id: string;
  title: string;
  status: "draft" | "ready" | "voting" | "completed" | "expired";
  expires_at: string;
  vibe_name: string;
  is_participant: boolean;
  participant_count: number;
  plans: Array<{
    position: number;
    title: string;
    category: string;
    neighborhood: string | null;
    budget_label: string | null;
    short_insight: string | null;
    description: string | null;
  }>;
};

export default function MomentInvite({ invite }: { invite: Invite }) {
  return (
    <main className="relative isolate flex min-h-[100svh] w-full flex-1 flex-col overflow-hidden bg-[#061A36] text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-32 -top-36 size-[26rem] rounded-full bg-[#0878D1]/25 blur-3xl" />
        <div className="absolute -bottom-40 -left-32 size-[25rem] rounded-full bg-[#00A6E8]/15 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(20,104,190,0.22),transparent_58%)]" />
      </div>

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-5 py-6 sm:px-8">
        <a href="/" className="flex items-center gap-2.5" aria-label="Pepsi Moments home">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#0066B3] text-lg font-black italic text-white shadow-[0_4px_20px_rgba(0,102,179,0.35)]">P</span>
          <span className="text-lg font-extrabold tracking-tight text-white">Pepsi <span className="text-[#65B8F2]">Moments</span></span>
        </a>
        <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-blue-100/70">A MOMENT TOGETHER</span>
      </header>

      <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-5 pb-16 pt-8 text-center sm:px-8">
        <div className="mb-8 flex size-16 items-center justify-center rounded-[1.4rem] border border-white/15 bg-white/[0.08] shadow-[0_12px_50px_rgba(0,0,0,0.18)] backdrop-blur">
          <svg aria-hidden="true" viewBox="0 0 48 48" className="size-9" fill="none">
            <path d="M8 24c0-8.84 7.16-16 16-16h16v16c0 8.84-7.16 16-16 16S8 32.84 8 24Z" fill="#0878C9"/>
            <path d="M8 24h32c0 8.84-7.16 16-16 16S8 32.84 8 24Z" fill="#E31B3D"/>
            <path d="M8 24c5.2-4.7 11.1-7 17.8-7 5.1 0 9.9 1.3 14.2 4v6c-4.7-3.3-9.6-5-14.8-5-6.2 0-11.9 2.2-17.2 6.5V24Z" fill="white"/>
          </svg>
        </div>

        <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#72C5FF]">You've been invited to</p>
        <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl">
          {invite.title}
        </h1>
        <p className="mt-5 max-w-md text-base leading-7 text-blue-100/75 sm:text-lg">
          Your friends are making plans. Come help decide what happens next.
        </p>

        <div className="mt-9 flex items-center gap-2.5 text-sm font-medium text-blue-100/65">
          <span className="flex -space-x-2" aria-hidden="true">
            <span className="size-7 rounded-full border-2 border-[#061A36] bg-[#69B9EF]" />
            <span className="size-7 rounded-full border-2 border-[#061A36] bg-[#F2B56B]" />
            <span className="size-7 rounded-full border-2 border-[#061A36] bg-[#B7A1F5]" />
          </span>
          <span>{invite.participant_count} {invite.participant_count === 1 ? "person is" : "people are"} already in</span>
        </div>

        <button
          type="button"
          disabled
          aria-describedby="invite-cta-note"
          className="mt-10 inline-flex min-h-14 w-full max-w-xs items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-extrabold text-[#005CB4] shadow-[0_12px_35px_rgba(0,0,0,0.2)] transition hover:bg-blue-50 disabled:cursor-default"
        >
          View plans
          <span aria-hidden="true" className="text-xl leading-none">→</span>
        </button>
        <p id="invite-cta-note" className="mt-3 text-xs text-blue-100/45">Your plans are one step away.</p>
      </section>

      <footer className="px-5 pb-6 text-center text-[11px] font-medium tracking-wide text-blue-100/40">
        Good moments. Better together.
      </footer>
    </main>
  );
}
