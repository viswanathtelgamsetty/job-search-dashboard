"use client";

import type { Job } from "@/types";
import { useState } from "react";

interface JobCardProps {
  job: Job;
  onSave?: (job: Job) => void;
  onApply?: (job: Job) => void;
  onIgnore?: (job: Job) => void;
  onStatusChange?: (job: Job, status: Job["status"]) => void;
}

export function JobCard({
  job,
  onSave,
  onApply,
  onIgnore,
  onStatusChange,
}: JobCardProps) {
  const [showAllReasons, setShowAllReasons] = useState(false);

  // Salary presentation
  let salaryText = "Salary Undisclosed";
  if (job.salaryDisclosed && job.salaryLpaMin) {
    if (job.salaryLpaMax && job.salaryLpaMax !== job.salaryLpaMin) {
      salaryText = `₹${job.salaryLpaMin}L – ₹${job.salaryLpaMax}L PA`;
    } else {
      salaryText = `₹${job.salaryLpaMin}L+ PA`;
    }
  }

  // Travel badge style
  const isInternational = job.travel.type === "INTERNATIONAL";
  const isClientSite = job.travel.type === "CLIENT_SITE";
  const isOccasional = job.travel.type === "OCCASIONAL";

  // Experience presentation
  const expText =
    job.experienceMin !== undefined
      ? `${job.experienceMin}${job.experienceMax ? `–${job.experienceMax}` : "+"} yrs exp`
      : "12+ yrs level";

  // Match score color
  const score = job.match?.overallScore || 0;
  const scoreColor =
    score >= 80
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : score >= 60
      ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
      : "bg-amber-500/15 text-amber-400 border-amber-500/30";

  return (
    <article
      className={`rounded-2xl border transition-all duration-200 p-6 ${
        job.status === "SAVED"
          ? "border-cyan-500/40 bg-slate-900/90 shadow-lg shadow-cyan-950/20"
          : job.status === "APPLIED"
          ? "border-indigo-500/40 bg-slate-900/90"
          : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
      }`}
    >
      {/* Demo Badge Banner if demo data */}
      {job.isDemo && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
          <span>⚠️ DEMO DATA</span>
          <span className="text-amber-400/80 font-normal">
            — Sample Verification Listing (Not a current live vacancy)
          </span>
        </div>
      )}

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        {/* Main Content */}
        <div className="flex-1 space-y-3.5">
          {/* Header Row: Title, Company, Source Badges */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg font-bold text-white tracking-tight hover:text-cyan-400 transition-colors">
                <a href={job.url} target="_blank" rel="noopener noreferrer">
                  {job.title}
                </a>
              </h3>

              {/* Match Score Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${scoreColor}`}
              >
                ★ {score}% Match
              </span>

              {/* Live or Demo Badge */}
              {job.isDemo ? (
                <span className="rounded-full bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  DEMO
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-700/80 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  LIVE
                </span>
              )}

              {/* Status Badge */}
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                {job.status}
              </span>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-300 font-medium">
              <span className="text-white font-semibold">{job.company}</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">{job.roleFamily}</span>
              <span className="text-slate-600">•</span>
              <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">
                Source: {job.source}
              </span>
            </div>
          </div>

          {/* Quick Metrics Bar: Location, Remote, Salary, Experience, Travel */}
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            {/* Location */}
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/70 border border-slate-700/60 px-2.5 py-1 text-slate-300">
              📍 {job.location}
            </span>

            {/* Remote Type */}
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium border ${
                job.remoteType === "REMOTE"
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                  : job.remoteType === "HYBRID"
                  ? "bg-sky-950/60 text-sky-300 border-sky-800/50"
                  : "bg-slate-800/60 text-slate-300 border-slate-700"
              }`}
            >
              🌐 {job.remoteType}
            </span>

            {/* Compensation */}
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium border ${
                job.salaryDisclosed
                  ? "bg-emerald-950/50 text-emerald-300 border-emerald-800/60"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50"
              }`}
            >
              💰 {salaryText}
            </span>

            {/* Experience */}
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/70 border border-slate-700/60 px-2.5 py-1 text-slate-300">
              ⏳ {expText}
            </span>

            {/* Travel Requirement */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium border ${
                isInternational
                  ? "bg-indigo-950/70 text-indigo-300 border-indigo-700/60 animate-pulse"
                  : isClientSite
                  ? "bg-cyan-950/70 text-cyan-300 border-cyan-700/60"
                  : isOccasional
                  ? "bg-slate-800/70 text-slate-300 border-slate-700"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
            >
              ✈️ {job.travel.notes || `${job.travel.type} Travel`}
              {job.travel.percentage && ` (${job.travel.percentage}%)`}
            </span>
          </div>

          {/* Travel Destinations if available */}
          {job.travel.destinations && job.travel.destinations.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-indigo-300">
              <span className="font-semibold text-slate-400">Target Customer Sites:</span>
              {job.travel.destinations.map((dest) => (
                <span
                  key={dest}
                  className="rounded bg-indigo-950/90 border border-indigo-800/70 px-2 py-0.5 font-medium"
                >
                  {dest}
                </span>
              ))}
            </div>
          )}

          {/* Skills Tags */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {job.skills.map((skill) => (
              <span
                key={skill}
                className="rounded-md border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs text-slate-300"
              >
                {skill}
              </span>
            ))}
          </div>

          {/* Transparent Match Reasons Section */}
          {job.match?.reasons && job.match.reasons.length > 0 && (
            <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/70 p-3.5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                  <span>🎯 PROFILE MATCH CRITERIA</span>
                  <span className="text-slate-500 font-normal">
                    (Rule-based transparent evaluation)
                  </span>
                </span>
                {job.match.reasons.length > 4 && (
                  <button
                    onClick={() => setShowAllReasons(!showAllReasons)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {showAllReasons ? "Show fewer" : `+${job.match.reasons.length - 4} more`}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-300">
                {(showAllReasons ? job.match.reasons : job.match.reasons.slice(0, 4)).map(
                  (reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{reason.replace(/^✓\s*/, "")}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Deduplication: Multiple Sources Section */}
          {job.otherSources && job.otherSources.length > 1 && (
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-400">
              <span className="font-semibold text-slate-500">Also discovered on:</span>
              {job.otherSources
                .filter((s) => s.source !== job.source)
                .map((src, idx) => (
                  <a
                    key={idx}
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-cyan-300 hover:text-white hover:bg-slate-700 transition"
                  >
                    🔗 {src.source}
                  </a>
                ))}
            </div>
          )}

          {/* Dates & Sourcing Footnote */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
            <span>
              Discovered: {new Date(job.discoveredAt).toLocaleDateString()}
            </span>
            {job.postedAt && (
              <>
                <span>•</span>
                <span>
                  Posted: {new Date(job.postedAt).toLocaleDateString()}
                </span>
              </>
            )}
            {job.appliedAt && (
              <>
                <span>•</span>
                <span className="text-indigo-400 font-medium">
                  Applied on: {new Date(job.appliedAt).toLocaleDateString()}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Actions Button Panel */}
        <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 lg:w-44 pt-2 lg:pt-0 shrink-0">
          {/* Save Action */}
          <button
            onClick={() => onSave?.(job)}
            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
              job.status === "SAVED"
                ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            {job.status === "SAVED" ? "★ Saved in Radar" : "☆ Save Job"}
          </button>

          {/* Apply / Open Job */}
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onApply?.(job)}
            className="w-full text-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
          >
            🚀 Apply / Open
          </a>

          {/* Mark Applied Quick Action */}
          {job.status !== "APPLIED" && (
            <button
              onClick={() => onStatusChange?.(job, "APPLIED")}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-[11px] text-slate-400 hover:text-indigo-300 hover:border-indigo-800 transition"
            >
              Mark as Applied
            </button>
          )}

          {/* Ignore Action */}
          {job.status !== "IGNORED" ? (
            <button
              onClick={() => onIgnore?.(job)}
              className="w-full rounded-xl border border-transparent px-3 py-1 text-[11px] text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition"
            >
              ✕ Ignore
            </button>
          ) : (
            <button
              onClick={() => onStatusChange?.(job, "DISCOVERED")}
              className="w-full rounded-xl border border-slate-800 px-3 py-1 text-[11px] text-slate-500 hover:text-slate-300 transition"
            >
              ↺ Unignore
            </button>
          )}
        </div>
      </div>
    </article>
  );
}