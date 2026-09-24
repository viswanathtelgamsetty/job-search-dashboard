"use client";

import type { CareerDomain, Job } from "@/types";
import { CAREER_LANES } from "@/lib/marketRadar";

interface CareerLanesBarProps {
  jobs: Job[];
  selectedDomain: string;
  onSelectDomain: (domain: string) => void;
}

export function CareerLanesBar({
  jobs,
  selectedDomain,
  onSelectDomain,
}: CareerLanesBarProps) {
  // Count primary domains strictly from jobs (no new domain inference logic)
  const laneCounts = CAREER_LANES.reduce((acc, lane) => {
    acc[lane.key] = jobs.filter((j) => j.domains?.includes(lane.key)).length;
    return acc;
  }, {} as Record<CareerDomain, number>);

  return (
    <section className="space-y-2 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
          <span>🎯 TARGET CAREER LANES</span>
          <span className="text-[10px] text-slate-500 font-normal">
            (Evidence-Based Primary Domains)
          </span>
        </h3>
        {selectedDomain !== "ALL" && (
          <button
            onClick={() => onSelectDomain("ALL")}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
          >
            Show All Domains
          </button>
        )}
      </div>

      {/* Horizontal scrolling / responsive wrapping lane pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          onClick={() => onSelectDomain("ALL")}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
            selectedDomain === "ALL"
              ? "border border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold shadow-sm"
              : "border border-slate-800 bg-slate-950/80 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          <span>🌐 All Lanes</span>
          <span className="text-[10px] text-slate-500 font-mono">({jobs.length})</span>
        </button>

        {CAREER_LANES.map((lane) => {
          const isSelected = selectedDomain === lane.key;
          const count = laneCounts[lane.key] || 0;

          return (
            <button
              key={lane.key}
              onClick={() => onSelectDomain(isSelected ? "ALL" : lane.key)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition ${
                isSelected
                  ? "border border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold shadow-sm ring-1 ring-cyan-500/50"
                  : count > 0
                  ? "border border-slate-800 bg-slate-950/80 text-slate-300 hover:border-slate-700 hover:text-white"
                  : "border border-slate-850 bg-slate-950/40 text-slate-500 opacity-60 hover:opacity-100"
              }`}
            >
              <span>{lane.icon}</span>
              <span>{lane.label}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  isSelected
                    ? "bg-cyan-900/60 text-cyan-200"
                    : count > 0
                    ? "bg-slate-800 text-slate-300"
                    : "bg-slate-900 text-slate-600"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
