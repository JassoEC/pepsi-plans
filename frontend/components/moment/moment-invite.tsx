"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { registerGuest } from "@/app/guest-actions";
import { joinMomentFromInvite } from "@/app/invite-actions";

type Invite = {
  id: string;
  title: string;
  status: "draft" | "ready" | "voting" | "completed";
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
  }>;
};

export default function MomentInvite({ invite, inviteToken, hasIdentity }: {
  invite: Invite;
  inviteToken: string;
  hasIdentity: boolean;
}) {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleNickname(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await registerGuest(nickname);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleJoin() {
    setError(null);
    startTransition(async () => {
      const result = await joinMomentFromInvite(inviteToken);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.push(`/moment/${result.roomId}`);
    });
  }

  return (
    <main className="mx-auto flex min-h-[100svh] w-full max-w-3xl flex-1 flex-col px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-5 sm:px-8 sm:pt-8">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pepsi Moments home">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#005CB4] text-lg font-black italic text-white shadow-sm">P</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-950">Pepsi <span className="text-[#005CB4]">Moments</span></span>
        </Link>
        <span className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-slate-500">MIAMI, FL</span>
      </header>

      <section className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-10">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#005CB4]">You're invited to a Pepsi Moment</p>
          <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{invite.title}</h1>
          <p className="mt-2 text-sm font-semibold text-[#005CB4]">{invite.vibe_name}</p>
          <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-500">
            <span>{invite.participant_count} {invite.participant_count === 1 ? "person" : "people"} joined</span>
            <span>{invite.plans.length} plans to explore</span>
          </div>

          <div className="mt-6 space-y-2">
            {invite.plans.map((plan) => (
              <div key={plan.position} className="rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-bold uppercase tracking-wide text-[#005CB4]">{plan.category}</p>
                <p className="mt-1 font-bold text-slate-900">{plan.title}</p>
                <p className="mt-1 text-xs text-slate-500">{[plan.neighborhood, plan.budget_label].filter(Boolean).join(" · ")}</p>
              </div>
            ))}
          </div>

          {!hasIdentity ? (
            <form onSubmit={handleNickname} className="mt-7">
              <label htmlFor="invite-nickname" className="text-sm font-bold text-slate-800">First, what should your friends call you?</label>
              <input id="invite-nickname" value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={32} required placeholder="Your nickname" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#005CB4] focus:ring-2 focus:ring-blue-100" />
              <button type="submit" disabled={isPending || !nickname.trim()} className="mt-4 w-full rounded-full bg-[#005CB4] px-6 py-3.5 text-sm font-extrabold text-white hover:bg-[#004A91] disabled:opacity-50">{isPending ? "Saving..." : "Continue"}</button>
            </form>
          ) : (
            <div className="mt-7">
              <p className="text-sm leading-6 text-slate-600">{invite.is_participant ? "You're already part of this Moment. Pick up where you left off." : "Join your friends and help choose the plan everyone will love."}</p>
              <button type="button" onClick={handleJoin} disabled={isPending} className="mt-4 w-full rounded-full bg-[#005CB4] px-6 py-3.5 text-sm font-extrabold text-white hover:bg-[#004A91] disabled:opacity-50">{isPending ? "Opening..." : invite.is_participant ? "Open Moment" : "Join Moment"}</button>
            </div>
          )}
          {error ? <p role="alert" className="mt-3 text-sm text-red-600">{error}</p> : null}
        </div>
      </section>
      <footer className="mt-auto pt-5 text-center text-xs text-slate-400">Good moments. Better together.</footer>
    </main>
  );
}
