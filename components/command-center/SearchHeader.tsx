"use client";

import type { SearchProgress } from "@/types";

interface SearchHeaderProps {
  progress: SearchProgress;
  totalJobs: number;
  relevantJobs: number;
  totalApplications: number;
  followUpsDue: number;
  onOpenSettings: () => void;
}

export function SearchHeader({
  progress,
  totalJobs,
  relevantJobs,
  totalApplications,
  followUpsDue,
  onOpenSettings,
}: SearchHeaderProps) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-7 shadow-xl shadow-black/40">
      {/* Top Meta Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-cyan-400">
              60-Day Job Search Campaign
            </span>
            <span className="rounded-md bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
              {progress.searchStartDate} → {progress.searchEndDate}
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl sm:text-3xl font-black tracking-tight text-white">
            Job Search Command Center
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">
            Daily execution dashboard for your 12+ yrs Senior Lead & Frontend Architect campaign.
          </p>
        </div>

        <button
          onClick={onOpenSettings}
          className="self-start sm:self-center inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white hover:border-slate-600 transition"
        >
          <span>⚙️ Configure Campaign</span>
        </button>
      </div>

      {/* Progress Bar & Key Metric Counters */}
      <div className="mt-5 space-y-4">
        {/* Progress Timeline Header */}
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-slate-300">
            Day <strong className="text-cyan-300 text-sm">{progress.currentDay}</strong> of{" "}
            {progress.durationDays}
          </span>
          <span className="text-slate-400">
            {progress.isCompleted ? (
              <span className="text-emerald-400 font-bold">Campaign Period Complete</span>
            ) : (
              <span>
                <strong className="text-indigo-300 text-sm">{progress.daysRemaining}</strong> days
                remaining ({progress.progressPercentage}%)
              </span>
            )}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress.progressPercentage}%` }}
          />
        </div>

        {/* 6 Hero KPI Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Day X / 60 */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Current Day
            </span>
            <p className="mt-1 text-2xl font-black text-cyan-300">Day {progress.currentDay}</p>
            <p className="text-[11px] text-slate-500">of {progress.durationDays}</p>
          </div>

          {/* Days Remaining */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Remaining
            </span>
            <p className="mt-1 text-2xl font-black text-white">{progress.daysRemaining}d</p>
            <p className="text-[11px] text-slate-500">until campaign end</p>
          </div>

          {/* Jobs Found */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Jobs Found
            </span>
            <p className="mt-1 text-2xl font-black text-slate-200">{totalJobs}</p>
            <p className="text-[11px] text-slate-500">in market radar</p>
          </div>

          {/* Relevant Jobs */}
          <div className="rounded-xl border border-emerald-950/60 border-emerald-800/40 bg-slate-950/60 p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Relevant
            </span>
            <p className="mt-1 text-2xl font-black text-emerald-300">{relevantJobs}</p>
            <p className="text-[11px] text-emerald-500/80">fit profile</p>
          </div>

          {/* Applications */}
          <div className="rounded-xl border border-indigo-950/60 border-indigo-800/40 bg-slate-950/60 p-3.5 text-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
              Applications
            </span>
            <p className="mt-1 text-2xl font-black text-indigo-300">{totalApplications}</p>
            <p className="text-[11px] text-indigo-400/80">active & tracked</p>
          </div>

          {/* Follow-ups */}
          <div
            className={`rounded-xl border p-3.5 text-center ${
              followUpsDue > 0
                ? "border-amber-500/50 bg-amber-950/30 ring-1 ring-amber-500/30"
                : "border-slate-800 bg-slate-950/60"
            }`}
          >
            <span
              className={`text-[10px] font-bold uppercase tracking-wider ${
                followUpsDue > 0 ? "text-amber-300" : "text-slate-400"
              }`}
            >
              Follow-ups
            </span>
            <p
              className={`mt-1 text-2xl font-black ${
                followUpsDue > 0 ? "text-amber-300" : "text-slate-300"
              }`}
            >
              {followUpsDue}
            </p>
            <p className="text-[11px] text-slate-500">
              {followUpsDue > 0 ? "action due today" : "all up to date"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
