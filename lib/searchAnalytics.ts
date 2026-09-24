import type {
  Application,
  CareerDomain,
  DailyAction,
  DailyActivityBucket,
  Job,
  MarketActivityMetrics,
  SearchHealthMetrics,
  SearchPeriodSettings,
  SearchProgress,
  TargetRoleDistribution,
  TodayMetrics,
  WeeklyActivityBucket,
} from "@/types";
import { isFollowUpDue } from "./applicationStore.ts";

export const SEARCH_PERIOD_STORAGE_KEY = "job-market-radar:search-period:v1";

/**
 * Returns default search period settings with a 60-day duration starting today.
 */
export function defaultSearchPeriodSettings(nowIso?: string): SearchPeriodSettings {
  const baseDate = nowIso ? new Date(nowIso) : new Date();
  const startStr = baseDate.toISOString().slice(0, 10);

  // 60-day window: start date + 59 days
  const endDate = new Date(baseDate.getTime() + 59 * 24 * 60 * 60 * 1000);
  const endStr = endDate.toISOString().slice(0, 10);

  return {
    searchStartDate: startStr,
    searchEndDate: endStr,
    durationDays: 60,
    applicationsPerDayTarget: 2,
    applicationsPerWeekTarget: 10,
    followUpsPerWeekTarget: 5,
    inactiveThresholdDays: 7,
  };
}

let inMemorySearchPeriodSettings: SearchPeriodSettings | null = null;

export function _clearSearchPeriodSettingsForTest(): void {
  inMemorySearchPeriodSettings = null;
}

/**
 * Load search period settings from localStorage or memory fallback.
 * Ensures the start date is NEVER reset on reload once stored.
 */
export function getSearchPeriodSettings(): SearchPeriodSettings {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    if (!inMemorySearchPeriodSettings) {
      inMemorySearchPeriodSettings = defaultSearchPeriodSettings();
    }
    return { ...inMemorySearchPeriodSettings };
  }

  try {
    const raw = localStorage.getItem(SEARCH_PERIOD_STORAGE_KEY);
    if (!raw) {
      const def = defaultSearchPeriodSettings();
      localStorage.setItem(SEARCH_PERIOD_STORAGE_KEY, JSON.stringify(def));
      return def;
    }
    const parsed: SearchPeriodSettings = JSON.parse(raw);
    if (parsed.searchStartDate && parsed.durationDays) {
      return parsed;
    }
    const def = defaultSearchPeriodSettings();
    localStorage.setItem(SEARCH_PERIOD_STORAGE_KEY, JSON.stringify(def));
    return def;
  } catch {
    return defaultSearchPeriodSettings();
  }
}

/**
 * Persist updated search period settings.
 */
export function saveSearchPeriodSettings(settings: SearchPeriodSettings): void {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    inMemorySearchPeriodSettings = { ...settings };
    return;
  }
  try {
    localStorage.setItem(SEARCH_PERIOD_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage quota errors
  }
}

/**
 * Calculate progress through the 60-day search period.
 */
export function calculateSearchProgress(
  settings: SearchPeriodSettings,
  nowIso?: string
): SearchProgress {
  const now = nowIso ? new Date(nowIso) : new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const start = new Date(settings.searchStartDate + "T00:00:00.000Z");
  const duration = settings.durationDays > 0 ? settings.durationDays : 60;

  const msPerDay = 24 * 60 * 60 * 1000;
  const currentUtc = new Date(todayStr + "T00:00:00.000Z").getTime();
  const startUtc = start.getTime();
  const endUtc = new Date(settings.searchEndDate + "T00:00:00.000Z").getTime();

  let currentDay: number;
  let daysRemaining: number;
  let isCompleted = false;

  if (currentUtc < startUtc) {
    currentDay = 1;
    daysRemaining = duration;
  } else if (currentUtc > endUtc) {
    currentDay = duration;
    daysRemaining = 0;
    isCompleted = true;
  } else {
    const diffDays = Math.floor((currentUtc - startUtc) / msPerDay);
    currentDay = Math.min(duration, Math.max(1, diffDays + 1));
    const remainingDays = Math.floor((endUtc - currentUtc) / msPerDay);
    daysRemaining = Math.max(0, remainingDays);
    isCompleted = daysRemaining === 0 && currentDay === duration;
  }

  const progressPercentage = Math.min(
    100,
    Math.max(0, Math.round((currentDay / duration) * 100))
  );

  return {
    searchStartDate: settings.searchStartDate,
    searchEndDate: settings.searchEndDate,
    durationDays: duration,
    currentDay,
    daysRemaining,
    progressPercentage,
    isCompleted,
  };
}

