"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Application, Job, JobStatus, SearchPeriodSettings } from "@/types";
import {
  getStoredJobs,
  saveJobs,
  updateJobStatusInStorage,
} from "@/lib/storage";
import {
  getApplications,
  saveJobAsApplication,
  applyToJobAsApplication,
  calculateApplicationFunnelMetrics,
} from "@/lib/applicationStore";
import {
  calculateDailyActions,
  calculateDailyActivity,
  calculateMarketActivity,
  calculateSearchHealth,
  calculateSearchProgress,
  calculateTargetRoleDistribution,
  calculateTodayMetrics,
  calculateWeeklyActivity,
  getSearchPeriodSettings,
  saveSearchPeriodSettings,
} from "@/lib/searchAnalytics";
import { JobCard } from "@/components/jobs/JobCard";
import { SyncButton } from "@/components/jobs/SyncButton";
import { SearchHeader } from "@/components/command-center/SearchHeader";
import { TodayActionsPanel } from "@/components/command-center/TodayActionsPanel";
import { MarketActivitySection } from "@/components/command-center/MarketActivitySection";
import { ApplicationFunnelSection } from "@/components/command-center/ApplicationFunnelSection";
import { WeeklyActivitySection } from "@/components/command-center/WeeklyActivitySection";
import { SearchHealthSection } from "@/components/command-center/SearchHealthSection";
import { TargetRoleDistributionSection } from "@/components/command-center/TargetRoleDistributionSection";
import { ConfigurePeriodModal } from "@/components/command-center/ConfigurePeriodModal";

