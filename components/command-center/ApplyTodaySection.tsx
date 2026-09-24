"use client";

import type { Application, Job } from "@/types";


interface ApplyTodaySectionProps {
  jobs: Job[];
  applicationsMap: Map<string, Application>;
  onApply: (job: Job) => void;
  onSave: (job: Job) => void;
  onIgnore: (job: Job) => void;
  onSelectJob: (job: Job) => void;
}

export function ApplyTodaySection({
  jobs,
  applicationsMap,
  onApply,
  onSave,
  onIgnore,
  onSelectJob,
}: ApplyTodaySectionProps) {
  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-8 text-center text-slate-400">
        <p className="text-sm font-semibold text-slate-300">
          🎉 No jobs pending application in today&apos;s queue!
        </p>
        <p className="text-xs text-slate-500 mt-1">
          All high-fit recommendations have been processed or saved. Run a sync or explore the full market radar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span>🎯</span> Apply Today Queue ({jobs.length})
          </h3>
          <p className="text-xs text-slate-400">
            Prioritized by deterministic recommendation: APPLY_NOW → REVIEW → Fresh High-Relevance Architect roles.
          </p>
        </div>
      </div>

      <div className="space-y-3.5">
        {jobs.map((job) => {
          const app = applicationsMap.get(job.id);
          const isSaved = app?.status === "SAVED" || job.status === "SAVED";
          const isApplied = app ? !["DISCOVERED", "SAVED", "IGNORED"].includes(app.status) : job.status === "APPLIED";
          const rec = job.applicationRecommendation || job.match?.applicationRecommendation || "WATCH";
          const fit = job.careerFit || job.match?.careerFit || "POSSIBLE";

          const recBadge = {
            APPLY_NOW: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-black",
            REVIEW: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold",
            WATCH: "bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold",
            SKIP: "bg-slate-800 text-slate-400 border-slate-700",
          }[rec];

          const fitBadge = {
            HIGH_RELEVANCE: "text-emerald-400 font-bold",
            RELEVANT: "text-cyan-300 font-semibold",
            POSSIBLE: "text-amber-300 font-medium",
            LOW_RELEVANCE: "text-slate-400",
          }[fit];

          const formatStrength = (val?: { strength?: string } | string) => {
            if (!val) return "NONE";
            if (typeof val === "string") return val;
            return val.strength || "MODERATE";
          };

          const techStr = formatStrength(job.technologyFit || job.match?.technologyFit);
          const domStr = formatStrength(job.domainFit || job.match?.domainFit);
          const archStr = formatStrength(job.architectureFit || job.match?.architectureFit);
          const clientStr = formatStrength(job.clientConsultingFit || job.match?.clientConsultingFit);
          const intlStr = formatStrength(job.internationalFit || job.match?.internationalFit);

          return (
            <div
              key={job.id}
              className={`rounded-2xl border p-5 transition-all shadow-md ${
                rec === "APPLY_NOW"
                  ? "border-emerald-500/40 bg-gradient-to-br from-emerald-950/20 via-slate-900 to-slate-900"
                  : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
              }`}
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left details */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-lg border px-2.5 py-0.5 text-[11px] ${recBadge}`}>
                      {rec}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      Career Fit: <span className={fitBadge}>{fit.replace("_", " ")}</span>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      Tier: {job.roleTier || job.match?.roleTier || "TIER_3"}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-[11px] text-slate-400">
                      Freshness:{" "}
                      <span className="font-bold text-slate-200">
                        {job.freshness || "UNKNOWN"}
                      </span>
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base sm:text-lg font-black text-white hover:text-cyan-300 transition cursor-pointer" onClick={() => onSelectJob(job)}>
                      {job.title}
                    </h4>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span className="font-bold text-white">{job.company}</span>
                      <span className="text-slate-600">•</span>
                      <span>📍 {job.location}</span>
                      <span className="text-slate-600">•</span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300 font-medium">
                        🌐 {job.remoteType}
                      </span>
                      {job.salaryLpaMin && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="text-emerald-400 font-semibold">
                            💰 ₹{job.salaryLpaMin}L{job.salaryLpaMax ? ` - ₹${job.salaryLpaMax}L` : "+"} PA
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Fit Dimensions Grid */}
                  <div className="flex flex-wrap items-center gap-2 text-[10px]">
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                      Tech: <strong className="text-white">{techStr}</strong>
                    </span>
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                      Domain: <strong className="text-white">{domStr}</strong>
                    </span>
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                      Arch: <strong className="text-white">{archStr}</strong>
                    </span>
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                      Client: <strong className="text-white">{clientStr}</strong>
                    </span>
                    <span className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300">
                      Intl: <strong className="text-white">{intlStr}</strong>
                    </span>
                    {job.travel?.type && job.travel.type !== "NO_TRAVEL_MENTIONED" && (
                      <span className="rounded bg-indigo-950 border border-indigo-800/70 px-2 py-0.5 text-indigo-300 font-medium">
                        ✈️ {job.travel.type} {job.travel.percentage ? `(${job.travel.percentage}%)` : ""}
                      </span>
                    )}
                  </div>

                  {/* Provenance & Source */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 pt-1">
                    <span>Source: <strong className="text-slate-300">{job.source}</strong></span>
                    {job.url && (
                      <>
                        <span className="text-slate-600">•</span>
                        <a
                          href={job.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline font-medium inline-flex items-center gap-1"
                        >
                          🔗 Open Source Posting ↗
                        </a>
                      </>
                    )}
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex sm:flex-row lg:flex-col items-stretch gap-2 shrink-0 lg:w-44">
                  <button
                    onClick={() => onApply(job)}
                    className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2.5 text-xs font-black text-white shadow-md hover:from-cyan-400 hover:to-indigo-500 transition cursor-pointer"
                  >
                    {isApplied ? "✓ Applied" : "🚀 Apply Today"}
                  </button>

                  <button
                    onClick={() => onSave(job)}
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs font-semibold transition cursor-pointer ${
                      isSaved
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-300 font-bold"
                        : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
                    }`}
                  >
                    {isSaved ? "✓ Saved" : "☆ Save"}
                  </button>

                  <button
                    onClick={() => onSelectJob(job)}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-800/60 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition cursor-pointer"
                  >
                    🔍 Details
                  </button>

                  <button
                    onClick={() => onIgnore(job)}
                    className="rounded-xl border border-transparent px-2.5 py-1 text-[11px] text-slate-500 hover:text-rose-400 hover:bg-rose-950/20 transition cursor-pointer"
                  >
                    ✕ Ignore
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
