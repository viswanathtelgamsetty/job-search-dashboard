"use client";

import Link from "next/link";
import type { DailyAction, TodayMetrics } from "@/types";

interface TodayActionsPanelProps {
  todayMetrics: TodayMetrics;
  dailyActions: DailyAction[];
}

export function TodayActionsPanel({
  todayMetrics,
  dailyActions,
}: TodayActionsPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h2 className="text-lg font-black tracking-tight text-white uppercase">
              Today: What should I do today?
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Real-time actionable next steps based on current pipeline and market state.
          </p>
        </div>
      </div>

      {/* Today Activity Snapshot Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {/* New Relevant Jobs */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            New Relevant
          </span>
          <p className="mt-1 text-xl font-bold text-emerald-400">
            {todayMetrics.newRelevantJobs}
          </p>
          <p className="text-[10px] text-slate-500">discovered fresh</p>
        </div>

        {/* Priority Opportunities */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Priority Roles
          </span>
          <p className="mt-1 text-xl font-bold text-cyan-300">
            {todayMetrics.priorityOpportunities}
          </p>
          <p className="text-[10px] text-slate-500">ready to apply</p>
        </div>

        {/* Saved Not Applied */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Saved Pending
          </span>
          <p className="mt-1 text-xl font-bold text-amber-300">
            {todayMetrics.savedNotApplied}
          </p>
          <p className="text-[10px] text-slate-500">awaiting submit</p>
        </div>

        {/* Applications Submitted Today */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Applied Today
          </span>
          <p className="mt-1 text-xl font-bold text-indigo-300">
            {todayMetrics.applicationsSubmittedToday}
          </p>
          <p className="text-[10px] text-slate-500">submissions today</p>
        </div>

        {/* Follow-ups Due */}
        <div
          className={`rounded-xl border p-3 ${
            todayMetrics.followUpsDue > 0
              ? "border-amber-500/40 bg-amber-950/20"
              : "border-slate-800 bg-slate-900/70"
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              todayMetrics.followUpsDue > 0 ? "text-amber-300 font-bold" : "text-slate-400"
            }`}
          >
            Follow-ups Due
          </span>
          <p
            className={`mt-1 text-xl font-bold ${
              todayMetrics.followUpsDue > 0 ? "text-amber-300" : "text-slate-300"
            }`}
          >
            {todayMetrics.followUpsDue}
          </p>
          <p className="text-[10px] text-slate-500">scheduled today</p>
        </div>

        {/* Overdue Follow-ups */}
        <div
          className={`rounded-xl border p-3 ${
            todayMetrics.overdueFollowUps > 0
              ? "border-red-500/40 bg-red-950/20"
              : "border-slate-800 bg-slate-900/70"
          }`}
        >
          <span
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              todayMetrics.overdueFollowUps > 0 ? "text-red-300 font-bold" : "text-slate-400"
            }`}
          >
            Overdue
          </span>
          <p
            className={`mt-1 text-xl font-bold ${
              todayMetrics.overdueFollowUps > 0 ? "text-red-400" : "text-slate-400"
            }`}
          >
            {todayMetrics.overdueFollowUps}
          </p>
          <p className="text-[10px] text-slate-500">past due date</p>
        </div>

        {/* Progressed Today */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Progressed
          </span>
          <p className="mt-1 text-xl font-bold text-emerald-300">
            {todayMetrics.applicationsProgressedToday}
          </p>
          <p className="text-[10px] text-slate-500">advanced stages</p>
        </div>
      </div>

      {/* Actionable Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {dailyActions.map((action) => {
          const badgeStyles = {
            urgent: "bg-red-500/15 border-red-500/40 text-red-300",
            attention: "bg-amber-500/15 border-amber-500/40 text-amber-300",
            info: "bg-cyan-500/15 border-cyan-500/40 text-cyan-300",
            neutral: "bg-slate-800 border-slate-700 text-slate-300",
          }[action.badgeType];

          return (
            <div
              key={action.id}
              className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/80 p-4 hover:border-slate-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${badgeStyles}`}
                  >
                    {action.count} item{action.count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-xs text-slate-500">Priority #{action.priorityOrder}</span>
                </div>
                <h3 className="text-sm font-bold text-white">{action.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{action.description}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80">
                <Link
                  href={action.actionUrl}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300 hover:underline"
                >
                  <span>Execute Action</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
