"use client";

import type { Job } from "@/types";
import type { NewSinceLastVisitSummary } from "@/lib/lastVisitTracker";

interface NewSinceLastVisitSectionProps {
  summary: NewSinceLastVisitSummary;
  onMarkSeen: () => void;
  onSelectJob: (job: Job) => void;
}

export function NewSinceLastVisitSection({
  summary,
  onMarkSeen,
  onSelectJob,
}: NewSinceLastVisitSectionProps) {
  if (summary.totalNewJobs === 0) return null;

  return (
    <div className="rounded-2xl border border-cyan-800/60 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Fresh Arrivals Since Your Last Visit ({summary.totalNewJobs})
          </h3>
        </div>

        <button
          onClick={onMarkSeen}
          className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 transition cursor-pointer"
        >
          ✓ Mark All as Seen
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs">
        {summary.newApplyNow.length > 0 && (
          <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 font-bold">
            🚀 {summary.newApplyNow.length} New Apply Now
          </span>
        )}
        {summary.newReview.length > 0 && (
          <span className="rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-2.5 py-1 font-semibold">
            🔍 {summary.newReview.length} New Needs Review
          </span>
        )}
        {summary.newHighRelevance.length > 0 && (
          <span className="rounded-lg bg-teal-500/20 text-teal-300 border border-teal-500/40 px-2.5 py-1 font-semibold">
            🎯 {summary.newHighRelevance.length} High Relevance
          </span>
        )}
        {summary.newInternational.length > 0 && (
          <span className="rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-2.5 py-1 font-semibold">
            ✈️ {summary.newInternational.length} International / Global
          </span>
        )}
        {summary.newHyderabad.length > 0 && (
          <span className="rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 px-2.5 py-1 font-semibold">
            📍 {summary.newHyderabad.length} Hyderabad Hub
          </span>
        )}
        {summary.newRemoteIndia.length > 0 && (
          <span className="rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-1 font-semibold">
            🌐 {summary.newRemoteIndia.length} Remote India
          </span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
        <span className="text-slate-400">Quick peek:</span>
        {summary.newApplyNow.concat(summary.newReview).slice(0, 3).map((job) => (
          <button
            key={job.id}
            onClick={() => onSelectJob(job)}
            className="rounded bg-slate-800/80 px-2 py-0.5 text-slate-300 hover:text-white hover:bg-slate-700 transition"
          >
            {job.company} — {job.title.slice(0, 25)}...
          </button>
        ))}
      </div>
    </div>
  );
}