/**
 * Deterministically generates daily activity buckets for all 60 days of the period.
 */
export function calculateDailyActivity(
  jobs: Job[],
  applications: Application[],
  settings: SearchPeriodSettings,
  nowIso?: string
): DailyActivityBucket[] {
  const now = nowIso ? new Date(nowIso) : new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const duration = settings.durationDays > 0 ? settings.durationDays : 60;
  const start = new Date(settings.searchStartDate + "T00:00:00.000Z");
  const buckets: DailyActivityBucket[] = [];

  for (let i = 0; i < duration; i++) {
    const dayDate = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = dayDate.toISOString().slice(0, 10);
    const dayNumber = i + 1;
    const isToday = dateStr === todayStr;

    // Filter jobs discovered on this date
    const jobsDiscovered = jobs.filter((j) => {
      if (!j.discoveredAt) return false;
      return j.discoveredAt.slice(0, 10) === dateStr;
    }).length;

    // Filter applications saved on this date
    const jobsSaved = applications.filter((a) => {
      if (!a.savedAt) return false;
      return a.savedAt.slice(0, 10) === dateStr;
    }).length;

    // Filter applications submitted on this date
    const applicationsSubmitted = applications.filter((a) => {
      if (!a.appliedAt) return false;
      return a.appliedAt.slice(0, 10) === dateStr;
    }).length;

    // Filter follow-ups completed on this date
    // (application was updated on this date and has no nextFollowUpAt or nextFollowUp was cleared)
    const followUpsCompleted = applications.filter((a) => {
      if (!a.lastActivityAt || a.lastActivityAt.slice(0, 10) !== dateStr) return false;
      return !a.nextFollowUpAt && a.status !== "SAVED" && a.status !== "DISCOVERED";
    }).length;

    // Filter applications progressed on this date
    const applicationsProgressed = applications.filter((a) => {
      if (!a.updatedAt || a.updatedAt.slice(0, 10) !== dateStr) return false;
      return [
        "SCREENING",
        "TECHNICAL",
        "FINAL",
        "OFFER",
        "REJECTED",
        "WITHDRAWN",
      ].includes(a.status);
    }).length;

    buckets.push({
      date: dateStr,
      dayNumber,
      isToday,
      jobsDiscovered,
      jobsSaved,
      applicationsSubmitted,
      followUpsCompleted,
      applicationsProgressed,
    });
  }

  return buckets;
}

/**
 * Aggregates daily activity buckets into 9 weekly buckets (Weeks 1 to 9).
 * Handles the final partial week (approx 4 days) correctly for a 60-day period.
 */
export function calculateWeeklyActivity(
  dailyBuckets: DailyActivityBucket[],
  settings: SearchPeriodSettings,
  nowIso?: string
): WeeklyActivityBucket[] {
  const now = nowIso ? new Date(nowIso) : new Date();
  const todayStr = now.toISOString().slice(0, 10);

  const weeklyBuckets: WeeklyActivityBucket[] = [];
  const totalDays = dailyBuckets.length;
  const daysPerWeek = 7;
  const numWeeks = Math.ceil(totalDays / daysPerWeek);

  for (let w = 0; w < numWeeks; w++) {
    const weekNumber = w + 1;
    const startIndex = w * daysPerWeek;
    const endIndex = Math.min(totalDays, startIndex + daysPerWeek);
    const chunk = dailyBuckets.slice(startIndex, endIndex);

    if (chunk.length === 0) continue;

    const startDate = chunk[0].date;
    const endDate = chunk[chunk.length - 1].date;
    const isCurrent = todayStr >= startDate && todayStr <= endDate;

    let jobsDiscovered = 0;
    let jobsSaved = 0;
    let applicationsSubmitted = 0;
    let followUpsCompleted = 0;
    let applicationsProgressed = 0;

    for (const d of chunk) {
      jobsDiscovered += d.jobsDiscovered;
      jobsSaved += d.jobsSaved;
      applicationsSubmitted += d.applicationsSubmitted;
      followUpsCompleted += d.followUpsCompleted;
      applicationsProgressed += d.applicationsProgressed;
    }

    weeklyBuckets.push({
      weekNumber,
      label: `Week ${weekNumber}${chunk.length < 7 ? " (Final)" : ""}`,
      startDate,
      endDate,
      daysCount: chunk.length,
      isCurrent,
      jobsDiscovered,
      jobsSaved,
      applicationsSubmitted,
      followUpsCompleted,
      applicationsProgressed,
    });
  }

  return weeklyBuckets;
}

