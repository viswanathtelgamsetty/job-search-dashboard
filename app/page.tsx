"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Application, Job, JobStatus, SearchPeriodSettings } from "@/types";
import {
  getStoredJobs,
  saveJobs,
  updateJobStatusInStorage,
  ignoreJobInStorage,
} from "@/lib/storage";
import {
  getApplications,
  saveJobAsApplication,
  applyToJobAsApplication,
  calculateApplicationFunnelMetrics,
  checkIsAlreadyApplied,
  markFollowUpDone,
  rescheduleFollowUp,
  deleteApplication,
} from "@/lib/applicationStore";
import {
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
import { sortDailyJobQueue } from "@/lib/dailyQueue";
import {
  getLastVisitTimestamp,
  getNewJobsSinceLastVisit,
  updateLastVisitTimestamp,
} from "@/lib/lastVisitTracker";

import { SyncButton } from "@/components/jobs/SyncButton";
import { JobDetailModal } from "@/components/jobs/JobDetailModal";
import { JobIgnoreModal } from "@/components/jobs/JobIgnoreModal";
import { AlreadyAppliedModal } from "@/components/applications/AlreadyAppliedModal";
import { ApplicationDetailModal } from "@/components/applications/ApplicationDetailModal";
import { SearchHeader } from "@/components/command-center/SearchHeader";
import { DailyActionCenter } from "@/components/command-center/DailyActionCenter";
import { NewSinceLastVisitSection } from "@/components/command-center/NewSinceLastVisitSection";
import { ApplyTodaySection } from "@/components/command-center/ApplyTodaySection";
import { SavedJobsSection } from "@/components/command-center/SavedJobsSection";
import { FollowUpsSection } from "@/components/command-center/FollowUpsSection";
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

  // Active action center tab: ALL, APPLY_NOW, REVIEW, SAVED, FOLLOW_UPS
  const [actionTab, setActionTab] = useState<string>("ALL");

  // Modals state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);
  const [selectedJobForIgnore, setSelectedJobForIgnore] = useState<Job | null>(null);
  const [alreadyAppliedInfo, setAlreadyAppliedInfo] = useState<{
    job: Job;
    application: Application;
  } | null>(null);
  const [selectedAppForDetails, setSelectedAppForDetails] = useState<Application | null>(null);

  // Last visit tracking
  const [lastVisitTimestamp, setLastVisitTimestamp] = useState<string>(() => getLastVisitTimestamp());

  // Load jobs, applications, and settings
  useEffect(() => {
    const loadedJobs = getStoredJobs();
    const loadedApps = getApplications();
    const loadedSettings = getSearchPeriodSettings();

    queueMicrotask(() => {
      setJobs(loadedJobs);
      setApplications(loadedApps);
      setSettings(loadedSettings);
      setLastVisitTimestamp(getLastVisitTimestamp());
    });

    function handleAppsUpdated() {
      setApplications(getApplications());
    }

    window.addEventListener("job-market-radar:applications-updated", handleAppsUpdated);
    return () => {
      window.removeEventListener("job-market-radar:applications-updated", handleAppsUpdated);
    };
  }, []);

  // Maps for O(1) lookups
  const appsMap = useMemo(() => {
    const map = new Map<string, Application>();
    for (const a of applications) {
      map.set(a.jobId, a);
    }
    return map;
  }, [applications]);

  const jobsMap = useMemo(() => {
    const map = new Map<string, Job>();
    for (const j of jobs) {
      map.set(j.id, j);
    }
    return map;
  }, [jobs]);

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
    // Duplicate Protection Check
    const check = checkIsAlreadyApplied(job.id);
    if (check.isAlreadyApplied && check.application) {
      setAlreadyAppliedInfo({ job, application: check.application });
      return;
    }

    const updated = updateJobStatusInStorage(job.id, "APPLIED");
    setJobs(updated);
    applyToJobAsApplication(job);
    setApplications(getApplications());

    if (job.url && job.url !== "#") {
      window.open(job.url, "_blank", "noopener,noreferrer");
    }
  }

  function handleIgnoreClick(job: Job) {
    setSelectedJobForIgnore(job);
  }

  function handleConfirmIgnore(job: Job, reason: string) {
    const updated = ignoreJobInStorage(job.id, reason);
    setJobs(updated);
    setSelectedJobForIgnore(null);
  }

  function handleMarkFollowUpComplete(appId: string) {
    markFollowUpDone(appId);
    setApplications(getApplications());
  }

  function handleRescheduleFollowUp(appId: string, newDateIso: string, note?: string) {
    rescheduleFollowUp(appId, newDateIso, note);
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

  function handleMarkSeen() {
    const now = new Date().toISOString();
    updateLastVisitTimestamp(now);
    setLastVisitTimestamp(now);
  }

  // Analytics derived deterministically from actual state
  const progress = useMemo(() => calculateSearchProgress(settings), [settings]);
  const todayMetrics = useMemo(() => calculateTodayMetrics(jobs, applications), [jobs, applications]);
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

  // Deterministic daily job queue
  const dailyQueue = useMemo(() => sortDailyJobQueue(jobs), [jobs]);

  // Filter queue jobs based on activeTab
  const filteredQueueJobs = useMemo(() => {
    return dailyQueue.filter((job) => {
      const app = appsMap.get(job.id);
      const isApplied = app ? !["DISCOVERED", "SAVED", "IGNORED"].includes(app.status) : job.status === "APPLIED";
      if (isApplied) return false;

      const rec = job.applicationRecommendation || job.match?.applicationRecommendation || "WATCH";
      if (actionTab === "APPLY_NOW") return rec === "APPLY_NOW";
      if (actionTab === "REVIEW") return rec === "REVIEW";
      if (actionTab === "SAVED") return app?.status === "SAVED" || job.status === "SAVED";

      return true;
    });
  }, [dailyQueue, appsMap, actionTab]);

  const applyTodayJobs = useMemo(() => {
    return filteredQueueJobs.slice(0, 10);
  }, [filteredQueueJobs]);

  const savedJobs = useMemo(() => {
    return jobs.filter((j) => {
      const app = appsMap.get(j.id);
      return (j.status === "SAVED" || app?.status === "SAVED") && j.status !== "IGNORED";
    });
  }, [jobs, appsMap]);

  const newJobsSummary = useMemo(() => {
    return getNewJobsSinceLastVisit(jobs, lastVisitTimestamp);
  }, [jobs, lastVisitTimestamp]);

  const relevantJobsCount = useMemo(
    () =>
      jobs.filter(
        (j) => (j.careerFit === "HIGH_RELEVANCE" || j.careerFit === "RELEVANT") && j.status !== "IGNORED"
      ).length,
    [jobs]
  );

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

      {/* 2. TODAY'S DAILY ACTION CENTER */}
      <DailyActionCenter
        todayMetrics={todayMetrics}
        onSelectActionTab={(tab) => setActionTab(tab === actionTab ? "ALL" : tab)}
        activeTab={actionTab}
      />

      {/* 3. FRESH ARRIVALS SINCE LAST VISIT */}
      <NewSinceLastVisitSection
        summary={newJobsSummary}
        onMarkSeen={handleMarkSeen}
        onSelectJob={(j) => setSelectedJobForDetails(j)}
      />

      {/* 4. APPLY TODAY QUEUE */}
      <section className="space-y-4 pt-2">
        <ApplyTodaySection
          jobs={applyTodayJobs}
          applicationsMap={appsMap}
          onApply={handleApply}
          onSave={handleSave}
          onIgnore={handleIgnoreClick}
          onSelectJob={(j) => setSelectedJobForDetails(j)}
        />
      </section>

      {/* 5. SAVED JOBS AWAITING APPLICATION */}
      {(savedJobs.length > 0 || actionTab === "SAVED") && (
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <SavedJobsSection
            savedJobs={savedJobs}
            applicationsMap={appsMap}
            onApply={handleApply}
            onUnsave={handleSave}
            onSelectJob={(j) => setSelectedJobForDetails(j)}
          />
        </section>
      )}

      {/* 6. FOLLOW-UP MANAGEMENT */}
      {(todayMetrics.followUpsDue > 0 || actionTab === "FOLLOW_UPS" || applications.some((a) => a.nextFollowUpAt)) && (
        <section className="space-y-4 pt-4 border-t border-slate-800">
          <FollowUpsSection
            applications={applications}
            jobsMap={jobsMap}
            onMarkComplete={handleMarkFollowUpComplete}
            onReschedule={handleRescheduleFollowUp}
            onOpenApplication={(app) => setSelectedAppForDetails(app)}
          />
        </section>
      )}

      {/* 7. APPLICATION FUNNEL */}
      <ApplicationFunnelSection funnel={funnel} />

      {/* 8. WEEKLY & DAILY ACTIVITY TIMELINE */}
      <WeeklyActivitySection
        weeklyBuckets={weeklyBuckets}
        dailyBuckets={dailyBuckets}
        settings={settings}
      />

      {/* 9. MARKET ACTIVITY SECTION */}
      <MarketActivitySection metrics={marketMetrics} />

      {/* 10. SEARCH HEALTH SECTION */}
      <SearchHealthSection health={health} />

      {/* 11. TARGET ROLE DISTRIBUTION */}
      <TargetRoleDistributionSection distribution={roleDistribution} />

      {/* 12. RADAR EXPLORATION FOOTER BAR */}
      <section className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Live Feed Synchronization & Discovery
          </h3>
          <p className="text-xs text-slate-400">
            {jobs.length} total active vacancies currently indexed across 7 verified providers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SyncButton onSyncComplete={handleSyncComplete} existingJobs={jobs} />
          <Link
            href="/jobs"
            className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition"
          >
            Explore Full Market Radar ({jobs.length}) →
          </Link>
        </div>
      </section>

      {/* MODALS */}
      {/* Job Details Modal */}
      {selectedJobForDetails && (
        <JobDetailModal
          job={selectedJobForDetails}
          application={appsMap.get(selectedJobForDetails.id)}
          onClose={() => setSelectedJobForDetails(null)}
          onSave={handleSave}
          onApply={handleApply}
        />
      )}

      {/* Job Ignore Modal */}
      {selectedJobForIgnore && (
        <JobIgnoreModal
          job={selectedJobForIgnore}
          onClose={() => setSelectedJobForIgnore(null)}
          onConfirmIgnore={handleConfirmIgnore}
        />
      )}

      {/* Already Applied Modal */}
      {alreadyAppliedInfo && (
        <AlreadyAppliedModal
          job={alreadyAppliedInfo.job}
          application={alreadyAppliedInfo.application}
          onClose={() => setAlreadyAppliedInfo(null)}
          onOpenApplication={(app) => {
            setAlreadyAppliedInfo(null);
            setSelectedAppForDetails(app);
          }}
        />
      )}

      {/* Application Details Modal */}
      {selectedAppForDetails && (
        <ApplicationDetailModal
          application={selectedAppForDetails}
          job={jobsMap.get(selectedAppForDetails.jobId)}
          onClose={() => setSelectedAppForDetails(null)}
          onUpdate={(updated) => {
            setApplications(getApplications());
            setSelectedAppForDetails(updated);
          }}
          onDelete={(appId) => {
            deleteApplication(appId);
            setApplications(getApplications());
            setSelectedAppForDetails(null);
          }}
        />
      )}

      {/* Settings Modal */}
      <ConfigurePeriodModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </div>
  );
}