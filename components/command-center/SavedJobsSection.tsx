"use client";

import type { Application, Job } from "@/types";
import { calculateSavedJobAging } from "@/lib/savedJobsTracker";

interface SavedJobsSectionProps {
  savedJobs: Job[];
  applicationsMap: Map<string, Application>;
  onApply: (job: Job) => void;
  onUnsave: (job: Job) => void;
  onSelectJob: (job: Job) => void;
}

export function SavedJobsSection({
  savedJobs,
  applicationsMap,
  onApply,
  onUnsave,
  onSelectJob,
}: SavedJobsSectionProps) {
  if (savedJobs.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
        <p className="text-xs font-semibold text-slate-300">
          No saved jobs waiting for application submission.
        </p>
        <p className="text-[11px] text-slate-500 mt-0.5">
          Bookmark promising vacancies to curate your pipeline before applying.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
            <span>📑</span> Saved Jobs Awaiting Application ({savedJobs.length})
          </h3>
          <p className="text-xs text-slate-400">
            Keep pipeline momentum. Roles saved for over 2 days and 5 days are flagged for prompt action.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {savedJobs.map((job) => {
          const app = applicationsMap.get(job.id);
          const aging = calculateSavedJobAging(job, app);

          const agingBadge = {
            RECENT: "bg-slate-800 text-slate-300 border-slate-700",
            ACTION_RECOMMENDED: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold animate-pulse",
            CRITICAL: "bg-rose-500/20 text-rose-300 border-rose-500/50 font-black ring-1 ring-rose-500/40",
          }[aging.agingStatus];

          return (
            <div
              key={job.id}
              className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4
                    onClick={() => onSelectJob(job)}
                    className="text-sm font-bold text-white hover:text-cyan-300 transition cursor-pointer"
                  >
                    {job.title}
                  </h4>
                  <p className="text-xs text-slate-400 font-medium">
                    {job.company} • 📍 {job.location}
                  </p>
                </div>
                <span className={`rounded-lg border px-2 py-0.5 text-[10px] shrink-0 ${agingBadge}`}>
                  {aging.agingBadgeText}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                <span>
                  Rec: <strong className="text-emerald-400">{aging.recommendation}</strong>
                </span>
                <span>•</span>
                <span>
                  Fit: <strong className="text-cyan-300">{aging.careerFit.replace("_", " ")}</strong>
                </span>
                {job.salaryLpaMin && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400">₹{job.salaryLpaMin}L+</span>
                  </>
                )}
              </div>

              {aging.potentialGaps.length > 0 && (
                <p className="text-[11px] text-amber-400/80 bg-amber-950/20 rounded px-2 py-1 border border-amber-900/30">
                  ⚠️ Gap hint: {aging.potentialGaps[0]}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => onUnsave(job)}
                  className="rounded-lg border border-slate-800 px-2.5 py-1 text-[11px] text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  Unsave
                </button>
                <button
                  onClick={() => onSelectJob(job)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-200 hover:bg-slate-700 transition"
                >
                  Details
                </button>
                <button
                  onClick={() => onApply(job)}
                  className="rounded-lg bg-indigo-600 px-3 py-1 text-[11px] font-bold text-white hover:bg-indigo-500 transition shadow-sm"
                >
                  🚀 Apply Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