export default function DashboardPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [settings, setSettings] = useState<SearchPeriodSettings>(() => getSearchPeriodSettings());
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load jobs, applications, and settings
  useEffect(() => {
    const loadedJobs = getStoredJobs();
    const loadedApps = getApplications();
    const loadedSettings = getSearchPeriodSettings();

    queueMicrotask(() => {
      setJobs(loadedJobs);
      setApplications(loadedApps);
      setSettings(loadedSettings);
    });

    function handleAppsUpdated() {
      setApplications(getApplications());
    }

    window.addEventListener("job-market-radar:applications-updated", handleAppsUpdated);
    return () => {
      window.removeEventListener("job-market-radar:applications-updated", handleAppsUpdated);
    };
  }, []);

  // Handlers for Job actions
  function handleSave(job: Job) {
    const nextStatus: JobStatus = job.status === "SAVED" ? "DISCOVERED" : "SAVED";
    const updated = updateJobStatusInStorage(job.id, nextStatus);
    setJobs(updated);
    if (nextStatus === "SAVED") {
      saveJobAsApplication(job);
    }
    setApplications(getApplications());
  }

  function handleApply(job: Job) {
    const updated = updateJobStatusInStorage(job.id, "APPLIED");
    setJobs(updated);
    applyToJobAsApplication(job);
    setApplications(getApplications());
    if (job.url) {
      window.open(job.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleIgnore(job: Job) {
    const updated = updateJobStatusInStorage(job.id, "IGNORED");
    setJobs(updated);
  }

  function handleStatusChange(job: Job, status: Job["status"]) {
    const updated = updateJobStatusInStorage(job.id, status);
    setJobs(updated);
    if (status === "APPLIED") {
      applyToJobAsApplication(job);
    } else if (status === "SAVED") {
      saveJobAsApplication(job);
    }
    setApplications(getApplications());
  }

  function handleSyncComplete(newJobs: Job[]) {
    saveJobs(newJobs);
    setJobs(newJobs);
  }

  function handleSaveSettings(updatedSettings: SearchPeriodSettings) {
    setSettings(updatedSettings);
    saveSearchPeriodSettings(updatedSettings);
  }

  // Analytics derived deterministically from actual state
  const progress = useMemo(() => calculateSearchProgress(settings), [settings]);
  const todayMetrics = useMemo(() => calculateTodayMetrics(jobs, applications), [jobs, applications]);
  const dailyActions = useMemo(
    () => calculateDailyActions(jobs, applications, settings),
    [jobs, applications, settings]
  );
  const marketMetrics = useMemo(() => calculateMarketActivity(jobs), [jobs]);
  const funnel = useMemo(() => calculateApplicationFunnelMetrics(applications), [applications]);
  const dailyBuckets = useMemo(
    () => calculateDailyActivity(jobs, applications, settings),
    [jobs, applications, settings]
  );
  const weeklyBuckets = useMemo(
    () => calculateWeeklyActivity(dailyBuckets, settings),
    [dailyBuckets, settings]
  );
  const health = useMemo(
    () => calculateSearchHealth(jobs, applications, settings.inactiveThresholdDays),
    [jobs, applications, settings.inactiveThresholdDays]
  );
  const roleDistribution = useMemo(() => calculateTargetRoleDistribution(jobs), [jobs]);

  // Relevant job count
  const relevantJobsCount = useMemo(
    () =>
      jobs.filter(
        (j) => j.careerFit === "HIGH_RELEVANCE" || j.careerFit === "RELEVANT"
      ).length,
    [jobs]
  );

  // Top curated opportunities matching profile (PRIORITY and HIGH_RELEVANCE first)
  const todayTopOpportunities = useMemo(() => {
    return jobs
      .filter((j) => j.status === "DISCOVERED" || j.status === "SAVED")
      .sort((a, b) => {
        const priorityOrder = { PRIORITY: 3, ACTIVE: 2, WATCH: 1, LOW: 0 };
        const pA = priorityOrder[a.opportunityPriority || "LOW"];
        const pB = priorityOrder[b.opportunityPriority || "LOW"];
        if (pA !== pB) return pB - pA;

        const aScore =
          (a.match?.overallScore || 0) + (a.travel.type === "INTERNATIONAL_TRAVEL" ? 15 : 0);
        const bScore =
          (b.match?.overallScore || 0) + (b.travel.type === "INTERNATIONAL_TRAVEL" ? 15 : 0);
        return bScore - aScore;
      })
      .slice(0, 3);
  }, [jobs]);

  // Fast application lookup map
  const appsMap = useMemo(() => {
    const map = new Map<string, Application>();
    for (const a of applications) {
      map.set(a.jobId, a);
    }
    return map;
  }, [applications]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-10">
      {/* 1. 60-DAY SEARCH HEADER */}
      <SearchHeader
        progress={progress}
        totalJobs={jobs.length}
        relevantJobs={relevantJobsCount}
        totalApplications={applications.length}
        followUpsDue={todayMetrics.followUpsDue}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. TODAY'S ACTIONS PANEL */}
      <TodayActionsPanel todayMetrics={todayMetrics} dailyActions={dailyActions} />

      {/* 3. MARKET ACTIVITY SECTION */}
      <MarketActivitySection metrics={marketMetrics} />

      {/* 4. APPLICATION FUNNEL */}
      <ApplicationFunnelSection funnel={funnel} />

      {/* 5. WEEKLY & DAILY ACTIVITY TIMELINE */}
      <WeeklyActivitySection
        weeklyBuckets={weeklyBuckets}
        dailyBuckets={dailyBuckets}
        settings={settings}
      />

      {/* 6. SEARCH HEALTH SECTION */}
      <SearchHealthSection health={health} />

      {/* 7. TARGET ROLE DISTRIBUTION */}
      <TargetRoleDistributionSection distribution={roleDistribution} />

      {/* 8. CURRENT CURATED OPPORTUNITIES */}
      <section className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 rounded-full bg-emerald-400 animate-ping"></span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Featured Priority Opportunities
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Top curated opportunities matching your 12+ yrs Senior Lead & Architect profile.
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

        <div className="space-y-4">
          {todayTopOpportunities.length > 0 ? (
            todayTopOpportunities.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                application={appsMap.get(job.id)}
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

      {/* 9. TARGET PROFILE OVERVIEW */}
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

      {/* Campaign Settings Modal */}
      <ConfigurePeriodModal
        isOpen={isSettingsOpen}
        settings={settings}
        onClose={() => setIsSettingsOpen(false)}
        onSave={handleSaveSettings}
      />
    </div>
  );
}