"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { registerGuest } from "@/app/guest-actions";
import { joinMomentFromInvite } from "@/app/invite-actions";

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

export default function MomentInvite({
  invite,
  inviteToken,
}: {
  invite: Invite;
  inviteToken: string;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"invite" | "nickname">("invite");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleJoin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = nickname.trim();
    if (!name) {
      setError("Enter a nickname to continue.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const identity = await registerGuest(name);
      if (!identity.ok) {
        setError(identity.error);
        return;
      }

      const joined = await joinMomentFromInvite(inviteToken);
      if (!joined.ok) {
        setError(joined.error);
        return;
      }

      router.push(`/moment/${joined.roomId}/vote`);
    });
  }

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

        {step === "invite" ? (
          <>
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#72C5FF]">You've been invited to</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-white sm:text-6xl">
              {invite.title}
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-blue-100/75 sm:text-lg">
              Your next moment starts here.
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
              onClick={() => setStep("nickname")}
              className="mt-10 inline-flex min-h-14 w-full max-w-xs items-center justify-center gap-3 rounded-full bg-white px-8 text-base font-extrabold text-[#005CB4] shadow-[0_12px_35px_rgba(0,0,0,0.2)] transition hover:bg-blue-50"
            >
              View plans
              <span aria-hidden="true" className="text-xl leading-none">→</span>
            </button>
          </>
        ) : (
          <div className="w-full max-w-md">
            <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#72C5FF]">You're joining</p>
            <h1 className="mt-4 text-3xl font-black leading-tight tracking-[-0.04em] text-white sm:text-4xl">
              {invite.title}
            </h1>
            <h2 className="mt-8 text-2xl font-extrabold text-white">What should we call you?</h2>
            <p className="mt-2 text-sm leading-6 text-blue-100/70">
              Choose a nickname your friends will recognize.
            </p>

            <form onSubmit={handleJoin} className="mt-7 text-left">
              <label htmlFor="guest-nickname" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-blue-100/80">
                Your nickname
              </label>
              <input
                id="guest-nickname"
                name="nickname"
                type="text"
                autoComplete="nickname"
                autoFocus
                maxLength={32}
                required
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="e.g. Alex"
                className="min-h-14 w-full rounded-2xl border border-white/20 bg-white/10 px-4 text-base font-semibold text-white outline-none placeholder:text-blue-100/40 focus:border-[#72C5FF] focus:ring-2 focus:ring-[#72C5FF]/30"
              />

              {error ? <p role="alert" className="mt-3 text-sm font-semibold text-[#FFB5BF]">{error}</p> : null}

              <button
                type="submit"
                disabled={isPending || !nickname.trim()}
                className="mt-6 inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-white px-8 text-base font-extrabold text-[#005CB4] shadow-[0_12px_35px_rgba(0,0,0,0.2)] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Joining..." : "Continue to plans"}
                {!isPending ? <span aria-hidden="true" className="text-xl leading-none">→</span> : null}
              </button>
            </form>

            <button
              type="button"
              onClick={() => { setError(null); setStep("invite"); }}
              disabled={isPending}
              className="mt-5 text-sm font-semibold text-blue-100/65 transition hover:text-white disabled:opacity-40"
            >
              Back
            </button>
          </div>
        )}
      </section>

      <footer className="px-5 pb-6 text-center text-[11px] font-medium tracking-wide text-blue-100/40">
        Good moments. Better together.
      </footer>
    </main>
  );
}
