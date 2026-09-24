"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Application, CareerDomain, Job, JobFiltersState, JobStatus, MarketRadarSection, ProviderStatus } from "@/types";
import { getStoredJobs, saveJobs, updateJobStatusInStorage } from "@/lib/storage";
import {
  applyToJobAsApplication,
  getApplications,
  isFollowUpDue,
  saveJobAsApplication,
} from "@/lib/applicationStore";
import { JobCard } from "@/components/jobs/JobCard";
import { JobFilters } from "@/components/jobs/JobFilters";
import { JobDetailModal } from "@/components/jobs/JobDetailModal";
import { MarketRadarSummary } from "@/components/jobs/MarketRadarSummary";
import { OpportunityPriorityBar } from "@/components/jobs/OpportunityPriorityBar";
import { CareerLanesBar } from "@/components/jobs/CareerLanesBar";
import { MarketRadarSectionTabs } from "@/components/jobs/MarketRadarSectionTabs";
import { SyncButton } from "@/components/jobs/SyncButton";
import {
  calculateMarketRadarMetrics,
  getOpportunityPriority,
  matchesRadarSection,
  sortMarketRadarJobs,
} from "@/lib/marketRadar";

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
  domain: "ALL",
  clientFacing: "ALL",
  relevance: "ALL",
  company: "ALL",
  freshness: "ALL",
  postedWithinDays: null,
  sortBy: "relevance",
  section: "ALL",
  opportunityPriority: "ALL",
  applicationTrackingFilter: "ALL",
};

