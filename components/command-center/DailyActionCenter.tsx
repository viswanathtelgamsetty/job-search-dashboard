"use client";

import Link from "next/link";
import type { TodayMetrics } from "@/types";

interface DailyActionCenterProps {
  todayMetrics: TodayMetrics;
  onSelectActionTab?: (tab: "APPLY_NOW" | "REVIEW" | "SAVED" | "FOLLOW_UPS" | "ALL") => void;
  activeTab?: string;
}

export function DailyActionCenter({
  todayMetrics,
  onSelectActionTab,
  activeTab = "ALL",
}: DailyActionCenterProps) {
  const formattedDate =
    todayMetrics.todayDateFormatted ||
    new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  const cards = [
    {
      id: "APPLY_NOW" as const,
      label: "Apply Now",
      subLabel: "urgent high fit",
      count: todayMetrics.applyNowCount ?? 0,
      highlight: (todayMetrics.applyNowCount ?? 0) > 0,
      borderClass: "border-emerald-500/50 bg-emerald-950/20 text-emerald-300",
      countClass: "text-emerald-400",
      dotClass: "bg-emerald-400 animate-pulse",
    },
    {
      id: "REVIEW" as const,
      label: "Needs Review",
      subLabel: "relevance review",
      count: todayMetrics.needsReviewCount ?? 0,
      highlight: (todayMetrics.needsReviewCount ?? 0) > 0,
      borderClass: "border-cyan-500/40 bg-cyan-950/20 text-cyan-300",
      countClass: "text-cyan-300",
      dotClass: "bg-cyan-400",
    },
    {
      id: "SAVED" as const,
      label: "Saved / Not Applied",
      subLabel: "awaiting submit",
      count: todayMetrics.savedNotAppliedCount ?? todayMetrics.savedNotApplied,
      highlight: (todayMetrics.savedNotAppliedCount ?? todayMetrics.savedNotApplied) > 0,
      borderClass: "border-amber-500/40 bg-amber-950/20 text-amber-300",
      countClass: "text-amber-400",
      dotClass: "bg-amber-400",
    },
    {
      id: "FOLLOW_UPS" as const,
      label: "Follow-ups Due",
      subLabel: "recruiter momentum",
      count: todayMetrics.followUpsDueToday ?? todayMetrics.followUpsDue,
      highlight: (todayMetrics.followUpsDueToday ?? todayMetrics.followUpsDue) > 0,
      borderClass: "border-indigo-500/40 bg-indigo-950/20 text-indigo-300",
      countClass: "text-indigo-300",
      dotClass: "bg-indigo-400",
    },
    {
      id: "FOLLOW_UPS" as const,
      label: "Overdue",
      subLabel: "needs immediate check",
      count: todayMetrics.overdueFollowUps,
      highlight: todayMetrics.overdueFollowUps > 0,
      borderClass:
        todayMetrics.overdueFollowUps > 0
          ? "border-rose-500/60 bg-rose-950/30 text-rose-300"
          : "border-slate-800 bg-slate-900/60 text-slate-400",
      countClass: todayMetrics.overdueFollowUps > 0 ? "text-rose-400 font-black" : "text-slate-500",
      dotClass: todayMetrics.overdueFollowUps > 0 ? "bg-rose-400 animate-ping" : "bg-slate-600",
    },
  ];

  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 sm:p-6 shadow-xl space-y-5">
      {/* Header with Today's Date */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Daily Action Center
            </span>
          </div>
          <h2 className="mt-1 text-2xl font-black text-white tracking-tight">
            Today: {formattedDate}
          </h2>
          <p className="mt-0.5 text-xs text-slate-400">
            Real-time execution dashboard for high-fit discovery, applications, saved roles, and follow-ups.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/applications"
            className="rounded-xl border border-slate-700 bg-slate-800/80 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            📋 Application CRM
          </Link>
          <Link
            href="/jobs"
            className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3.5 py-2 text-xs font-bold text-white shadow-md hover:from-emerald-500 hover:to-teal-500 transition"
          >
            🔍 Explore Market Radar
          </Link>
        </div>
      </div>

      {/* Snapshot Counters (Deterministic, exact state) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((card, idx) => {
          const isSelected = activeTab === card.id;
          return (
            <button
              key={idx}
              onClick={() => onSelectActionTab?.(card.id)}
              className={`rounded-xl border p-3.5 text-left transition-all hover:scale-[1.02] cursor-pointer ${
                card.borderClass
              } ${isSelected ? "ring-2 ring-white/30 shadow-lg" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  {card.label}
                </span>
                <span className={`h-2 w-2 rounded-full ${card.dotClass}`}></span>
              </div>
              <p className={`mt-2 text-2xl font-black ${card.countClass}`}>
                {card.count}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">{card.subLabel}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