/**
 * Computes today's execution snapshot.
 */
export function calculateTodayMetrics(
  jobs: Job[],
  applications: Application[],
  nowIso?: string
): TodayMetrics {
  const now = nowIso ? new Date(nowIso) : new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const todayStartIso = `${todayStr}T00:00:00.000Z`;

  const newRelevantJobs = jobs.filter((j) => {
    const isRelevant =
      j.careerFit === "HIGH_RELEVANCE" || j.careerFit === "RELEVANT";
    const isToday = j.discoveredAt?.startsWith(todayStr) || j.freshness === "FRESH";
    return isRelevant && isToday;
  }).length;

  const priorityOpportunities = jobs.filter(
    (j) =>
      j.opportunityPriority === "PRIORITY" &&
      j.status !== "APPLIED" &&
      j.status !== "IGNORED"
  ).length;

  const savedNotApplied = applications.filter((a) => a.status === "SAVED").length;

  const applicationsSubmittedToday = applications.filter(
    (a) => a.appliedAt && a.appliedAt.startsWith(todayStr)
  ).length;

  const followUpsDue = applications.filter((a) =>
    isFollowUpDue(a, now.toISOString())
  ).length;

  const overdueFollowUps = applications.filter((a) => {
    return (
      a.nextFollowUpAt &&
      a.nextFollowUpAt < todayStartIso &&
      isFollowUpDue(a, now.toISOString())
    );
  }).length;

  const applicationsProgressedToday = applications.filter((a) => {
    return (
      a.updatedAt &&
      a.updatedAt.startsWith(todayStr) &&
      a.status !== "SAVED" &&
      a.status !== "DISCOVERED"
    );
  }).length;

  return {
    newRelevantJobs,
    priorityOpportunities,
    savedNotApplied,
    applicationsSubmittedToday,
    followUpsDue,
    overdueFollowUps,
    applicationsProgressedToday,
  };
}

/**
 * Computes deterministic daily actions based strictly on real application and job state.
 */
