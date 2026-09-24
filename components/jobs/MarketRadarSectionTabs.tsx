"use client";

import type { Job, MarketRadarSection } from "@/types";
import { RADAR_SECTIONS, matchesRadarSection } from "@/lib/marketRadar";

interface MarketRadarSectionTabsProps {
  jobs: Job[];
  activeSection: MarketRadarSection;
  onSelectSection: (section: MarketRadarSection) => void;
}

export function MarketRadarSectionTabs({
  jobs,
  activeSection,
  onSelectSection,
}: MarketRadarSectionTabsProps) {
  // Precompute count for each section
  const sectionCounts = RADAR_SECTIONS.reduce((acc, sec) => {
    acc[sec.id] = jobs.filter((j) => matchesRadarSection(j, sec.id)).length;
    return acc;
  }, {} as Record<MarketRadarSection, number>);

  const currentSectionConfig = RADAR_SECTIONS.find((s) => s.id === activeSection) || RADAR_SECTIONS[0];

  return (
    <section className="space-y-3">
      {/* Tab Navigation Strip */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/80 pb-3">
        {RADAR_SECTIONS.map((sec) => {
          const isActive = activeSection === sec.id;
          const count = sectionCounts[sec.id] || 0;

          return (
            <button
              key={sec.id}
              onClick={() => onSelectSection(sec.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950/20"
                  : "bg-slate-900/60 text-slate-400 border border-slate-800/80 hover:border-slate-700 hover:text-slate-200"
              }`}
            >
              <span
                className={`rounded px-1.5 py-0.2 text-[10px] font-mono font-bold ${
                  isActive
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {sec.tag}
              </span>
              <span>{sec.title}</span>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-mono font-bold ${
                  isActive
                    ? "bg-cyan-400 text-slate-950"
                    : "bg-slate-800 text-slate-300"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Active Section Context Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-slate-900/60 border border-slate-800/80 px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-white flex items-center gap-1.5">
            <span className="text-cyan-400">Section {currentSectionConfig.tag}:</span>
            <span>{currentSectionConfig.title}</span>
          </span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{currentSectionConfig.subtitle}</span>
        </div>

        <div className="text-slate-400 text-[11px]">
          Showing <span className="text-white font-bold">{sectionCounts[activeSection] || 0}</span> opportunities in this radar group
        </div>
      </div>
    </section>
  );
}
