"use client";

import { useEffect } from "react";
import type { Job } from "@/types";
import { formatRoleFamily } from "@/lib/roleClassifier";
import { formatSeniorityLevel } from "@/lib/seniorityDetector";
import { formatDomainName } from "@/lib/domainMatcher";
import { getDataQualityNotices, getOpportunityPriority, getOpportunityPriorityReasons } from "@/lib/marketRadar";

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  onSave?: (job: Job) => void;
  onApply?: (job: Job) => void;
}

export function JobDetailModal({
  job,
  onClose,
  onSave,
  onApply,
}: JobDetailModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }
    if (job) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [job, onClose]);

  if (!job) return null;

  const qualityNotices = getDataQualityNotices(job);
  const fit = job.careerFit || job.match?.relevanceBucket || "POSSIBLE";
  const priority = getOpportunityPriority(job);
  const priorityReasons = getOpportunityPriorityReasons(fit, job.freshness);

  const priorityBadge = {
    PRIORITY: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-black ring-1 ring-emerald-500/40",
    ACTIVE: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold",
    WATCH: "bg-amber-500/20 text-amber-300 border-amber-500/50 font-semibold",
    LOW: "bg-slate-800 text-slate-400 border-slate-700",
  }[priority];

  const fitBadge = {
    HIGH_RELEVANCE: {
      label: "HIGH RELEVANCE FIT",
      style: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-bold",
    },
    RELEVANT: {
      label: "RELEVANT FIT",
      style: "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-semibold",
    },
    POSSIBLE: {
      label: "POSSIBLE FIT",
      style: "bg-amber-500/20 text-amber-300 border-amber-500/50 font-medium",
    },
    LOW_RELEVANCE: {
      label: "LOW RELEVANCE",
      style: "bg-slate-800 text-slate-400 border-slate-700",
    },
  }[fit];

  const travelLabel = {
    INTERNATIONAL_TRAVEL: "✈️ International Travel",
    CLIENT_SITE_TRAVEL: "🏢 Client-Site Travel",
    INTERNATIONAL_TEAM_ONLY: "🌐 International Team Only",
    REMOTE_GLOBAL: "🌍 Remote Global",
    RELOCATION: "📦 Relocation Required",
    NO_TRAVEL_MENTIONED: "📄 No Travel Mentioned",
    UNKNOWN: "❓ Travel Unknown",
  }[job.travel.type];

  const freshnessBadge = {
    FRESH: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold",
    RECENT: "bg-amber-500/20 text-amber-300 border-amber-500/40 font-semibold",
    OLDER: "bg-slate-800 text-slate-400 border-slate-700",
    UNKNOWN: "bg-slate-800 text-slate-500 border-slate-700",
  }[job.freshness || "UNKNOWN"];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="radar-job-detail-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* Click outside backdrop */}
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative z-10 w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6 border-b border-slate-800 bg-slate-950/70">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] border ${priorityBadge}`}>
                🎯 OPPORTUNITY: {priority}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] border ${fitBadge.style}`}>
                {fitBadge.label}
              </span>
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] border ${freshnessBadge}`}>
                🕒 FRESHNESS: {job.freshness}
                {job.postedDaysAgo !== undefined && ` (${job.postedDaysAgo === 0 ? "today" : `${job.postedDaysAgo}d ago`})`}
              </span>
              <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                Source: {job.source}
              </span>
            </div>

            <h2 id="radar-job-detail-title" className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {job.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span className="font-semibold text-white">{job.company}</span>
              <span className="text-slate-600">•</span>
              <span className="text-cyan-400 font-medium">📍 {job.location}</span>
              {job.isIndiaEligible && (
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.2 rounded">
                  India Eligible
                </span>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-xl border border-slate-700 bg-slate-800 p-2 text-slate-400 hover:text-white hover:bg-slate-700 transition"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Data Quality Notice Banner */}
          {qualityNotices.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3.5 space-y-1.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <span>⚠️ Data Quality Notice</span>
                <span className="text-amber-400/70 font-normal">
                  (Incomplete posting data detected from provider feed)
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {qualityNotices.map((q, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded bg-amber-950/60 border border-amber-700/60 px-2 py-0.5 text-[11px] text-amber-200"
                  >
                    • {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Opportunity Action Banner */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                <span>🎯 Action Status:</span>
              </span>
              <span className="rounded bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 text-xs font-bold text-cyan-300 font-mono">
                {priority}
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium">{priorityReasons.join(" • ")}</span>
            </div>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Priority = High/Relevant fit + Fresh/Recent posting
            </span>
          </div>

          {/* Quick Specifications Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Role Family</div>
              <div className="text-xs font-semibold text-white">{formatRoleFamily(job.roleFamily)}</div>
              <div className="text-[10px] text-cyan-400">{formatSeniorityLevel(job.seniority)}</div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Travel Requirement</div>
              <div className="text-xs font-semibold text-indigo-300">
                {travelLabel}
                {job.travel.percentage ? ` (${job.travel.percentage}%)` : ""}
              </div>
              {job.travel.percentageRange && (
                <div className="text-[10px] text-slate-400">Range: {job.travel.percentageRange}</div>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Work Model</div>
              <div className="text-xs font-semibold text-white">🌐 {job.remoteType}</div>
              <div className="text-[10px] text-slate-400">
                {job.normalizedLocation.replace(/_/g, " ")}
              </div>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Compensation</div>
              <div className="text-xs font-semibold text-emerald-300">
                {job.salaryDisclosed && job.salaryLpaMin
                  ? `₹${job.salaryLpaMin}L${job.salaryLpaMax ? ` - ₹${job.salaryLpaMax}L` : "+"} PA`
                  : job.salaryState === "SALARY_ESTIMATED"
                  ? `${job.originalSalary || `$${Math.round((job.salaryMin || 0) / 1000)}k`} (Est)`
                  : "Not Disclosed"}
              </div>
              <div className="text-[10px] text-slate-400">
                {job.salaryState.replace(/_/g, " ")}
              </div>
            </div>
          </div>

          {/* Travel Evidence Quote if available */}
          {job.travel.evidence && (
            <div className="rounded-xl border border-indigo-800/50 bg-indigo-950/30 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-indigo-300 uppercase text-[10px] tracking-wider">
                ✈️ Travel Evidence in Job Posting
              </div>
              <p className="italic text-indigo-200 text-xs">
                &ldquo;{job.travel.evidence}&rdquo;
              </p>
            </div>
          )}

          {/* India Eligibility Explanation */}
          {job.indiaEligibilityReason && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1 text-xs">
              <div className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                🇮🇳 Location & India Eligibility Signal
              </div>
              <p className="text-slate-300 text-xs">
                {job.indiaEligibilityReason}
              </p>
            </div>
          )}

          {/* Primary & Secondary Domains */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Career Domains
            </div>
            <div className="flex flex-wrap gap-2">
              {job.domains && job.domains.length > 0 ? (
                job.domains.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded-md bg-indigo-950/70 border border-indigo-700/60 px-2.5 py-1 text-xs font-semibold text-indigo-200"
                  >
                    🏷️ Primary: {formatDomainName(d)}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No primary domains detected</span>
              )}

              {job.secondaryEvidenceDomains && job.secondaryEvidenceDomains.length > 0 && (
                job.secondaryEvidenceDomains.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 rounded-md bg-slate-800/70 border border-slate-700 px-2.5 py-1 text-xs text-slate-400"
                  >
                    🏷️ Secondary: {formatDomainName(d)}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Technologies Breakdown */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Extracted Technologies (Evidence-Based)
            </div>
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map((skill) => {
                const isMatched = job.matchedTargetTechnologies?.includes(skill);
                return (
                  <span
                    key={skill}
                    className={`rounded-md border px-2.5 py-1 text-xs ${
                      isMatched
                        ? "border-emerald-500/50 bg-emerald-950/60 text-emerald-300 font-bold"
                        : "border-slate-800 bg-slate-900 text-slate-300"
                    }`}
                  >
                    {isMatched ? `✓ ${skill} (Target Fit)` : skill}
                  </span>
                );
              })}
            </div>
          </div>

          {/* WHY THIS FITS & POTENTIAL GAPS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Why This Fits */}
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>✓ WHY THIS FITS</span>
                <span className="text-[10px] text-emerald-400/70 font-normal">
                  (Evidence-Based Signals)
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-100">
                {(job.match?.whyThisFits && job.match.whyThisFits.length > 0
                  ? job.match.whyThisFits
                  : job.match?.reasons && job.match.reasons.length > 0
                  ? job.match.reasons
                  : ["Role details match target profile qualifications."]
                ).map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span>{r.replace(/^✓\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Potential Gaps */}
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>⚠️ POTENTIAL GAPS</span>
                <span className="text-[10px] text-amber-400/70 font-normal">
                  (Cautions & Gaps)
                </span>
              </div>
              <ul className="space-y-1.5 text-xs text-amber-100">
                {(job.match?.potentialGaps && job.match.potentialGaps.length > 0
                  ? job.match.potentialGaps
                  : job.match?.cautions && job.match.cautions.length > 0
                  ? job.match.cautions
                  : ["No major disqualifying gaps identified."]
                ).map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-400 font-bold mt-0.5">!</span>
                    <span>{c.replace(/^!\s*/, "")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Dimensional Evidence Matrix */}
          {job.match?.dimensions && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Career Fit Dimensions & Detailed Evidence
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {Object.entries(job.match.dimensions).map(([dimKey, dimVal]) => {
                  if (dimKey === "freshnessFit") return null;
                  const d = dimVal as { matched: boolean; strength: string; reason: string };
                  return (
                    <div
                      key={dimKey}
                      className="flex items-start justify-between gap-2 rounded-lg border border-slate-800/80 bg-slate-900/60 p-2.5"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-300 capitalize text-[11px]">
                          {dimKey.replace(/Fit$/, "")}
                        </span>
                        <p className="text-[11px] text-slate-400">{d.reason}</p>
                      </div>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold shrink-0 ${
                          d.matched
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {d.strength || (d.matched ? "MATCHED" : "NEUTRAL")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full Job Description */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Full Description (Source Posting)
              </span>
              <span className="text-[11px] text-slate-500">Original text from {job.source}</span>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-sans max-h-96 overflow-y-auto rounded-lg bg-slate-900/80 p-3.5 border border-slate-800/60">
              {job.description || "Full job description not provided in feed."}
            </div>
          </div>
        </div>

        {/* Modal Footer with Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-t border-slate-800 bg-slate-950/90">
          <div className="text-xs text-slate-400">
            Discovered: {new Date(job.discoveredAt).toLocaleDateString()} • ID:{" "}
            <span className="font-mono text-slate-500">{job.id.slice(0, 16)}</span>
          </div>

          <div className="flex items-center gap-2.5">
            {onSave && (
              <button
                onClick={() => onSave(job)}
                className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
                  job.status === "SAVED"
                    ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                {job.status === "SAVED" ? "★ Saved in Radar" : "☆ Save Job"}
              </button>
            )}

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onApply?.(job)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              <span>🚀 Open Original Vacancy</span>
              <span>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
