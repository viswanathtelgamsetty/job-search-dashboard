"use client";

import type { Job } from "@/types";
import { useState } from "react";
import { formatRoleFamily } from "@/lib/roleClassifier";
import { formatSeniorityLevel } from "@/lib/seniorityDetector";
import { formatDomainName } from "@/lib/domainMatcher";
import { getDataQualityNotices } from "@/lib/marketRadar";

interface JobCardProps {
  job: Job;
  onSelect?: (job: Job) => void;
  onSave?: (job: Job) => void;
  onApply?: (job: Job) => void;
  onIgnore?: (job: Job) => void;
  onStatusChange?: (job: Job, status: Job["status"]) => void;
}

export function JobCard({
  job,
  onSelect,
  onSave,
  onApply,
  onIgnore,
  onStatusChange,
}: JobCardProps) {
  const [showAllReasons, setShowAllReasons] = useState(false);

  // Relevance styling
  const bucket = job.careerFit || job.match?.relevanceBucket || "POSSIBLE";
  const relevanceConfig = {
    HIGH_RELEVANCE: {
      label: "🌟 CAREER FIT: HIGH RELEVANCE",
      style: "bg-emerald-500/15 text-emerald-300 border-emerald-500/40 font-bold",
    },
    RELEVANT: {
      label: "✨ CAREER FIT: RELEVANT",
      style: "bg-cyan-500/15 text-cyan-300 border-cyan-500/40 font-semibold",
    },
    POSSIBLE: {
      label: "🔍 CAREER FIT: POSSIBLE",
      style: "bg-amber-500/15 text-amber-300 border-amber-500/40",
    },
    LOW_RELEVANCE: {
      label: "CAREER FIT: LOW RELEVANCE",
      style: "bg-slate-800/80 text-slate-400 border-slate-700",
    },
  }[bucket];

  // Salary presentation with clear distinction between confirmed and estimated conversion
  let salaryDisplay = "Salary Undisclosed";
  if (job.salaryState === "SALARY_CONFIRMED" || job.salaryState === "SALARY_RANGE") {
    if (job.salaryLpaMax && job.salaryLpaMax !== job.salaryLpaMin) {
      salaryDisplay = `₹${job.salaryLpaMin}L – ₹${job.salaryLpaMax}L PA`;
    } else if (job.salaryLpaMin) {
      salaryDisplay = `₹${job.salaryLpaMin}L+ PA`;
    }
  } else if (job.salaryState === "SALARY_ESTIMATED") {
    salaryDisplay = `${job.originalSalary || `$${Math.round((job.salaryMin || 0) / 1000)}k`} (Est: ~₹${job.salaryLpaMin}L PA)`;
  }

  // Freshness badge config
  const freshnessStatus = job.freshness || "UNKNOWN";
  const freshnessConfig = {
    FRESH: {
      badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold",
      dot: "bg-emerald-400",
      text: "FRESH",
    },
    RECENT: {
      badge: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold",
      dot: "bg-amber-400",
      text: "RECENT",
    },
    OLDER: {
      badge: "bg-slate-800/80 text-slate-400 border-slate-700",
      dot: "bg-slate-500",
      text: "OLDER",
    },
    UNKNOWN: {
      badge: "bg-slate-800/60 text-slate-500 border-slate-700/60",
      dot: "bg-slate-600",
      text: "UNKNOWN",
    },
  }[freshnessStatus];

  const freshnessAgeLabel =
    job.postedDaysAgo !== undefined
      ? job.postedDaysAgo === 0
        ? "Today"
        : `${job.postedDaysAgo}d ago`
      : job.postedAt
      ? new Date(job.postedAt).toLocaleDateString()
      : "Undated";

  // Data quality notices
  const qualityNotices = getDataQualityNotices(job);

  return (
    <article
      className={`rounded-2xl border transition-all duration-200 p-6 ${
        job.status === "SAVED"
          ? "border-cyan-500/40 bg-slate-900/90 shadow-lg shadow-cyan-950/20"
          : job.status === "APPLIED"
          ? "border-indigo-500/40 bg-slate-900/90"
          : job.status === "IGNORED"
          ? "border-slate-850 bg-slate-950/60 opacity-60 hover:opacity-100"
          : bucket === "HIGH_RELEVANCE"
          ? "border-emerald-500/30 bg-slate-900/80 hover:border-emerald-500/50"
          : "border-slate-800 bg-slate-900/70 hover:border-slate-700"
      }`}
    >
      {/* Top Banner Row: Demo Data & Data Quality Warnings */}
      <div className="flex flex-wrap items-center gap-2 mb-3.5">
        {job.isDemo && (
          <div className="inline-flex items-center gap-2 rounded-md bg-amber-500/15 border border-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-300">
            <span>⚠️ DEMO DATA</span>
            <span className="text-amber-400/80 font-normal">
              — Sample Verification Listing (Not a current live vacancy)
            </span>
          </div>
        )}

        {/* Data Quality Warning Badges */}
        {qualityNotices.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            {qualityNotices.map((notice, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 text-[10px] font-medium text-amber-300"
              >
                <span>⚠️ {notice}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        {/* Main Content */}
        <div className="flex-1 space-y-3.5">
          {/* Header Row: Title, Relevance Badge, Live Status, Freshness */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg font-bold text-white tracking-tight hover:text-cyan-400 transition-colors">
                <button
                  onClick={() => onSelect?.(job)}
                  className="text-left hover:text-cyan-400 font-bold"
                >
                  {job.title}
                </button>
              </h3>

              {/* Deterministic Career Fit Badge */}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-xs border ${relevanceConfig.style}`}
              >
                {relevanceConfig.label}
              </span>

              {/* Freshness Badge (Prominent) */}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] border ${freshnessConfig.badge}`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${freshnessConfig.dot}`} />
                <span>{freshnessConfig.text}</span>
                <span className="opacity-80 text-[10px]">({freshnessAgeLabel})</span>
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

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-slate-300 font-medium">
              <span className="text-white font-semibold">{job.company}</span>
              <span className="text-slate-600">•</span>
              <span className="rounded bg-indigo-950/60 border border-indigo-800/60 px-2 py-0.5 text-xs text-indigo-300 font-semibold">
                {formatRoleFamily(job.roleFamily)}
              </span>
              <span className="text-slate-600">•</span>
              <span className="rounded bg-slate-800/80 border border-slate-700/60 px-2 py-0.5 text-xs text-cyan-300">
                {formatSeniorityLevel(job.seniority)}
              </span>
              <span className="text-slate-600">•</span>
              <span className="rounded bg-slate-800/80 px-2 py-0.5 text-xs text-slate-400">
                Source: {job.source}
              </span>
            </div>

            {/* Primary Domains Badges */}
            {job.domains && job.domains.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400 mr-0.5">Primary Domains:</span>
                {job.domains.map((d) => (
                  <span
                    key={d}
                    className="rounded-md bg-indigo-950/60 border border-indigo-700/60 px-2 py-0.5 text-[11px] font-medium text-indigo-200"
                  >
                    🏷️ {formatDomainName(d)}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Quick Metrics Bar: Location, Remote, Salary, Travel, Freshness */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Location & India Eligibility */}
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium border ${
                job.normalizedLocation === "HYDERABAD"
                  ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/70 font-semibold"
                  : job.isIndiaEligible
                  ? "bg-slate-800/80 text-slate-200 border-slate-700"
                  : "bg-rose-950/60 text-rose-300 border-rose-800/50"
              }`}
            >
              📍 {job.location}
              {job.isIndiaEligible && <span className="ml-1 text-[10px] text-emerald-400 font-bold">(India Eligible)</span>}
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

            {/* Compensation & State */}
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 font-medium border ${
                job.salaryState === "SALARY_CONFIRMED" || job.salaryState === "SALARY_RANGE"
                  ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/60"
                  : job.salaryState === "SALARY_ESTIMATED"
                  ? "bg-indigo-950/60 text-indigo-300 border-indigo-800/60"
                  : "bg-slate-800/50 text-slate-400 border-slate-700/50"
              }`}
            >
              💰 {salaryDisplay}
              {job.salaryState === "SALARY_ESTIMATED" && (
                <span className="text-[10px] text-indigo-400 font-normal ml-0.5">(Est)</span>
              )}
            </span>

            {/* Experience */}
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800/70 border border-slate-700/60 px-2.5 py-1 text-slate-300">
              ⏳ {job.experienceMin ? `${job.experienceMin}+ yrs exp` : "12+ yrs level"}
            </span>

            {/* Travel Requirement Badge (High Visibility) */}
            <span
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-medium border ${
                job.travel.type === "INTERNATIONAL_TRAVEL"
                  ? "bg-indigo-950/90 text-indigo-200 border-indigo-700/80 font-bold shadow-sm"
                  : job.travel.type === "CLIENT_SITE_TRAVEL"
                  ? "bg-cyan-950/80 text-cyan-200 border-cyan-700/80 font-bold shadow-sm"
                  : job.travel.type === "INTERNATIONAL_TEAM_ONLY"
                  ? "bg-sky-950/70 text-sky-300 border-sky-800/60"
                  : job.travel.type === "RELOCATION"
                  ? "bg-rose-950/70 text-rose-300 border-rose-800/60 font-semibold"
                  : job.travel.type === "REMOTE_GLOBAL"
                  ? "bg-emerald-950/70 text-emerald-300 border-emerald-800/60"
                  : "bg-slate-900 text-slate-400 border-slate-800"
              }`}
            >
              {job.travel.type === "INTERNATIONAL_TRAVEL" && "✈️ International Travel"}
              {job.travel.type === "CLIENT_SITE_TRAVEL" && "🏢 Client-Site Travel"}
              {job.travel.type === "INTERNATIONAL_TEAM_ONLY" && "🌐 International Team Only"}
              {job.travel.type === "RELOCATION" && "📦 Relocation Required"}
              {job.travel.type === "REMOTE_GLOBAL" && "🌍 Remote Global"}
              {job.travel.type === "NO_TRAVEL_MENTIONED" && "📄 No Travel Mentioned"}
              {job.travel.type === "UNKNOWN" && "❓ Travel Unknown"}
              {job.travel.percentage ? ` (${job.travel.percentage}%)` : ""}
            </span>
          </div>

          {/* Travel Evidence Quote */}
          {job.travel.evidence && job.travel.type !== "NO_TRAVEL_MENTIONED" && (
            <div className="rounded-lg bg-indigo-950/40 border border-indigo-900/60 px-3 py-1.5 text-xs text-indigo-200">
              <span className="font-semibold text-indigo-400 mr-1.5">Travel Evidence:</span>
              <span className="italic">&ldquo;{job.travel.evidence}&rdquo;</span>
            </div>
          )}

          {/* Extracted Actual Job Technologies with target fit indicator */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-400 mr-0.5">Matched Tech:</span>
            {job.skills.map((skill) => {
              const isMatched = job.matchedTargetTechnologies?.includes(skill);
              return (
                <span
                  key={skill}
                  className={`rounded-md border px-2.5 py-1 text-xs ${
                    isMatched
                      ? "border-emerald-500/40 bg-emerald-950/40 text-emerald-300 font-medium"
                      : "border-slate-800 bg-slate-950/80 text-slate-400"
                  }`}
                >
                  {isMatched ? `✓ ${skill}` : skill}
                </span>
              );
            })}
          </div>

          {/* WHY THIS FITS (Career Fit Evidence) */}
          {((job.match?.whyThisFits && job.match.whyThisFits.length > 0) || (job.match?.reasons && job.match.reasons.length > 0)) && (
            <div className="mt-3 rounded-xl border border-slate-800/80 bg-slate-950/80 p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <span>✓ WHY THIS FITS</span>
                  <span className="text-slate-500 font-normal">
                    (Evidence-Based Career Fit)
                  </span>
                </span>
                {(job.match.whyThisFits || job.match.reasons).length > 3 && (
                  <button
                    onClick={() => setShowAllReasons(!showAllReasons)}
                    className="text-[11px] text-cyan-400 hover:underline"
                  >
                    {showAllReasons ? "Show fewer" : `+${(job.match.whyThisFits || job.match.reasons).length - 3} more`}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-200">
                {(showAllReasons ? (job.match.whyThisFits || job.match.reasons) : (job.match.whyThisFits || job.match.reasons).slice(0, 3)).map(
                  (reason, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 font-medium text-[11px]">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{reason.replace(/^✓\s*/, "")}</span>
                    </div>
                  )
                )}
              </div>

              {/* POTENTIAL GAPS */}
              {((job.match?.potentialGaps && job.match.potentialGaps.length > 0) || (job.match?.cautions && job.match.cautions.length > 0)) && (
                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                    ⚠️ POTENTIAL GAPS
                  </span>
                  {(job.match.potentialGaps || job.match.cautions).map((caution, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-[11px] text-amber-300/90 font-medium">
                      <span className="text-amber-400 font-bold">!</span>
                      <span>{caution.replace(/^!\s*/, "")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Deduplication Reference */}
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
        </div>

        {/* Actions Button Panel */}
        <div className="flex flex-row lg:flex-col items-center lg:items-stretch gap-2 lg:w-44 pt-2 lg:pt-0 shrink-0">
          {/* Inspect Radar Details Button */}
          <button
            onClick={() => onSelect?.(job)}
            className="w-full rounded-xl border border-cyan-500/50 bg-cyan-950/40 px-3.5 py-2 text-xs font-semibold text-cyan-300 hover:bg-cyan-900/50 hover:text-white transition"
          >
            🔍 Details & Evidence
          </button>

          {/* Save Action */}
          <button
            onClick={() => onSave?.(job)}
            className={`w-full rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
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
            className="w-full text-center rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
          >
            🚀 Apply / Open
          </a>

          {/* Mark as Applied */}
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