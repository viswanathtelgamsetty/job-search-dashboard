"use client";

import type { SearchHealthMetrics } from "@/types";

interface SearchHealthSectionProps {
  health: SearchHealthMetrics;
}

export function SearchHealthSection({ health }: SearchHealthSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <span className="text-xl">🩺</span>
          <h2 className="text-lg font-black tracking-tight text-white uppercase">
            Search Campaign Operational Health
          </h2>
        </div>
        <p className="text-xs text-slate-400">
          Factual diagnostic indicators across opportunities, pipeline responsiveness, and follow-up coverage. (No subjective score).
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Relevant Discovered */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Relevant Discovered
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-400">
            {health.relevantOpportunitiesDiscovered}
          </p>
          <p className="text-[11px] text-slate-500">profile-matching leads</p>
        </div>

        {/* Saved but Not Applied */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Saved Not Applied
          </span>
          <p className="mt-1 text-2xl font-black text-amber-300">{health.savedNotApplied}</p>
          <p className="text-[11px] text-slate-500">queued for submission</p>
        </div>

        {/* Total Applied */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Total Applied
          </span>
          <p className="mt-1 text-2xl font-black text-indigo-300">{health.applied}</p>
          <p className="text-[11px] text-slate-500">submitted applications</p>
        </div>

        {/* Awaiting Initial Response */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Awaiting Response
          </span>
          <p className="mt-1 text-2xl font-black text-slate-200">{health.awaitingResponse}</p>
          <p className="text-[11px] text-slate-500">applied with no interview yet</p>
        </div>

        {/* In Active Screenings */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Active Screenings
          </span>
          <p className="mt-1 text-2xl font-black text-amber-300">{health.screenings}</p>
          <p className="text-[11px] text-slate-500">in screening stage</p>
        </div>

        {/* In Technical Rounds */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Technical Assessments
          </span>
          <p className="mt-1 text-2xl font-black text-purple-300">{health.technical}</p>
          <p className="text-[11px] text-slate-500">in technical rounds</p>
        </div>

        {/* In Final Stage */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Final Stage
          </span>
          <p className="mt-1 text-2xl font-black text-rose-300">{health.finalStages}</p>
          <p className="text-[11px] text-slate-500">executive & partner chats</p>
        </div>

        {/* Active Offers */}
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400">
            Offers Received
          </span>
          <p className="mt-1 text-2xl font-black text-emerald-300">{health.offers}</p>
          <p className="text-[11px] text-emerald-500/80">pending offer decisions</p>
        </div>

        {/* Follow-ups Due */}
        <div
          className={`rounded-xl border p-3.5 ${
            health.followUpsDue > 0
              ? "border-amber-500/40 bg-amber-950/20"
              : "border-slate-800 bg-slate-900/70"
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              health.followUpsDue > 0 ? "text-amber-300 font-bold" : "text-slate-400"
            }`}
          >
            Follow-ups Due Today
          </span>
          <p
            className={`mt-1 text-2xl font-black ${
              health.followUpsDue > 0 ? "text-amber-300" : "text-slate-300"
            }`}
          >
            {health.followUpsDue}
          </p>
          <p className="text-[11px] text-slate-500">due or overdue follow-ups</p>
        </div>

        {/* Applied but No Recent Activity */}
        <div
          className={`rounded-xl border p-3.5 ${
            health.appliedNoRecentActivity > 0
              ? "border-slate-700 bg-slate-900/90"
              : "border-slate-800 bg-slate-900/70"
          }`}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Inactive Applications
          </span>
          <p className="mt-1 text-2xl font-black text-slate-300">
            {health.appliedNoRecentActivity}
          </p>
          <p className="text-[11px] text-slate-500">&gt; threshold days inactive</p>
        </div>

        {/* Upcoming Scheduled Follow-ups */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Upcoming Follow-ups
          </span>
          <p className="mt-1 text-2xl font-black text-cyan-300">
            {health.applicationsWithUpcomingFollowUp}
          </p>
          <p className="text-[11px] text-slate-500">future scheduled check-ins</p>
        </div>
      </div>
    </section>
  );
}
