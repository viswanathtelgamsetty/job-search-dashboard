"use client";

import { useEffect, useMemo, useState } from "react";
import type { Job, JobFiltersState, JobStatus } from "@/types";
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
  postedWithinDays: null,
  sortBy: "relevance",
};

export default function MarketRadarPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [filters, setFilters] = useState<JobFiltersState>(initialFilters);
  const [mounted, setMounted] = useState(false);
  const [nowTimestamp, setNowTimestamp] = useState(0);

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

  function handleSyncComplete(newJobs: Job[]) {
    saveJobs(newJobs);
    setJobs(newJobs);
  }

  // Derive unique sources and role families
  const availableSources = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.source))).filter(Boolean);
  }, [jobs]);

  const availableRoleFamilies = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.roleFamily))).filter(Boolean);
  }, [jobs]);

  // Filter & Sort Logic
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Exclude IGNORED from the default discovery list unless explicitly searching
        if (job.status === "IGNORED" && !filters.search) {
          return false;
        }

        // Search text matching: keyword, title, company, skills, description
        if (filters.search) {
          const q = filters.search.toLowerCase();
          const matchesSearch =
            job.title.toLowerCase().includes(q) ||
            job.company.toLowerCase().includes(q) ||
            job.skills.some((s) => s.toLowerCase().includes(q)) ||
            (job.description && job.description.toLowerCase().includes(q)) ||
            job.roleFamily.toLowerCase().includes(q);

          if (!matchesSearch) return false;
        }

        // Location Filter
        if (filters.location !== "ALL") {
          const loc = job.location.toLowerCase();
          if (filters.location === "HYDERABAD" && !loc.includes("hyderabad")) {
            return false;
          }
          if (
            filters.location === "INDIA" &&
            !loc.includes("india") &&
            !loc.includes("hyderabad") &&
            !loc.includes("bengaluru") &&
            !loc.includes("bangalore") &&
            !loc.includes("pune")
          ) {
            return false;
          }
          if (
            filters.location === "REMOTE" &&
            job.remoteType !== "REMOTE" &&
            !loc.includes("remote")
          ) {
            return false;
          }
        }

        // Remote Type
        if (filters.remoteType !== "ALL") {
          if (job.remoteType !== filters.remoteType) return false;
        }

        // Salary Requirement (Prefer ₹35L+; never reject solely because salary unknown)
        if (filters.minSalaryLpa !== null) {
          if (job.salaryDisclosed && job.salaryLpaMin) {
            if (job.salaryLpaMin < filters.minSalaryLpa) return false;
          }
          // If undisclosed, keep it per rule
        }

        // Role Family
        if (filters.roleFamily !== "ALL") {
          if (job.roleFamily !== filters.roleFamily) return false;
        }

        // Travel Type
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
          const cutoffMs =
            nowTimestamp - filters.postedWithinDays * 24 * 60 * 60 * 1000;
          if (postedMs < cutoffMs) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "relevance") {
          return (b.match?.overallScore || 0) - (a.match?.overallScore || 0);
        }
        if (filters.sortBy === "newest") {
          return (
            new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
          );
        }
        if (filters.sortBy === "salary") {
          return (b.salaryLpaMin || 0) - (a.salaryLpaMin || 0);
        }
        if (filters.sortBy === "travel") {
          const aTravelVal =
            a.travel.type === "INTERNATIONAL"
              ? 3
              : a.travel.type === "CLIENT_SITE"
              ? 2
              : 1;
          const bTravelVal =
            b.travel.type === "INTERNATIONAL"
              ? 3
              : b.travel.type === "CLIENT_SITE"
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
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white sm:text-3xl">
              Market Radar
            </span>
            <span className="rounded-full bg-cyan-950 border border-cyan-800 px-3 py-0.5 text-xs font-semibold text-cyan-400">
              Active Discovery
            </span>
          </div>
          <p className="mt-1.5 text-sm text-slate-400">
            Real-time discoverability for Senior Tech Leads, Frontend Architects & Digital Experience leaders with international travel.
          </p>
        </div>

        {/* Live Provider Sync Action */}
        <SyncButton onSyncComplete={handleSyncComplete} existingJobs={jobs} />
      </div>

      {/* Filters Control Panel */}
      <JobFilters
        filters={filters}
        onChange={setFilters}
        onReset={() => setFilters(initialFilters)}
        availableSources={availableSources}
        availableRoleFamilies={availableRoleFamilies}
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