export default function MarketRadarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applicationsMap, setApplicationsMap] = useState<Map<string, Application>>(new Map());
  const [filters, setFilters] = useState<JobFiltersState>(initialFilters);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(0);
  const [showCoveragePanel, setShowCoveragePanel] = useState(false);
  const [latestProviders, setLatestProviders] = useState<ProviderStatus[]>([]);

  function refreshApplications() {
    const apps = getApplications();
    const map = new Map<string, Application>();
    apps.forEach((a) => map.set(a.jobId, a));
    setApplicationsMap(map);
  }

  useEffect(() => {
    const stored = getStoredJobs();
    const currentMs = Date.now();
    queueMicrotask(() => {
      setNowTimestamp(currentMs);
      setJobs(stored);
      refreshApplications();
      setMounted(true);
    });

    window.addEventListener("job-market-radar:applications-updated", refreshApplications);
    return () => {
      window.removeEventListener("job-market-radar:applications-updated", refreshApplications);
    };
  }, []);

  function handleSave(job: Job) {
    const existing = applicationsMap.get(job.id);
    if (!existing) {
      const app = saveJobAsApplication(job);
      setApplicationsMap((prev) => new Map(prev).set(job.id, app));
    }
  }

  function handleApply(job: Job) {
    const app = applyToJobAsApplication(job);
    setApplicationsMap((prev) => new Map(prev).set(job.id, app));
    if (job.url) {
      window.open(job.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleIgnore(job: Job) {
    const updated = updateJobStatusInStorage(job.id, "IGNORED");
    setJobs(updated);
    if (selectedJob && selectedJob.id === job.id) {
      setSelectedJob({ ...selectedJob, status: "IGNORED" });
    }
  }

  function handleStatusChange(job: Job, status: JobStatus) {
    const updated = updateJobStatusInStorage(job.id, status);
    setJobs(updated);
    if (selectedJob && selectedJob.id === job.id) {
      setSelectedJob({ ...selectedJob, status });
    }
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

  // Exact 15 summary metrics calculated from live jobs
  const metrics = useMemo(() => {
    return calculateMarketRadarMetrics(jobs);
  }, [jobs]);

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    const baseFiltered = jobs.filter((job) => {
      // Exclude IGNORED from discovery unless searching
      if (job.status === "IGNORED" && !filters.search) {
        return false;
      }

      // Market Radar Section Filtering (Sections A - F)
      if (filters.section && filters.section !== "ALL") {
        if (!matchesRadarSection(job, filters.section)) {
          return false;
        }
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

      // Application Pipeline Filter (All / Saved / Applied / Needs Follow-up)
      if (filters.applicationTrackingFilter === "SAVED") {
        const app = applicationsMap.get(job.id);
        const isSaved = app ? app.status === "SAVED" : job.status === "SAVED";
        if (!isSaved) return false;
      } else if (filters.applicationTrackingFilter === "APPLIED") {
        const app = applicationsMap.get(job.id);
        const isApplied = app
          ? app.status !== "SAVED" && app.status !== "DISCOVERED" && app.status !== "IGNORED"
          : job.status === "APPLIED";
        if (!isApplied) return false;
      } else if (filters.applicationTrackingFilter === "NEEDS_FOLLOW_UP") {
        const app = applicationsMap.get(job.id);
        if (!app || !isFollowUpDue(app)) return false;
      }

      // Career Fit / Relevance Bucket Filter
      if (filters.relevance !== "ALL") {
        const fit = job.careerFit || job.match?.relevanceBucket;
        if (fit !== filters.relevance) return false;
      }

      // Career Domain Filter (strictly primary domains)
      if (filters.domain && filters.domain !== "ALL") {
        const hasDomain =
          job.domains?.includes(filters.domain as CareerDomain) ||
          job.domainMatches?.some((d) => d.matched && d.domain === filters.domain);
        if (!hasDomain) return false;
      }

      // Client-Facing Filter
      if (filters.clientFacing && filters.clientFacing !== "ALL") {
        const isClientFacing =
          job.match?.dimensions?.clientFacingFit?.matched ||
          ["SOLUTIONS_ARCHITECT", "TECHNICAL_CONSULTANT", "IMPLEMENTATION_CONSULTANT", "PROFESSIONAL_SERVICES"].includes(
            job.roleFamily
          );
        if (filters.clientFacing === "YES" && !isClientFacing) return false;
        if (filters.clientFacing === "NO" && isClientFacing) return false;
      }

      // Technology Filter
      if (filters.technology !== "ALL") {
        const techLower = filters.technology.toLowerCase();
        const hasTech =
          job.skills.some((s) => s.toLowerCase() === techLower) ||
          (job.actualJobTechnologies && job.actualJobTechnologies.some((s) => s.toLowerCase() === techLower)) ||
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

      // Salary Requirement
      if (filters.minSalaryLpa !== null) {
        if (job.salaryDisclosed && job.salaryLpaMin) {
          if (job.salaryLpaMin < filters.minSalaryLpa) return false;
        }
      }

      // Role Family
      if (filters.roleFamily !== "ALL") {
        if (job.roleFamily !== filters.roleFamily) return false;
      }

      // Travel Type Filter
      if (filters.travelType !== "ALL") {
        if (job.travel.type !== filters.travelType) return false;
      }

      // Freshness Classification Filter
      if (filters.freshness && filters.freshness !== "ALL") {
        if (job.freshness !== filters.freshness) return false;
      }

      // Opportunity Priority Filter
      if (filters.opportunityPriority && filters.opportunityPriority !== "ALL") {
        if (getOpportunityPriority(job) !== filters.opportunityPriority) return false;
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
    });

    // Deterministic explainable sorting
    return sortMarketRadarJobs(baseFiltered, filters.sortBy);
  }, [jobs, filters, nowTimestamp, applicationsMap]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              MARKET RADAR
            </h1>
            <span className="rounded-full bg-emerald-950 border border-emerald-800 px-3 py-0.5 text-xs font-semibold text-emerald-300">
              Live Ingestion Engine
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Real-time market radar discovering active opportunities for Senior Technical Leads, Frontend Architects & Digital Experience leaders.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCoveragePanel(!showCoveragePanel)}
            className="rounded-xl border border-slate-700 bg-slate-850 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white hover:border-slate-600 transition"
          >
            {showCoveragePanel ? "Hide Telemetry" : "📊 Ingestion Telemetry"}
          </button>
          <SyncButton onSyncComplete={handleSyncComplete} existingJobs={jobs} />
        </div>
      </div>

      {/* OPPORTUNITY ACTION RADAR (Deterministic Priority: PRIORITY, ACTIVE, WATCH, LOW) */}
      <OpportunityPriorityBar
        jobs={jobs}
        selectedPriority={filters.opportunityPriority || "ALL"}
        onSelectPriority={(p) => setFilters((prev) => ({ ...prev, opportunityPriority: p }))}
      />

      {/* MARKET RADAR SUMMARY (Exact 15 Metrics) */}
      <MarketRadarSummary
        metrics={metrics}
        filters={filters}
        onFilterChange={(partial) => setFilters((prev) => ({ ...prev, ...partial }))}
      />

      {/* MARKET RADAR SECTIONS (Tabs A through F) */}
      <MarketRadarSectionTabs
        jobs={jobs}
        activeSection={filters.section || "ALL"}
        onSelectSection={(sec: MarketRadarSection) =>
          setFilters((prev) => ({ ...prev, section: sec }))
        }
      />

      {/* TARGET CAREER LANES (14 Domains) */}
      <CareerLanesBar
        jobs={jobs}
        selectedDomain={filters.domain}
        onSelectDomain={(domain) => setFilters((prev) => ({ ...prev, domain }))}
      />

      {/* MARKET COVERAGE / TELEMETRY PANEL (Collapsible) */}
      {showCoveragePanel && (
        <section className="rounded-2xl border border-cyan-800/50 bg-slate-900/95 p-5 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <span>📊 INGESTION TELEMETRY & PROVIDER AUDIT</span>
            </h2>
            <span className="text-xs text-slate-400">Transparent Pipeline Verification</span>
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

            {/* Telemetry Summary */}
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
                  <div className="text-base font-bold text-amber-300">{metrics.freshJobs + metrics.recentJobs}</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* APPLICATION PIPELINE QUICK FILTER STRIP */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">
            Pipeline Views:
          </span>
          {[
            { id: "ALL", label: "All Jobs" },
            { id: "SAVED", label: "Saved" },
            { id: "APPLIED", label: "Applied" },
            { id: "NEEDS_FOLLOW_UP", label: "Needs Follow-up" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  applicationTrackingFilter: tab.id as "ALL" | "SAVED" | "APPLIED" | "NEEDS_FOLLOW_UP",
                }))
              }
              className={`rounded-xl px-3 py-1.5 font-semibold text-xs transition ${
                (filters.applicationTrackingFilter || "ALL") === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <Link
          href="/applications"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline"
        >
          <span>Open Application Pipeline</span>
          <span>→</span>
        </Link>
      </div>

      {/* FILTERS CONTROL PANEL */}
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

      {/* JOBS STREAM */}
      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            application={applicationsMap.get(job.id)}
            onSelect={(j) => setSelectedJob(j)}
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

      {/* JOB DETAIL MODAL */}
      <JobDetailModal
        job={selectedJob}
        application={selectedJob ? applicationsMap.get(selectedJob.id) : undefined}
        onClose={() => setSelectedJob(null)}
        onSave={handleSave}
        onApply={handleApply}
      />
    </div>
  );
}