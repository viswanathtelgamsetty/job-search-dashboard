"use client";

import { useEffect } from "react";
import type { Application, Job } from "@/types";
import { formatRoleFamily } from "@/lib/roleClassifier";
import { formatSeniorityLevel } from "@/lib/seniorityDetector";
import { formatDomainName } from "@/lib/domainMatcher";
import { getDataQualityNotices, getOpportunityPriority, getOpportunityPriorityReasons } from "@/lib/marketRadar";

interface JobDetailModalProps {
  job: Job | null;
  application?: Application;
  onClose: () => void;
  onSave?: (job: Job) => void;
  onApply?: (job: Job) => void;
}

export function JobDetailModal({
  job,
  application,
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

  const travelLabels: Record<string, string> = {
    INTERNATIONAL_TRAVEL: "✈️ International Travel",
    CLIENT_SITE_TRAVEL: "🏢 Client-Site Travel",
    INTERNATIONAL_TEAM_ONLY: "🌐 International Team Only",
    REMOTE_GLOBAL: "🌍 Remote Global",
    RELOCATION: "📦 Relocation Required",
    OCCASIONAL_TRAVEL: "🚗 Occasional Travel",
    TRAVEL_10_20: "✈️ 10-20% Travel",
    TRAVEL_20_30: "✈️ 20-30% Travel",
    TRAVEL_30_PLUS: "✈️ 30%+ Travel",
    NO_TRAVEL_MENTIONED: "📄 No Travel Mentioned",
    TRAVEL_UNKNOWN: "❓ Travel Unknown",
    UNKNOWN: "❓ Travel Unknown",
  };
  const travelLabel = travelLabels[job.travel.type] || job.travel.type;

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
              <span
                title={priorityReasons.join(" • ")}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-0.5 text-[11px] border ${priorityBadge}`}
              >
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

              {/* Application Status Badge */}
              {application ? (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border uppercase ${
                    application.status === "SAVED"
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                      : application.status === "APPLIED"
                      ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                      : application.status === "SCREENING"
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      : application.status === "TECHNICAL"
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                      : application.status === "FINAL"
                      ? "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : application.status === "OFFER"
                      ? "bg-emerald-500/25 text-emerald-300 border-emerald-500/50"
                      : application.status === "REJECTED"
                      ? "bg-red-500/20 text-red-300 border-red-500/30"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  {application.status}
                </span>
              ) : job.status !== "DISCOVERED" ? (
                <span className="rounded-full bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-[11px] font-medium text-slate-300">
                  {job.status}
                </span>
              ) : null}
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
          {/* Section 11: Data Quality Notices / Warnings */}
          {qualityNotices.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center justify-between">
                <span>⚠️ Section 11: Data Quality & Completeness Audit</span>
                <span className="text-[10px] text-amber-400/80 font-normal">
                  ({qualityNotices.length} notice{qualityNotices.length > 1 ? "s" : ""})
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {qualityNotices.map((q, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded bg-amber-950/70 border border-amber-700/60 px-2.5 py-1 text-xs text-amber-200"
                  >
                    • {q}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Career Fit Overview */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                1. Career Fit & Seniority Classification
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${fitBadge.style}`}>
                {fitBadge.label}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Role Family:</span>
                <p className="font-semibold text-white">{formatRoleFamily(job.roleFamily)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Detected Seniority:</span>
                <p className="font-semibold text-cyan-300">{formatSeniorityLevel(job.seniority)}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Experience Target:</span>
                <p className="font-semibold text-white">{job.experienceMin ? `${job.experienceMin}+ yrs` : "12+ yrs level"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Opportunity Action:</span>
                <p className="font-semibold text-emerald-300">{priority}</p>
              </div>
            </div>
            {job.seniorityEvidence && (
              <p className="text-[11px] text-slate-400 italic">
                Seniority Evidence: &ldquo;{job.seniorityEvidence}&rdquo;
              </p>
            )}
          </div>

          {/* Section 2: Market & Location */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                2. Market & Regional Geography
              </span>
              <span className="rounded bg-purple-950/80 border border-purple-700/60 px-2.5 py-0.5 text-xs font-bold text-purple-300">
                {job.market || "UNKNOWN"}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Market Region:</span>
                <p className="font-semibold text-white">{job.market?.replace(/_/g, " ") || "Unspecified"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">EMEA Country:</span>
                <p className="font-semibold text-purple-300">{job.emeaCountry?.replace(/_/g, " ") || "N/A"}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Location Spec:</span>
                <p className="font-semibold text-white">{job.location}</p>
              </div>
            </div>
            {job.indiaEligibilityReason && (
              <p className="text-[11px] text-slate-300">
                <span className="font-semibold text-slate-400">India Hiring Eligibility: </span>
                {job.indiaEligibilityReason}
              </p>
            )}
          </div>

          {/* Section 3: International Opportunity Radar */}
          <div className="rounded-xl border border-indigo-900/50 bg-indigo-950/20 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-indigo-900/60 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                3. International Opportunity Radar & Dimensions
              </span>
              <span className="rounded bg-indigo-950/80 border border-indigo-700/60 px-2.5 py-0.5 text-xs font-bold text-indigo-200">
                {job.internationalOpportunity?.bucket || "NOT_INTERNATIONAL"}
                {job.internationalOpportunity?.score ? ` (${job.internationalOpportunity.score}/100)` : ""}
              </span>
            </div>

            {/* India to EMEA Scope Highlight */}
            {job.isIndiaToEmea && (
              <div className="rounded-lg bg-fuchsia-950/60 border border-fuchsia-700/60 p-3 text-xs space-y-1">
                <div className="font-bold text-fuchsia-300 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                  <span>🌍 India → EMEA Opportunity Scope</span>
                </div>
                <p className="text-fuchsia-200 text-xs">
                  {job.isIndiaToEmeaReason || "India-based position engaging EMEA customers or European client travel."}
                </p>
              </div>
            )}

            {/* Opportunity Types */}
            <div className="space-y-1 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">Opportunity Classification:</span>
              <div className="flex flex-wrap gap-1.5">
                {(job.opportunityTypes && job.opportunityTypes.length > 0
                  ? job.opportunityTypes
                  : job.opportunityType ? [job.opportunityType] : ["UNKNOWN"]
                ).map((t) => (
                  <span
                    key={t}
                    className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-xs text-cyan-300 font-medium"
                  >
                    {t.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            </div>

            {/* International Dimensions Matrix */}
            {job.internationalOpportunity?.dimensions && (
              <div className="space-y-1.5">
                <span className="text-slate-400 text-[11px] font-semibold">Transparent Deterministic Dimensions:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(job.internationalOpportunity.dimensions).map(([k, v]) => (
                    <div
                      key={k}
                      className="rounded border border-slate-800 bg-slate-900/80 p-2 flex items-start justify-between gap-2"
                    >
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-300 capitalize text-[11px]">{k.replace(/([A-Z])/g, " $1")}</span>
                        <p className="text-[10px] text-slate-400">{v.evidence}</p>
                      </div>
                      <span className="font-mono text-cyan-400 font-bold shrink-0">{v.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Section 4: Travel Requirement */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                4. Travel Classification & Percentage Evidence
              </span>
              <span className="rounded bg-indigo-950/80 border border-indigo-700/60 px-2.5 py-0.5 text-xs font-bold text-indigo-200">
                {job.travelType || job.travel.travelCategory || job.travel.type}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Travel Type:</span>
                <p className="font-semibold text-white">{travelLabel}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Travel Percentage:</span>
                <p className="font-semibold text-indigo-300">
                  {job.travel.percentage ? `${job.travel.percentage}%` : job.travel.percentageRange || "Unspecified"}
                </p>
              </div>
              <div className="space-y-0.5">
                <span className="text-slate-400 text-[11px]">Destinations:</span>
                <p className="font-semibold text-white">
                  {job.travel.destinations && job.travel.destinations.length > 0
                    ? job.travel.destinations.join(", ")
                    : "Not specified"}
                </p>
              </div>
            </div>
            {(job.travel.evidence || job.travelEvidence) && (
              <div className="rounded-lg bg-indigo-950/40 border border-indigo-900/60 p-2.5 text-xs">
                <span className="font-semibold text-indigo-400 text-[11px] block">Verified Travel Evidence:</span>
                <p className="italic text-indigo-200 mt-0.5">&ldquo;{job.travel.evidence || job.travelEvidence}&rdquo;</p>
              </div>
            )}
          </div>

          {/* Section 5: Client-Facing Classification */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                5. Client-Facing / Consulting Exposure
              </span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${
                job.clientFacing === "YES"
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  : job.clientFacing === "NO"
                  ? "bg-slate-800 text-slate-400 border-slate-700"
                  : "bg-slate-800/60 text-slate-500 border-slate-700"
              }`}>
                CLIENT FACING: {job.clientFacing || "UNKNOWN"}
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <span className="text-slate-400 text-[11px] font-semibold">Evidence:</span>
              <p className="text-slate-200">
                {job.clientFacingDetail?.evidence || "No client-facing or internal-only statement detected in source posting."}
              </p>
            </div>
          </div>

          {/* Section 6: Work Authorization / Location Eligibility */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                6. Work Authorization & Visa Eligibility
              </span>
              <span className="rounded bg-slate-800 border border-slate-700 px-2.5 py-0.5 text-xs font-bold text-cyan-300">
                {job.workAuthorization?.authorization?.replace(/_/g, " ") || "UNKNOWN"}
              </span>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <span className="text-slate-400 text-[11px] font-semibold">Eligibility Statement:</span>
              <p className="text-slate-200">
                {job.workAuthorization?.evidence || "Work authorization requirements not explicitly stated in source posting."}
              </p>
            </div>
          </div>

          {/* Section 7: Technology Evidence */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              7. Verified Target Technologies (Evidence-Based)
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
                    {isMatched ? `✓ ${skill} (Target Tech)` : skill}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Section 8: Domain Evidence */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2.5">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-2">
              8. Career Domains & Evidence Hierarchy
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

          {/* Section 9: Why It Fits & Section 10: Potential Gaps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 9. Why This Fits */}
            <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-4 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <span>✓ 9. WHY THIS FITS</span>
                <span className="text-[10px] text-emerald-400/70 font-normal">
                  (Deterministic Evidence)
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

            {/* 10. Potential Gaps */}
            <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-4 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <span>⚠️ 10. POTENTIAL GAPS</span>
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

          {/* Section 12: Original Source & Full Description */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                12. Original Source & Full Description
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500">Provider: {job.source}</span>
                {job.url && job.url !== "#" && (
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
                  >
                    Open Source URL ↗
                  </a>
                )}
              </div>
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
                  application?.status === "SAVED" || (!application && job.status === "SAVED")
                    ? "border-cyan-500 bg-cyan-500/15 text-cyan-300 font-bold"
                    : "border-slate-700 bg-slate-800 text-slate-300 hover:text-white"
                }`}
              >
                {application?.status === "SAVED" || (!application && job.status === "SAVED")
                  ? "✓ Saved"
                  : "☆ Save Job"}
              </button>
            )}

            <button
              onClick={() => onApply?.(job)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-indigo-500 transition"
            >
              <span>🚀 Apply</span>
              <span>↗</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
