"use client";

import { useState } from "react";
import type { DailyActivityBucket, SearchPeriodSettings, WeeklyActivityBucket } from "@/types";

interface WeeklyActivitySectionProps {
  weeklyBuckets: WeeklyActivityBucket[];
  dailyBuckets: DailyActivityBucket[];
  settings: SearchPeriodSettings;
}

export function WeeklyActivitySection({
  weeklyBuckets,
  dailyBuckets,
  settings,
}: WeeklyActivitySectionProps) {
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");

  // Find current week bucket for target vs actual comparison
  const currentWeek = weeklyBuckets.find((w) => w.isCurrent) || weeklyBuckets[0];
  const currentWeekApps = currentWeek ? currentWeek.applicationsSubmitted : 0;
  const currentWeekFollowUps = currentWeek ? currentWeek.followUpsCompleted : 0;

  return (
    <section className="space-y-4">
      {/* Header with View Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <h2 className="text-lg font-black tracking-tight text-white uppercase">
              Campaign Timeline & Activity Breakdown
            </h2>
          </div>
          <p className="text-xs text-slate-400">
            Factual tracking of jobs discovered, saved, applied, follow-ups, and progressions across the 60-day window.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-800 bg-slate-950 p-1 self-start sm:self-center">
          <button
            onClick={() => setViewMode("weekly")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "weekly"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Weekly (9 Weeks)
          </button>
          <button
            onClick={() => setViewMode("daily")}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              viewMode === "daily"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Day-by-Day (60 Days)
          </button>
        </div>
      </div>

      {/* Target vs Actual Comparison Banner (User-Configurable) */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Current Week Targets ({currentWeek?.label || "Week 1"})
          </span>
          <span className="text-[11px] text-slate-500">
            * User-configured targets. For personal accountability only; not a success score.
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Applications Target */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Applications / Week</span>
              <span className="text-slate-500 font-mono text-[11px]">
                Target: {settings.applicationsPerWeekTarget}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-indigo-300">{currentWeekApps}</span>
              <span className="text-xs text-slate-500">
                / {settings.applicationsPerWeekTarget} submitted
              </span>
            </div>
          </div>

          {/* Follow-ups Target */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Follow-ups / Week</span>
              <span className="text-slate-500 font-mono text-[11px]">
                Target: {settings.followUpsPerWeekTarget}
              </span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-300">{currentWeekFollowUps}</span>
              <span className="text-xs text-slate-500">
                / {settings.followUpsPerWeekTarget} completed
              </span>
            </div>
          </div>

          {/* Inactive Application Policy */}
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Inactive Threshold</span>
              <span className="text-cyan-400 font-bold">{settings.inactiveThresholdDays} Days</span>
            </div>
            <p className="mt-1.5 text-xs text-slate-400 leading-snug">
              Applications with no updates for &gt; {settings.inactiveThresholdDays}d are surfaced in
              Daily Actions.
            </p>
          </div>
        </div>
      </div>

      {/* VIEW 1: Weekly Cards (Week 1 through Week 9) */}
      {viewMode === "weekly" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3.5">
          {weeklyBuckets.map((week) => (
            <div
              key={week.weekNumber}
              className={`rounded-xl border p-4 transition ${
                week.isCurrent
                  ? "border-cyan-500/50 bg-slate-900/90 shadow-md shadow-cyan-950/20 ring-1 ring-cyan-500/30"
                  : "border-slate-800 bg-slate-900/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">{week.label}</span>
                {week.isCurrent && (
                  <span className="rounded-full bg-cyan-500/20 border border-cyan-500/40 px-2 py-0.2 text-[10px] font-bold text-cyan-300">
                    Current
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500 font-mono">
                {week.startDate} → {week.endDate} ({week.daysCount}d)
              </p>

              <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Discovered</span>
                  <p className="font-semibold text-slate-300">{week.jobsDiscovered}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Saved</span>
                  <p className="font-semibold text-cyan-300">{week.jobsSaved}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Applied</span>
                  <p className="font-semibold text-indigo-300">{week.applicationsSubmitted}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase">Follow-ups</span>
                  <p className="font-semibold text-amber-300">{week.followUpsCompleted}</p>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 text-[10px] uppercase">Progressed</span>
                  <p className="font-semibold text-emerald-300">{week.applicationsProgressed}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* VIEW 2: 60-Day Timeline Grid */
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>60-Day Activity Calendar (Days 1 to 60)</span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-cyan-400"></span> Discovered
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-indigo-400"></span> Applied
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-400"></span> Follow-up
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span> Progressed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-10 lg:grid-cols-12 gap-2">
            {dailyBuckets.map((day) => {
              const hasActivity =
                day.jobsDiscovered > 0 ||
                day.jobsSaved > 0 ||
                day.applicationsSubmitted > 0 ||
                day.followUpsCompleted > 0 ||
                day.applicationsProgressed > 0;

              return (
                <div
                  key={day.dayNumber}
                  className={`rounded-lg border p-2 text-center transition ${
                    day.isToday
                      ? "border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500"
                      : hasActivity
                      ? "border-slate-700 bg-slate-850"
                      : "border-slate-800/80 bg-slate-950/40 text-slate-600"
                  }`}
                  title={`Day ${day.dayNumber} (${day.date}): Discovered ${day.jobsDiscovered}, Saved ${day.jobsSaved}, Applied ${day.applicationsSubmitted}, Follow-ups ${day.followUpsCompleted}, Progressed ${day.applicationsProgressed}`}
                >
                  <p className="text-[10px] font-mono font-bold text-slate-400">D{day.dayNumber}</p>
                  <p className="text-[9px] text-slate-500 truncate">{day.date.slice(5)}</p>

                  <div className="mt-1 flex items-center justify-center gap-0.5">
                    {day.jobsDiscovered > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                    )}
                    {day.applicationsSubmitted > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />
                    )}
                    {day.followUpsCompleted > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    )}
                    {day.applicationsProgressed > 0 && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                    {!hasActivity && <span className="h-1 w-1 rounded-full bg-slate-800" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
