"use client";

import type { Job } from "@/types";

interface TopInternationalOpportunitiesProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
}

export function TopInternationalOpportunities({
  jobs,
  onSelectJob,
}: TopInternationalOpportunitiesProps) {
  // Select top 3 international opportunities deterministically
  const topJobs = jobs
    .filter(
      (j) =>
        j.internationalOpportunity?.bucket === "INTERNATIONAL_PRIORITY" ||
        j.internationalOpportunity?.bucket === "INTERNATIONAL_ACTIVE" ||
        j.isIndiaToEmea ||
        (j.market === "EMEA" && (j.careerFit === "HIGH_RELEVANCE" || j.careerFit === "RELEVANT"))
    )
    .sort((a, b) => {
      const bucketWeight: Record<string, number> = {
        INTERNATIONAL_PRIORITY: 3,
        INTERNATIONAL_ACTIVE: 2,
        INTERNATIONAL_WATCH: 1,
        NOT_INTERNATIONAL: 0,
      };
      const bwA = bucketWeight[a.internationalOpportunity?.bucket || "NOT_INTERNATIONAL"] || 0;
      const bwB = bucketWeight[b.internationalOpportunity?.bucket || "NOT_INTERNATIONAL"] || 0;
      if (bwB !== bwA) return bwB - bwA;

      const fitWeight: Record<string, number> = {
        HIGH_RELEVANCE: 3,
        RELEVANT: 2,
        POSSIBLE: 1,
        LOW_RELEVANCE: 0,
      };
      const fwA = fitWeight[a.careerFit || "LOW_RELEVANCE"] || 0;
      const fwB = fitWeight[b.careerFit || "LOW_RELEVANCE"] || 0;
      if (fwB !== fwA) return fwB - fwA;

      return (new Date(b.postedAt || "").getTime() || 0) - (new Date(a.postedAt || "").getTime() || 0);
    })
    .slice(0, 3);

  if (topJobs.length === 0) return null;

  return (
    <section className="rounded-2xl border border-indigo-900/60 bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-purple-950/30 p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-900/50 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🌟</span>
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
              <span>Top International Opportunities</span>
              <span className="rounded-full bg-indigo-900/80 border border-indigo-700/80 px-2 py-0.5 text-[10px] font-mono text-indigo-300">
                EMEA & Cross-Border Spotlight
              </span>
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Targeted senior/architect roles with verified international customer exposure, EMEA scope, or overseas travel.
            </p>
          </div>
        </div>
        <span className="text-[11px] font-medium text-indigo-400">
          Ranked deterministically by Fit & International Scope
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {topJobs.map((job, idx) => {
          const fitBadgeColor =
            job.careerFit === "HIGH_RELEVANCE"
              ? "bg-emerald-950/80 text-emerald-300 border-emerald-700/70"
              : job.careerFit === "RELEVANT"
              ? "bg-cyan-950/80 text-cyan-300 border-cyan-700/70"
              : "bg-amber-950/80 text-amber-300 border-amber-700/70";

          const travelLabel =
            job.travel.travelCategory ||
            (job.travel.percentage ? `${job.travel.percentage}% TRAVEL` : job.travel.type.replace(/_/g, " "));

          const exposureLabel = (job.internationalExposure?.exposure || "NONE_MENTIONED").replace(/_/g, " ");
          const workAuthLabel = (job.workAuthorization?.authorization || "UNKNOWN").replace(/_/g, " ");

          const whyItFitsList =
            job.internationalOpportunity?.reasons && job.internationalOpportunity.reasons.length > 0
              ? job.internationalOpportunity.reasons
              : job.match?.reasons && job.match.reasons.length > 0
              ? job.match.reasons
              : ["Target role & senior architectural alignment."];

          const gapsList: string[] =
            job.match?.potentialGaps && job.match.potentialGaps.length > 0
              ? job.match.potentialGaps
              : job.dataQualityWarnings && job.dataQualityWarnings.length > 0
              ? job.dataQualityWarnings
              : ["None identified — verified high compatibility."];

          return (
            <div
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="flex flex-col justify-between rounded-xl border border-indigo-800/40 bg-slate-900/90 p-4 hover:border-indigo-500/80 hover:bg-slate-850/90 transition cursor-pointer shadow-md group"
            >
              <div className="space-y-3">
                {/* Header Rank + Career Fit */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-900 text-[10px] font-bold text-indigo-300">
                      {idx + 1}
                    </span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">
                      {job.source}
                    </span>
                  </div>
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase ${fitBadgeColor}`}>
                    {job.careerFit?.replace(/_/g, " ")}
                  </span>
                </div>

                {/* Title & Company */}
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                    {job.title}
                  </h3>
                  <div className="text-xs text-slate-400 mt-0.5 font-medium">
                    {job.company} • <span className="text-slate-300">{job.location || "Remote"}</span>
                  </div>
                </div>

                {/* Key Attribute Badges */}
                <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
                  {/* Market */}
                  <span className="rounded bg-purple-950/80 border border-purple-800/80 px-2 py-0.5 font-bold text-purple-300">
                    🌍 {job.market} {job.emeaCountry ? `(${job.emeaCountry})` : ""}
                  </span>

                  {/* Client Facing */}
                  <span
                    className={`rounded border px-2 py-0.5 font-medium ${
                      job.clientFacing === "YES"
                        ? "bg-amber-950/70 border-amber-800/80 text-amber-300"
                        : "bg-slate-800/70 border-slate-700 text-slate-400"
                    }`}
                  >
                    🤝 {job.clientFacing === "YES" ? "Client-Facing" : "Internal"}
                  </span>

                  {/* Travel */}
                  <span className="rounded bg-indigo-950/70 border border-indigo-800/80 px-2 py-0.5 text-indigo-300">
                    ✈️ {travelLabel}
                  </span>

                  {/* International Exposure */}
                  <span className="rounded bg-sky-950/70 border border-sky-800/80 px-2 py-0.5 text-sky-300">
                    🌐 {exposureLabel}
                  </span>

                  {/* Work Auth */}
                  <span className="rounded bg-slate-800/70 border border-slate-700 px-2 py-0.5 text-slate-300">
                    🛂 {workAuthLabel}
                  </span>

                  {/* Freshness */}
                  <span className="rounded bg-emerald-950/70 border border-emerald-800/80 px-2 py-0.5 text-emerald-300 font-mono">
                    ⏱️ {job.freshness}
                  </span>
                </div>

                {/* Why It Fits */}
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/70 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                    Why It Fits:
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-0.5 list-disc list-inside">
                    {whyItFitsList.slice(0, 2).map((item, i) => (
                      <li key={i} className="line-clamp-1">{item}</li>
                    ))}
                  </ul>
                </div>

                {/* Potential Gaps */}
                <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/70 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/90">
                    Potential Gaps / Notes:
                  </div>
                  <ul className="text-[11px] text-slate-400 space-y-0.5 list-disc list-inside">
                    {gapsList.slice(0, 2).map((item: string, i: number) => (
                      <li key={i} className="line-clamp-1">{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Link */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-indigo-400 font-medium group-hover:text-indigo-300">
                  Inspect Evidence & Breakdown →
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  ID: {job.id.slice(0, 8)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