export function calculateDailyActions(
  jobs: Job[],
  applications: Application[],
  settings: SearchPeriodSettings,
  nowIso?: string
): DailyAction[] {
  const now = nowIso ? new Date(nowIso) : new Date();
  const inactiveCutoff = new Date(
    now.getTime() - settings.inactiveThresholdDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const actions: DailyAction[] = [];

  // 1. Follow-ups Due
  const followUps = applications.filter((a) => isFollowUpDue(a, now.toISOString()));
  if (followUps.length > 0) {
    actions.push({
      id: "action-follow-ups",
      title: "Complete Due Follow-ups",
      description: `${followUps.length} application(s) have follow-ups due or overdue. Take action to keep recruiter momentum.`,
      count: followUps.length,
      actionUrl: "/applications?filter=NEEDS_FOLLOW_UP",
      badgeType: "urgent",
      priorityOrder: 1,
    });
  }

  // 2. Priority Opportunities
  const priorityJobs = jobs.filter(
    (j) =>
      j.opportunityPriority === "PRIORITY" &&
      j.status !== "APPLIED" &&
      j.status !== "IGNORED"
  );
  if (priorityJobs.length > 0) {
    actions.push({
      id: "action-priority-jobs",
      title: "Review Priority Opportunities",
      description: `${priorityJobs.length} high-fit fresh role(s) ready for review and application.`,
      count: priorityJobs.length,
      actionUrl: "/jobs?priority=PRIORITY",
      badgeType: "attention",
      priorityOrder: 2,
    });
  }

  // 3. Saved Jobs Awaiting Application
  const savedApps = applications.filter((a) => a.status === "SAVED");
  if (savedApps.length > 0) {
    actions.push({
      id: "action-saved-jobs",
      title: "Apply to Saved Jobs",
      description: `${savedApps.length} saved role(s) waiting for application submission.`,
      count: savedApps.length,
      actionUrl: "/applications?stage=SAVED",
      badgeType: "attention",
      priorityOrder: 3,
    });
  }

  // 4. Inactive Applications Needing Attention
  const inactiveApps = applications.filter((a) => {
    const isActive = ["APPLIED", "SCREENING", "TECHNICAL", "FINAL"].includes(a.status);
    return isActive && a.lastActivityAt && a.lastActivityAt < inactiveCutoff;
  });
  if (inactiveApps.length > 0) {
    actions.push({
      id: "action-inactive-apps",
      title: "Review Inactive Applications",
      description: `${inactiveApps.length} application(s) have had no activity for over ${settings.inactiveThresholdDays} days. Consider sending a follow-up or updating status.`,
      count: inactiveApps.length,
      actionUrl: "/applications?inactive=true",
      badgeType: "info",
      priorityOrder: 4,
    });
  }

  // 5. Fresh Market Scan recommendation if no other urgent items
  if (actions.length === 0) {
    actions.push({
      id: "action-scan-market",
      title: "Scan Market Radar",
      description:
        "All active items are up to date! Explore new job market postings or trigger a live feed sync.",
      count: jobs.length,
      actionUrl: "/jobs",
      badgeType: "neutral",
      priorityOrder: 5,
    });
  }

  return actions.sort((a, b) => a.priorityOrder - b.priorityOrder);
}

/**
 * Computes search health metrics.
 */
export function calculateSearchHealth(
  jobs: Job[],
  applications: Application[],
  inactiveThresholdDays = 7,
  nowIso?: string
): SearchHealthMetrics {
  const now = nowIso ? new Date(nowIso) : new Date();
  const inactiveCutoff = new Date(
    now.getTime() - inactiveThresholdDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const relevantOpportunitiesDiscovered = jobs.filter(
    (j) => j.careerFit === "HIGH_RELEVANCE" || j.careerFit === "RELEVANT"
  ).length;

  const saved = applications.filter((a) => a.status === "SAVED").length;
  const applied = applications.filter((a) => a.status === "APPLIED").length;

  const awaitingResponse = applications.filter(
    (a) =>
      a.status === "APPLIED" &&
      (!a.interviewDates || a.interviewDates.length === 0)
  ).length;

  const screenings = applications.filter((a) => a.status === "SCREENING").length;
  const technical = applications.filter((a) => a.status === "TECHNICAL").length;
  const finalStages = applications.filter((a) => a.status === "FINAL").length;
  const offers = applications.filter((a) => a.status === "OFFER").length;

  const followUpsDue = applications.filter((a) =>
    isFollowUpDue(a, now.toISOString())
  ).length;

  const savedNotApplied = saved;

  const appliedNoRecentActivity = applications.filter((a) => {
    const isActive = ["APPLIED", "SCREENING", "TECHNICAL", "FINAL"].includes(a.status);
    return isActive && a.lastActivityAt && a.lastActivityAt < inactiveCutoff;
  }).length;

  const applicationsWithUpcomingFollowUp = applications.filter((a) => {
    return a.nextFollowUpAt && a.nextFollowUpAt > now.toISOString();
  }).length;

  return {
    relevantOpportunitiesDiscovered,
    saved,
    applied,
    awaitingResponse,
    screenings,
    technical,
    finalStages,
    offers,
    followUpsDue,
    savedNotApplied,
    appliedNoRecentActivity,
    applicationsWithUpcomingFollowUp,
  };
}

/**
 * Computes factual target role distribution counts across existing career domains and work arrangements.
 */
export function calculateTargetRoleDistribution(jobs: Job[]): TargetRoleDistribution {
  const targetDomains: Array<{ domain: CareerDomain; label: string }> = [
    { domain: "FRONTEND", label: "Frontend Architecture" },
    { domain: "DIGITAL_EXPERIENCE", label: "Digital Experience" },
    { domain: "CMS", label: "CMS / Headless" },
    { domain: "COMMERCE", label: "Commerce" },
    { domain: "ENTERPRISE_INTEGRATION", label: "Enterprise Integration" },
    { domain: "SOLUTIONS_ARCHITECTURE", label: "Solutions Architecture" },
    { domain: "TECHNICAL_ARCHITECTURE", label: "Technical Architecture" },
    { domain: "CLIENT_CONSULTING", label: "Client Consulting" },
    { domain: "PROFESSIONAL_SERVICES", label: "Professional Services" },
    { domain: "SOFTWARE_ENGINEERING", label: "Software Engineering" },
  ];

  const domains = targetDomains.map((td) => {
    const count = jobs.filter((j) => {
      return (
        j.domains?.includes(td.domain) ||
        j.domainMatches?.some((dm) => dm.matched && dm.domain === td.domain)
      );
    }).length;

    return {
      domain: td.domain,
      label: td.label,
      count,
    };
  });

  const internationalTravel = jobs.filter(
    (j) => j.travel?.type === "INTERNATIONAL_TRAVEL"
  ).length;
  const clientSiteTravel = jobs.filter(
    (j) => j.travel?.type === "CLIENT_SITE_TRAVEL"
  ).length;
  const remoteGlobal = jobs.filter(
    (j) =>
      j.travel?.type === "REMOTE_GLOBAL" ||
      j.normalizedLocation === "REMOTE_GLOBAL" ||
      (j.remoteType === "REMOTE" &&
        (j.location?.toLowerCase().includes("global") ||
          j.location?.toLowerCase().includes("worldwide")))
  ).length;

  return {
    domains,
    workArrangements: {
      internationalTravel,
      clientSiteTravel,
      remoteGlobal,
    },
  };
}

/**
 * Computes Market Activity metrics reusing canonical Market Radar calculations.
 */
export function calculateMarketActivity(jobs: Job[]): MarketActivityMetrics {
  let highCareerFit = 0;
  let relevant = 0;
  let possible = 0;
  let fresh = 0;
  let recent = 0;
  let hyderabad = 0;
  let india = 0;
  let remoteIndia = 0;
  let globalRemote = 0;
  let internationalTravel = 0;
  let clientSiteTravel = 0;

  for (const j of jobs) {
    const fit = j.careerFit || j.match?.relevanceBucket;
    if (fit === "HIGH_RELEVANCE") highCareerFit++;
    else if (fit === "RELEVANT") relevant++;
    else if (fit === "POSSIBLE") possible++;

    if (j.freshness === "FRESH") fresh++;
    else if (j.freshness === "RECENT") recent++;

    if (j.normalizedLocation === "HYDERABAD") hyderabad++;
    if (j.isIndiaEligible) india++;

    if (j.normalizedLocation === "REMOTE_INDIA" || (j.remoteType === "REMOTE" && j.isIndiaEligible)) {
      remoteIndia++;
    }

    if (
      j.travel?.type === "REMOTE_GLOBAL" ||
      j.normalizedLocation === "REMOTE_GLOBAL" ||
      (j.remoteType === "REMOTE" &&
        (j.location?.toLowerCase().includes("global") ||
          j.location?.toLowerCase().includes("worldwide")))
    ) {
      globalRemote++;
    }

    if (j.travel?.type === "INTERNATIONAL_TRAVEL") internationalTravel++;
    if (j.travel?.type === "CLIENT_SITE_TRAVEL") clientSiteTravel++;
  }

  return {
    totalJobs: jobs.length,
    highCareerFit,
    relevant,
    possible,
    fresh,
    recent,
    hyderabad,
    india,
    remoteIndia,
    globalRemote,
    internationalTravel,
    clientSiteTravel,
  };
}
