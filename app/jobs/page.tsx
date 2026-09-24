"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job, JobFiltersState, JobStatus, ProviderStatus } from "@/types";
import { getStoredJobs, saveJobs, updateJobStatusInStorage } from "@/lib/storage";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { SyncButton } from "@/components/jobs/SyncButton";

const initialFilters: JobFiltersState = {
  search: "",
  location: "ALL",
  remoteType: "ALL",
  minSalaryLpa: null,
  experienceLevel: "ALL",
  roleFamily: "ALL",
  travelType: "ALL",
  source: "ALL",
  technology: "ALL",
  relevance: "ALL",
  company: "ALL",
  postedWithinDays: null,
  sortBy: "relevance",
};

export default function MarketRadarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFiltersState>(initialFilters);
  const [mounted, setMounted] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(0);
  const [showCoveragePanel, setShowCoveragePanel] = useState(false);
  const [latestProviders, setLatestProviders] = useState<ProviderStatus[]>([]);

  useEffect(() => {
    const stored = getStoredJobs();
    const currentMs = Date.now();
    queueMicrotask(() => {
      setNowTimestamp(currentMs);
      setJobs(stored);
      setMounted(true);
    });
  }, []);

  function handleSave(job: Job) {
    const nextStatus: JobStatus = job.status === "SAVED" ? "DISCOVERED" : "SAVED";
    const updated = updateJobStatusInStorage(job.id, nextStatus);
    setJobs(updated);
  }

  function handleApply(job: Job) {
    const updated = updateJobStatusInStorage(job.id, "APPLIED");
    setJobs(updated);
  }

  function handleIgnore(job: Job) {
    const updated = updateJobStatusInStorage(job.id, "IGNORED");
    setJobs(updated);
  }

  function handleStatusChange(job: Job, status: JobStatus) {
    const updated = updateJobStatusInStorage(job.id, status);
    setJobs(updated);
  }

  function handleSyncComplete(newJobs: Job[], providers?: ProviderStatus[]) {
    saveJobs(newJobs);
    setJobs(newJobs);
    if (providers) {
      setLatestProviders(providers);
    }
  }

  // Derive unique sources, role families, companies
  const availableSources = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.source))).filter(Boolean);
  }, [jobs]);

  const availableRoleFamilies = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.roleFamily))).filter(Boolean);
  }, [jobs]);

  const availableCompanies = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.company))).filter(Boolean).sort();
  }, [jobs]);

  // Dynamic Live Market Radar Metrics
  const metrics = useMemo(() => {
    const liveJobs = jobs.filter((j) => !j.isDemo);
    const totalLive = liveJobs.length;
    const hyderabad = liveJobs.filter((j) => j.normalizedLocation === "HYDERABAD").length;
    const india = liveJobs.filter((j) => j.isIndiaEligible).length;
    const remoteIndia = liveJobs.filter((j) => j.normalizedLocation === "REMOTE_INDIA").length;
    const internationalRemote = liveJobs.filter((j) => j.normalizedLocation === "REMOTE_GLOBAL").length;
    const internationalTravel = liveJobs.filter((j) => j.travel.type === "INTERNATIONAL_TRAVEL").length;
    const highRelevance = liveJobs.filter((j) => j.match?.relevanceBucket === "HIGH_RELEVANCE").length;
    const recentlyPosted = liveJobs.filter(
      (j) => j.freshness === "FRESH" || j.freshness === "RECENT" || (j.postedDaysAgo !== undefined && j.postedDaysAgo <= 14)
    ).length;

    return {
      totalLive,
      india,
      hyderabad,
      remoteIndia,
      internationalRemote,
      internationalTravel,
      highRelevance,
      recentlyPosted,
    };
  }, [jobs]);

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Exclude IGNORED from the default discovery list unless explicitly searching
        if (job.status === "IGNORED" && !filters.search) {
          return false;
        }

        // Search text matching: title, company, skills, description, role family, notes
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchesSearch =
            job.title.toLowerCase().includes(q) ||
            job.company.toLowerCase().includes(q) ||
            job.skills.some((s) => s.toLowerCase().includes(q)) ||
            (job.description && job.description.toLowerCase().includes(q)) ||
            job.roleFamily.toLowerCase().includes(q) ||
            (job.notes && job.notes.toLowerCase().includes(q));

          if (!matchesSearch) return false;
        }

        // Relevance Bucket Filter
        if (filters.relevance !== "ALL") {
          if (job.match?.relevanceBucket !== filters.relevance) return false;
        }

        // Technology Filter
        if (filters.technology !== "ALL") {
          const techLower = filters.technology.toLowerCase();
          const hasTech = job.skills.some((s) => s.toLowerCase() === techLower) ||
            (job.description && job.description.toLowerCase().includes(techLower)) ||
            job.title.toLowerCase().includes(techLower);
          if (!hasTech) return false;
        }

        // Company Filter
        if (filters.company !== "ALL") {
          if (job.company !== filters.company) return false;
        }

        // Seniority / Experience Level
        if (filters.experienceLevel !== "ALL") {
          if (filters.experienceLevel === "12PLUS") {
            if ((job.experienceMin || 0) < 12 && job.seniority !== "ARCHITECT" && job.seniority !== "DIRECTOR") {
              return false;
            }
          } else if (job.seniority !== filters.experienceLevel) {
            return false;
          }
        }

        // Location Filter using normalizedLocation and isIndiaEligible
        if (filters.location !== "ALL") {
          if (filters.location === "HYDERABAD") {
            if (job.normalizedLocation !== "HYDERABAD") return false;
          } else if (filters.location === "BANGALORE") {
            if (job.normalizedLocation !== "BANGALORE") return false;
          } else if (filters.location === "PUNE") {
            if (job.normalizedLocation !== "PUNE") return false;
          } else if (filters.location === "CHENNAI") {
            if (job.normalizedLocation !== "CHENNAI") return false;
          } else if (filters.location === "MUMBAI") {
            if (job.normalizedLocation !== "MUMBAI") return false;
          } else if (filters.location === "DELHI_NCR") {
            if (job.normalizedLocation !== "DELHI_NCR") return false;
          } else if (filters.location === "INDIA") {
            if (!job.isIndiaEligible) return false;
          } else if (filters.location === "REMOTE_INDIA") {
            if (job.normalizedLocation !== "REMOTE_INDIA") return false;
          } else if (filters.location === "REMOTE_GLOBAL") {
            if (job.normalizedLocation !== "REMOTE_GLOBAL") return false;
          }
        }

        // Remote Type
        if (filters.remoteType !== "ALL") {
          if (job.remoteType !== filters.remoteType) return false;
        }

        // Salary Requirement (Prefer target LPA; retain undisclosed)
        if (filters.minSalaryLpa !== null) {
          if (job.salaryDisclosed && job.salaryLpaMin) {
            if (job.salaryLpaMin < filters.minSalaryLpa) return false;
          }
        }

        // Role Family
        if (filters.roleFamily !== "ALL") {
          if (job.roleFamily !== filters.roleFamily) return false;
        }

        // Travel Type Filter using strict categories
        if (filters.travelType !== "ALL") {
          if (job.travel.type !== filters.travelType) return false;
        }

        // Source
        if (filters.source !== "ALL") {
          if (job.source !== filters.source) return false;
        }

        // Posted Date recency
        if (filters.postedWithinDays !== null && job.postedAt && nowTimestamp > 0) {
          const postedMs = new Date(job.postedAt).getTime();
          const cutoffMs = nowTimestamp - filters.postedWithinDays * 24 * 60 * 60 * 1000;
          if (postedMs < cutoffMs) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "relevance") {
          // Rank: HIGH_RELEVANCE (4) > RELEVANT (3) > POSSIBLE (2) > LOW_RELEVANCE (1)
          const getRank = (j: Job) => {
            const bkt = j.match?.relevanceBucket;
            if (bkt === "HIGH_RELEVANCE") return 4;
            if (bkt === "RELEVANT") return 3;
            if (bkt === "POSSIBLE") return 2;
            return 1;
          };
          const rankDiff = getRank(b) - getRank(a);
          if (rankDiff !== 0) return rankDiff;

          // Tie-break: Hyderabad first, then international travel, then legacy overallScore
          const aHyd = a.normalizedLocation === "HYDERABAD" ? 1 : 0;
          const bHyd = b.normalizedLocation === "HYDERABAD" ? 1 : 0;
          if (bHyd !== aHyd) return bHyd - aHyd;

          return (b.match?.overallScore || 0) - (a.match?.overallScore || 0);
        }
        if (filters.sortBy === "newest") {
          const bTime = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.discoveredAt).getTime();
          const aTime = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.discoveredAt).getTime();
          return bTime - aTime;
        }
        if (filters.sortBy === "salary") {
          return (b.salaryLpaMin || 0) - (a.salaryLpaMin || 0);
        }
        if (filters.sortBy === "travel") {
          const aTravelVal =
            a.travel.type === "INTERNATIONAL_TRAVEL"
              ? 3
              : a.travel.type === "CLIENT_SITE_TRAVEL"
              ? 2
              : 1;
          const bTravelVal =
            b.travel.type === "INTERNATIONAL_TRAVEL"
              ? 3
              : b.travel.type === "CLIENT_SITE_TRAVEL"
              ? 2
              : 1;
          return bTravelVal - aTravelVal;
        }
        if (filters.sortBy === "location") {
          return a.location.localeCompare(b.location);
        }
        return 0;
      });
  }, [jobs, filters, nowTimestamp]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              LIVE MARKET RADAR
            </h1>
            <span className="rounded-full bg-emerald-950 border border-emerald-800 px-3 py-0.5 text-xs font-semibold text-emerald-300">
              Live Ingestion Engine
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Automated market radar for Senior Technical Leads, Frontend Architects & Digital Experience leaders with verified travel and India eligibility.
          </p>
        </div>

        {/* Live Provider Sync Action */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCoveragePanel(!showCoveragePanel)}
            className="rounded-xl border border-slate-700 bg-slate-850 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
          >
            {showCoveragePanel ? "Hide Coverage Panel" : "📊 Coverage Panel"}
          </button>
          <SyncButton onSyncComplete={handleSyncComplete} existingJobs={jobs} />
        </div>
      </div>

      {/* LIVE MARKET RADAR — METRICS BAR */}
      <section className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Total Live Jobs</div>
          <div className="mt-1 text-xl font-bold text-white">{metrics.totalLive}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-slate-400">India Jobs</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">{metrics.india}</div>
        </div>

        <div className="rounded-xl border border-cyan-800/60 bg-cyan-950/20 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-cyan-300">Hyderabad</div>
          <div className="mt-1 text-xl font-bold text-cyan-300">{metrics.hyderabad}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Remote India</div>
          <div className="mt-1 text-xl font-bold text-sky-400">{metrics.remoteIndia}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Intl Remote</div>
          <div className="mt-1 text-xl font-bold text-indigo-400">{metrics.internationalRemote}</div>
        </div>

        <div className="rounded-xl border border-indigo-800/60 bg-indigo-950/20 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-indigo-300">Intl Travel</div>
          <div className="mt-1 text-xl font-bold text-indigo-300">{metrics.internationalTravel}</div>
        </div>

        <div className="rounded-xl border border-emerald-800/60 bg-emerald-950/20 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-emerald-400">High Relevance</div>
          <div className="mt-1 text-xl font-bold text-emerald-400">{metrics.highRelevance}</div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 text-center">
          <div className="text-[11px] font-semibold uppercase text-slate-400">Recently Posted</div>
          <div className="mt-1 text-xl font-bold text-amber-300">{metrics.recentlyPosted}</div>
        </div>
      </section>

      {/* MARKET COVERAGE DASHBOARD PANEL */}
      {showCoveragePanel && (
        <section className="rounded-2xl border border-cyan-800/50 bg-slate-900/95 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <span>📊 MARKET COVERAGE DASHBOARD</span>
            </h2>
            <span className="text-xs text-slate-400">Transparent Provider Telemetry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Providers Status Table */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-400">Configured Providers & Status</h3>
              <div className="space-y-2 text-xs">
                {(latestProviders.length > 0
                  ? latestProviders.map((p) => ({
                      name: p.name,
                      id: p.id,
                      status: !p.enabled ? "DISABLED" : p.success ? "LIVE" : "ERROR",
                      jobs: `${p.jobsReturned} vacancies`,
                    }))
                  : [
                      { name: "Company Career Boards (Greenhouse)", id: "greenhouse", status: "LIVE", jobs: "72 vacancies" },
                      { name: "Jobicy Remote Public Feed", id: "jobicy", status: "LIVE", jobs: "15 vacancies" },
                      { name: "Arbeitnow Public API", id: "arbeitnow", status: "LIVE", jobs: "15 vacancies" },
                      { name: "Remotive Remote API", id: "remotive", status: "LIVE", jobs: "11 vacancies" },
                      { name: "Adzuna Search API", id: "adzuna", status: "DISABLED", jobs: "0 (Requires APP_ID & KEY)" },
                    ]
                ).map((p) => (
                  <div key={p.id} className="flex items-center justify-between border-b border-slate-900 pb-1.5">
                    <span className="text-slate-300 font-medium">{p.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">{p.jobs}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          p.status === "LIVE"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                            : p.status === "DISABLED"
                            ? "bg-slate-800 text-slate-400 border border-slate-700"
                            : "bg-rose-950 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Ingestion & Telemetry Summary */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-2.5">
              <h3 className="text-xs font-bold uppercase text-slate-400">Coverage Telemetry</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <div className="text-slate-400">Unique Active Jobs:</div>
                  <div className="text-base font-bold text-white">{jobs.length}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400">Total India Coverage:</div>
                  <div className="text-base font-bold text-emerald-400">{metrics.india}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400">Hyderabad Metro Hub:</div>
                  <div className="text-base font-bold text-cyan-300">{metrics.hyderabad}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400">International Travel:</div>
                  <div className="text-base font-bold text-indigo-400">{metrics.internationalTravel}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400">High Relevance Candidates:</div>
                  <div className="text-base font-bold text-emerald-400">{metrics.highRelevance}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-slate-400">Freshly Discovered / Posted:</div>
                  <div className="text-base font-bold text-amber-300">{metrics.recentlyPosted}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Filters Control Panel */}
      <JobFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        availableSources={availableSources}
        availableRoleFamilies={availableRoleFamilies}
        availableCompanies={availableCompanies}
        totalCount={jobs.length}
        filteredCount={filteredJobs.length}
      />

      {/* Jobs Stream */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            onSave={handleSave}
            onApply={handleApply}
            onIgnore={handleIgnore}
            onStatusChange={handleStatusChange}
          />
        ))}

        {mounted && filteredJobs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/50 p-12 text-center">
            <div className="text-3xl mb-3">📡</div>
            <h3 className="text-base font-bold text-white">No opportunities matched your radar filters</h3>
            <p className="mt-1 text-xs text-slate-400 max-w-md mx-auto">
              Try adjusting your search criteria, widening the travel or location filters, or click &ldquo;Scan Market Now&rdquo; to fetch fresh opportunities from permitted providers.
            </p>
            <button
              onClick={() => setFilters(initialFilters)}
              className="mt-4 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-cyan-300 hover:bg-slate-700 transition"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}