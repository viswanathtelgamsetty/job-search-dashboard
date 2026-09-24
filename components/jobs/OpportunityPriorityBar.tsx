"use client";

import type { Job, OpportunityPriority } from "@/types";
import { getOpportunityPriority } from "@/lib/marketRadar";

interface OpportunityPriorityBarProps {
  jobs: Job[];
  selectedPriority: string;
  onSelectPriority: (priority: string) => void;
}

export function OpportunityPriorityBar({
  jobs,
  selectedPriority,
  onSelectPriority,
}: OpportunityPriorityBarProps) {
  const liveJobs = jobs.filter((j) => !j.isDemo);

  const counts: Record<OpportunityPriority, number> = {
    PRIORITY: liveJobs.filter((j) => getOpportunityPriority(j) === "PRIORITY").length,
    ACTIVE: liveJobs.filter((j) => getOpportunityPriority(j) === "ACTIVE").length,
    WATCH: liveJobs.filter((j) => getOpportunityPriority(j) === "WATCH").length,
    LOW: liveJobs.filter((j) => getOpportunityPriority(j) === "LOW").length,
  };

  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
            <span>🎯 OPPORTUNITY ACTION RADAR</span>
            <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded font-mono">
              Deterministic Priority
            </span>
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            <span className="font-semibold text-slate-300">Priority opportunities</span> = High/Relevant career fit + Fresh/Recent posting
          </p>
        </div>

        {selectedPriority !== "ALL" && (
          <button
            onClick={() => onSelectPriority("ALL")}
            className="self-start sm:self-center text-xs font-medium text-cyan-400 hover:text-cyan-300 hover:underline"
          >
            Show All Priorities
          </button>
        )}
      </div>

      {/* 4 Priority Pods + All Option */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* PRIORITY */}
        <button
          onClick={() => onSelectPriority(selectedPriority === "PRIORITY" ? "ALL" : "PRIORITY")}
          className={`flex flex-col justify-between rounded-xl p-3 text-left transition border ${
            selectedPriority === "PRIORITY"
              ? "border-emerald-500 bg-emerald-950/40 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/50"
              : "border-emerald-900/50 bg-emerald-950/20 hover:border-emerald-700/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
              <span>●</span>
              <span>PRIORITY</span>
            </span>
            <span className="rounded bg-emerald-900/60 border border-emerald-700/60 px-2 py-0.5 text-xs font-bold text-emerald-200 font-mono">
              {counts.PRIORITY}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-white">Act & Apply Now</div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">High/Relevant + Fresh/Recent</div>
        </button>

        {/* ACTIVE */}
        <button
          onClick={() => onSelectPriority(selectedPriority === "ACTIVE" ? "ALL" : "ACTIVE")}
          className={`flex flex-col justify-between rounded-xl p-3 text-left transition border ${
            selectedPriority === "ACTIVE"
              ? "border-cyan-500 bg-cyan-950/40 shadow-lg shadow-cyan-950/30 ring-1 ring-cyan-500/50"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
              <span>○</span>
              <span>ACTIVE</span>
            </span>
            <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-bold text-slate-200 font-mono">
              {counts.ACTIVE}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-white">Strong Fit Market Pool</div>
          <div className="text-[10px] text-slate-400 mt-0.5">High/Relevant + Older posting</div>
        </button>

        {/* WATCH */}
        <button
          onClick={() => onSelectPriority(selectedPriority === "WATCH" ? "ALL" : "WATCH")}
          className={`flex flex-col justify-between rounded-xl p-3 text-left transition border ${
            selectedPriority === "WATCH"
              ? "border-amber-500 bg-amber-950/40 shadow-lg shadow-amber-950/30 ring-1 ring-amber-500/50"
              : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <span>👁</span>
              <span>WATCH</span>
            </span>
            <span className="rounded bg-slate-800 border border-slate-700 px-2 py-0.5 text-xs font-bold text-slate-200 font-mono">
              {counts.WATCH}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-white">Adjacent Fresh Leads</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Possible + Fresh/Recent</div>
        </button>

        {/* LOW */}
        <button
          onClick={() => onSelectPriority(selectedPriority === "LOW" ? "ALL" : "LOW")}
          className={`flex flex-col justify-between rounded-xl p-3 text-left transition border ${
            selectedPriority === "LOW"
              ? "border-slate-500 bg-slate-800 ring-1 ring-slate-400"
              : "border-slate-800 bg-slate-900/60 opacity-80 hover:opacity-100 hover:border-slate-700"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <span>-</span>
              <span>LOW</span>
            </span>
            <span className="rounded bg-slate-850 border border-slate-800 px-2 py-0.5 text-xs font-bold text-slate-400 font-mono">
              {counts.LOW}
            </span>
          </div>
          <div className="mt-2 text-xs font-semibold text-slate-300">Lower Fit / Older</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Possible/Low + Older</div>
        </button>
      </div>
    </section>
  );
}
