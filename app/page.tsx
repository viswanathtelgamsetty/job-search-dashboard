"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { DashboardStats, Job } from "@/types";
import { calculateDashboardStats, getStoredJobs, saveJobs, updateJobStatusInStorage } from "@/lib/storage";
import { JobCard } from "@/components/jobs/JobCard";
import { SyncButton } from "@/components/jobs/SyncButton";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<DashboardStats>({
    discovered: 0,
    saved: 0,
    applied: 0,
    screening: 0,
    technical: 0,
    finalStage: 0,
    offers: 0,
    rejected: 0,
    ignored: 0,
    totalActive: 0,
    addedToday: 0,
    addedThisWeek: 0,
    internationalTravelCount: 0,
    highMatchCount: 0,
    conversionRate: 0,
  });

  useEffect(() => {
    const loaded = getStoredJobs();
    queueMicrotask(() => {
      setJobs(loaded);
      setStats(calculateDashboardStats(loaded));
    });
  }, []);

  function handleSave(job: Job) {
    const nextStatus = job.status === "SAVED" ? "DISCOVERED" : "SAVED";
    const updated = updateJobStatusInStorage(job.id, nextStatus);
    setJobs(updated);
    setStats(calculateDashboardStats(updated));
  }

  function handleApply(job: Job) {
    const updated = updateJobStatusInStorage(job.id, "APPLIED");
    setJobs(updated);
    setStats(calculateDashboardStats(updated));
  }

  function handleIgnore(job: Job) {
    const updated = updateJobStatusInStorage(job.id, "IGNORED");
    setJobs(updated);
    setStats(calculateDashboardStats(updated));
  }

  function handleStatusChange(job: Job, status: Job["status"]) {
    const updated = updateJobStatusInStorage(job.id, status);
    setJobs(updated);
    setStats(calculateDashboardStats(updated));
  }

  function handleSyncComplete(newJobs: Job[]) {
    saveJobs(newJobs);
    setJobs(newJobs);
    setStats(calculateDashboardStats(newJobs));
  }

  // "What jobs should I look at today?"
  // Prioritize active opportunities (DISCOVERED or SAVED) with highest match score and international travel
  const todayTopOpportunities = jobs
    .filter((j) => j.status === "DISCOVERED" || j.status === "SAVED")
    .sort((a, b) => {
      // Prioritize international travel + match score
      const aScore = (a.match?.overallScore || 0) + (a.travel.type === "INTERNATIONAL" ? 15 : 0);
      const bScore = (b.match?.overallScore || 0) + (b.travel.type === "INTERNATIONAL" ? 15 : 0);
      return bScore - aScore;
    })
    .slice(0, 3);

  const pipelineStages = [
    { label: "Discovered", count: stats.discovered, color: "text-slate-400", border: "border-slate-800" },
    { label: "Saved", count: stats.saved, color: "text-cyan-400", border: "border-cyan-800/60" },
    { label: "Applied", count: stats.applied, color: "text-indigo-400", border: "border-indigo-800/60" },
    { label: "Screening", count: stats.screening, color: "text-amber-400", border: "border-amber-800/60" },
    { label: "Technical", count: stats.technical, color: "text-purple-400", border: "border-purple-800/60" },
    { label: "Final Stage", count: stats.finalStage, color: "text-rose-400", border: "border-rose-800/60" },
    { label: "Offers", count: stats.offers, color: "text-emerald-400 font-extrabold", border: "border-emerald-700" },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10">
      {/* SECTION 1: UX PRIORITY - What jobs should I look at today? */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                CURRENT MARKET OPPORTUNITIES
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Top curated opportunities matching your 12+ yrs Senior Lead & Architect profile today.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <SyncButton onSyncComplete={handleSyncComplete} existingJobs={jobs} />
            <Link
              href="/jobs"
              className="rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition"
            >
              Explore Full Radar ({jobs.length}) →
            </Link>
          </div>
        </div>

        {/* Top Today's Cards */}
        <div className="space-y-4">
          {todayTopOpportunities.length > 0 ? (
            todayTopOpportunities.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSave={handleSave}
                onApply={handleApply}
                onIgnore={handleIgnore}
                onStatusChange={handleStatusChange}
              />
            ))
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
              All top opportunities are currently tracked in your pipeline!{" "}
              <Link href="/jobs" className="text-cyan-400 underline font-medium">
                Scan new feeds
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: RADAR VELOCITY & METRICS (DYNAMIC - NOT HARDCODED) */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <span>📊</span> Market Radar Pulse & Discovery Velocity
          </h2>
          <p className="text-xs text-slate-400">
            Real-time ingestion metrics, pipeline progress, and conversion analytics.
          </p>
        </div>

        {/* Discovery & Freshness Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {/* Discovered Total */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Discovered
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-white">{stats.discovered}</p>
            <p className="mt-1 text-[11px] text-slate-500">Unprocessed in radar</p>
          </div>

          {/* Added Today */}
          <div className="rounded-2xl border border-cyan-800/40 bg-slate-900/80 p-4">
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Added Today
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-cyan-300">
              +{stats.addedToday}
            </p>
            <p className="mt-1 text-[11px] text-cyan-500/80">Fresh market signals</p>
          </div>

          {/* Added This Week */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Added This Week
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-indigo-300">
              +{stats.addedThisWeek}
            </p>
            <p className="mt-1 text-[11px] text-slate-500">Trailing 7-day velocity</p>
          </div>

          {/* International Travel Count */}
          <div className="rounded-2xl border border-indigo-800/40 bg-slate-900/80 p-4">
            <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
              International Travel
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-indigo-300">
              {stats.internationalTravelCount}
            </p>
            <p className="mt-1 text-[11px] text-indigo-400/70">US / EU / SG client travel</p>
          </div>

          {/* Application Conversion Rate */}
          <div className="rounded-2xl border border-emerald-800/40 bg-slate-900/80 p-4">
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Offer Conversion
            </span>
            <p className="mt-2 text-2xl sm:text-3xl font-black text-emerald-300">
              {stats.conversionRate}%
            </p>
            <p className="mt-1 text-[11px] text-emerald-500/80">Pipeline win rate</p>
          </div>
        </div>
      </section>

      {/* SECTION 3: APPLICATION PIPELINE SUMMARY */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span>📋</span> Application Pipeline Overview
            </h2>
            <p className="text-xs text-slate-400">
              Live funnel stages from initial discovery to active offers.
            </p>
          </div>
          <Link
            href="/applications"
            className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 underline"
          >
            Open Kanban Board →
          </Link>
        </div>

        {/* Pipeline Stage Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {pipelineStages.map((stage) => (
            <div
              key={stage.label}
              className={`rounded-xl border ${stage.border} bg-slate-900/70 p-3.5 text-center`}
            >
              <p className="text-xs font-medium text-slate-400">{stage.label}</p>
              <p className={`mt-2 text-xl font-bold ${stage.color}`}>{stage.count}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: TARGET PROFILE OVERVIEW */}
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Active Search Target Profile
            </span>
            <h3 className="text-base font-bold text-white mt-1">
              Senior Technical Lead / Frontend Architect (12+ Years Experience)
            </h3>
          </div>
          <Link
            href="/settings"
            className="rounded-xl border border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition w-fit"
          >
            Modify Search Criteria ⚙️
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
            <span className="font-semibold text-slate-400">Target Role Families</span>
            <p className="text-slate-200">
              Senior Technical Lead, Frontend Architect, UI Architect, Solutions Architect, Digital Experience / CMS Consultant
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
            <span className="font-semibold text-slate-400">Key Technologies</span>
            <p className="text-slate-200">
              React, Next.js, TypeScript, Angular, Contentful, Headless CMS, Frontend Architecture, Commerce
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5 space-y-1">
            <span className="font-semibold text-slate-400">Travel & Compensation</span>
            <p className="text-slate-200">
              Prefer ₹35 LPA+ • International Customer Travel (USA, Europe, Middle East, Singapore)
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}