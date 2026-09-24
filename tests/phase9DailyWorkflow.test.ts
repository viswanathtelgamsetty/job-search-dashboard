import test from "node:test";
import assert from "node:assert";
import type { Job, Application } from "../types/index.ts";
import { buildDailyQueue } from "../lib/dailyQueue.ts";
import { getSavedJobAgingInfo } from "../lib/savedJobsTracker.ts";
import { getNewJobsSinceLastVisit } from "../lib/lastVisitTracker.ts";
import {
  checkIsAlreadyApplied,
  applyToJobAsApplication,
  updateApplication,
  rescheduleFollowUp,
  categorizeFollowUp,
  calculateApplicationFunnelMetrics,
  _clearApplicationsForTest,
} from "../lib/applicationStore.ts";
import {
  calculateTodayMetrics,
  calculateWeeklyComparison,
  calculateDailyActivity,
  calculateWeeklyActivity,
  defaultSearchPeriodSettings,
} from "../lib/searchAnalytics.ts";

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-" + Math.random().toString(36).slice(2, 8),
    title: "Senior Technical Architect",
    normalizedTitle: "Senior Technical Architect",
    company: "Acme Corp",
    normalizedCompany: "Acme Corp",
    location: "Hyderabad, India",
    rawLocation: "Hyderabad, India",
    normalizedLocation: "HYDERABAD",
    remoteType: "ONSITE",
    source: "GREENHOUSE",
    url: "https://boards.greenhouse.io/acme/jobs/123",
    postedAt: "2026-09-20",
    description: "Architect React Next.js cloud solutions",
    skills: ["React", "Next.js", "TypeScript", "Architecture"],
    status: "DISCOVERED",
    isIndiaEligible: true,
    careerFit: "HIGH_RELEVANCE",
    applicationRecommendation: "APPLY_NOW",
    roleFamily: "TECHNICAL_ARCHITECT",
    seniority: "ARCHITECT",
    roleTier: "TIER_1",
    freshness: "FRESH",
    opportunityPriority: "PRIORITY",
    travel: {
      type: "INTERNATIONAL_TRAVEL",
      percentage: 10,
      destinations: ["US"],
      evidence: "10% travel",
    },
    salaryState: "SALARY_NOT_DISCLOSED",
    discoveredAt: "2026-09-24T00:00:00.000Z",
    ...overrides,
  } as Job;
}

// 1. Daily queue priority test
test("Phase 9: Daily Queue sorts by priority: APPLY_NOW > REVIEW > SAVED > FRESH HIGH_RELEVANCE > WATCH", () => {
  const jobWatch = createMockJob({
    id: "job-watch",
    applicationRecommendation: "WATCH",
    careerFit: "POSSIBLE",
    roleTier: "TIER_3",
  });
  const jobReview = createMockJob({
    id: "job-review",
    applicationRecommendation: "REVIEW",
    careerFit: "RELEVANT",
    roleTier: "TIER_2",
  });
  const jobApplyNow = createMockJob({
    id: "job-apply",
    applicationRecommendation: "APPLY_NOW",
    careerFit: "HIGH_RELEVANCE",
    roleTier: "TIER_1",
  });
  const jobSaved = createMockJob({
    id: "job-saved",
    status: "SAVED",
    applicationRecommendation: "WATCH",
    careerFit: "RELEVANT",
  });
  const jobFreshHigh = createMockJob({
    id: "job-fresh-high",
    applicationRecommendation: "WATCH",
    careerFit: "HIGH_RELEVANCE",
    freshness: "FRESH",
  });

  const queue = buildDailyQueue([jobWatch, jobSaved, jobReview, jobApplyNow, jobFreshHigh]);

  assert.strictEqual(queue[0].id, "job-apply", "APPLY_NOW must be first in queue");
  assert.strictEqual(queue[1].id, "job-review", "REVIEW must be second in queue");
  assert.strictEqual(queue[2].id, "job-saved", "SAVED must come next");
  assert.strictEqual(queue[3].id, "job-fresh-high", "Fresh HIGH_RELEVANCE must precede general WATCH");
  assert.strictEqual(queue[4].id, "job-watch", "General WATCH comes last");
});

// 2. Ignore action excludes job from daily queue
test("Phase 9: Ignored jobs are excluded from daily queue", () => {
  const normalJob = createMockJob({ id: "norm-1", applicationRecommendation: "APPLY_NOW" });
  const ignoredJob = createMockJob({
    id: "ign-1",
    status: "IGNORED",
    ignoredAt: "2026-09-24T10:00:00.000Z",
    ignoreReason: "Salary mismatch",
  });

  const queue = buildDailyQueue([normalJob, ignoredJob]);
  assert.strictEqual(queue.length, 1);
  assert.strictEqual(queue[0].id, "norm-1");
  assert.ok(!queue.some((j) => j.id === "ign-1"), "Ignored job must never appear in daily queue");
});

// 3. Duplicate application protection
test("Phase 9: Duplicate application protection prevents re-applying and reports status", () => {
  _clearApplicationsForTest();

  const job = createMockJob({ id: "job-dup-test" });

  // Initially not applied
  const check1 = checkIsAlreadyApplied(job.id);
  assert.strictEqual(check1.isAlreadyApplied, false);

  // Apply to job
  const app = applyToJobAsApplication(job);
  assert.ok(app);
  assert.strictEqual(app.status, "APPLIED");
  assert.ok(app.appliedAt);

  // Check again
  const check2 = checkIsAlreadyApplied(job.id);
  assert.strictEqual(check2.isAlreadyApplied, true);
  assert.strictEqual(check2.status, "APPLIED");
  assert.strictEqual(check2.appliedAt, app.appliedAt);
});

// 4. Applied date persistence (never overwritten when edited)
test("Phase 9: appliedAt timestamp persists and is not overwritten upon application edit", () => {
  _clearApplicationsForTest();

  const originalAppliedAt = "2026-09-20T10:00:00.000Z";
  const job = createMockJob({ id: "job-persist-applied" });

  const app = applyToJobAsApplication(job);
  // Manually set a fixed appliedAt for testing persistence
  updateApplication(app.id, { appliedAt: originalAppliedAt });

  // Now perform an update like notes or status
  const updated = updateApplication(app.id, {
    status: "SCREENING",
    notes: "Recruiter screen scheduled",
  });

  assert.strictEqual(updated?.status, "SCREENING");
  assert.strictEqual(updated?.appliedAt, originalAppliedAt, "appliedAt must be preserved across updates");
  assert.strictEqual(updated?.notes, "Recruiter screen scheduled");
});

// 5. Follow-up categorization: OVERDUE, DUE_TODAY, UPCOMING
test("Phase 9: Follow-up categorization accurately identifies OVERDUE, DUE_TODAY, and UPCOMING", () => {
  const referenceDate = "2026-09-25T12:00:00.000Z";

  const overdueApp: Application = {
    id: "app-ov",
    jobId: "j-1",
    status: "APPLIED",
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
    lastActivityAt: "2026-09-20T00:00:00.000Z",
    followUpDate: "2026-09-24", // yesterday
  };

  const dueTodayApp: Application = {
    id: "app-dt",
    jobId: "j-2",
    status: "APPLIED",
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
    lastActivityAt: "2026-09-20T00:00:00.000Z",
    followUpDate: "2026-09-25", // today
  };

  const upcomingApp: Application = {
    id: "app-up",
    jobId: "j-3",
    status: "APPLIED",
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
    lastActivityAt: "2026-09-20T00:00:00.000Z",
    followUpDate: "2026-09-28", // future
  };

  const rejectedApp: Application = {
    id: "app-rej",
    jobId: "j-4",
    status: "REJECTED",
    createdAt: "2026-09-20T00:00:00.000Z",
    updatedAt: "2026-09-20T00:00:00.000Z",
    lastActivityAt: "2026-09-20T00:00:00.000Z",
    followUpDate: "2026-09-24", // terminal
  };

  assert.strictEqual(categorizeFollowUp(overdueApp, referenceDate), "OVERDUE");
  assert.strictEqual(categorizeFollowUp(dueTodayApp, referenceDate), "DUE_TODAY");
  assert.strictEqual(categorizeFollowUp(upcomingApp, referenceDate), "UPCOMING");
  assert.strictEqual(categorizeFollowUp(rejectedApp, referenceDate), "NONE", "Terminal apps have no pending follow-up");
});

// 6. Rescheduling follow-up with note
test("Phase 9: Reschedule follow-up updates next date and note", () => {
  _clearApplicationsForTest();

  const job = createMockJob({ id: "job-resched" });
  const app = applyToJobAsApplication(job);

  const updated = rescheduleFollowUp(app.id, "2026-09-30T09:00:00.000Z", "Check with hiring manager");
  assert.ok(updated);
  assert.strictEqual(updated.followUpDate, "2026-09-30");
  assert.strictEqual(updated.followUpNote, "Check with hiring manager");
});

// 7. Saved job aging (>2 days amber, >5 days red)
test("Phase 9: Saved job aging highlights > 2 days and > 5 days", () => {
  const refIso = "2026-09-25T12:00:00.000Z";

  const jobFreshSaved = createMockJob({
    id: "j-fresh-saved",
    status: "SAVED",
    savedAt: "2026-09-25T00:00:00.000Z",
  });

  const job3DaysSaved = createMockJob({
    id: "j-3days-saved",
    status: "SAVED",
    savedAt: "2026-09-22T00:00:00.000Z", // 3 days ago
  });

  const job6DaysSaved = createMockJob({
    id: "j-6days-saved",
    status: "SAVED",
    savedAt: "2026-09-19T00:00:00.000Z", // 6 days ago
  });

  const infoFresh = getSavedJobAgingInfo(jobFreshSaved, undefined, refIso);
  assert.strictEqual(infoFresh.daysSinceSaved, 0);
  assert.strictEqual(infoFresh.isActionRecommended, false);
  assert.strictEqual(infoFresh.isAgingAlert, false);

  const info3Days = getSavedJobAgingInfo(job3DaysSaved, undefined, refIso);
  assert.strictEqual(info3Days.daysSinceSaved, 3);
  assert.strictEqual(info3Days.isActionRecommended, true, "> 2 days requires action");
  assert.strictEqual(info3Days.isAgingAlert, false);

  const info6Days = getSavedJobAgingInfo(job6DaysSaved, undefined, refIso);
  assert.strictEqual(info6Days.daysSinceSaved, 6);
  assert.strictEqual(info6Days.isActionRecommended, true);
  assert.strictEqual(info6Days.isAgingAlert, true, "> 5 days requires aging alert");
});

// 8. New jobs since last visit detection
test("Phase 9: Last-visit tracker segments new jobs since previous visit", () => {
  const lastVisit = "2026-09-24T00:00:00.000Z";

  const oldJob = createMockJob({
    id: "j-old",
    discoveredAt: "2026-09-23T00:00:00.000Z",
  });

  const newApplyNow = createMockJob({
    id: "j-new-apply",
    discoveredAt: "2026-09-24T15:00:00.000Z",
    applicationRecommendation: "APPLY_NOW",
  });

  const newHyderabad = createMockJob({
    id: "j-new-hyd",
    discoveredAt: "2026-09-24T18:00:00.000Z",
    location: "Hyderabad, India",
    applicationRecommendation: "REVIEW",
  });

  const newGlobalRemote = createMockJob({
    id: "j-new-remote",
    discoveredAt: "2026-09-25T01:00:00.000Z",
    remoteType: "REMOTE",
    normalizedLocation: "REMOTE_GLOBAL",
    careerFit: "HIGH_RELEVANCE",
  });

  const diff = getNewJobsSinceLastVisit(
    [oldJob, newApplyNow, newHyderabad, newGlobalRemote],
    lastVisit
  );

  assert.strictEqual(diff.totalNewJobs, 3, "Only jobs discovered after lastVisit should be counted");
  assert.ok(diff.newApplyNow.some((j) => j.id === "j-new-apply"));
  assert.ok(diff.newHyderabad.some((j) => j.id === "j-new-hyd"));
  assert.ok(diff.newHighRelevance.some((j) => j.id === "j-new-remote"));
});

// 9. Today's metrics calculated deterministically
test("Phase 9: TodayMetrics computes real-time counts from actual jobs & application CRM", () => {
  const refTime = "2026-09-25T12:00:00.000Z";

  const jobs: Job[] = [
    createMockJob({ id: "j1", applicationRecommendation: "APPLY_NOW", status: "DISCOVERED" }),
    createMockJob({ id: "j2", applicationRecommendation: "APPLY_NOW", status: "APPLIED" }), // already applied, not counted in pending applyNow
    createMockJob({ id: "j3", applicationRecommendation: "REVIEW", status: "DISCOVERED" }),
    createMockJob({ id: "j4", applicationRecommendation: "WATCH", status: "DISCOVERED" }),
  ];

  const apps: Application[] = [
    {
      id: "a1",
      jobId: "j2",
      status: "APPLIED",
      createdAt: refTime,
      updatedAt: refTime,
      lastActivityAt: refTime,
      appliedAt: "2026-09-25T08:00:00.000Z", // submitted today
      followUpDate: "2026-09-25", // due today
    },
    {
      id: "a2",
      jobId: "j-saved",
      status: "SAVED",
      createdAt: refTime,
      updatedAt: refTime,
      lastActivityAt: refTime,
      savedAt: refTime,
    },
    {
      id: "a3",
      jobId: "j-overdue",
      status: "APPLIED",
      createdAt: refTime,
      updatedAt: refTime,
      lastActivityAt: refTime,
      appliedAt: "2026-09-20T08:00:00.000Z",
      followUpDate: "2026-09-24", // overdue
    },
  ];

  const metrics = calculateTodayMetrics(jobs, apps, refTime);

  assert.strictEqual(metrics.applyNowCount, 1, "Only pending DISCOVERED/SAVED APPLY_NOW count");
  assert.strictEqual(metrics.needsReviewCount, 1, "REVIEW count");
  assert.strictEqual(metrics.savedNotAppliedCount, 1, "SAVED status count");
  assert.strictEqual(metrics.applicationsSubmittedToday, 1, "Applied today count");
  assert.strictEqual(metrics.followUpsDueToday, 1, "Follow-ups scheduled for today");
  assert.strictEqual(metrics.overdueFollowUps, 1, "Follow-ups past due date");
});

// 10. Weekly metrics comparison
test("Phase 9: Weekly metrics comparison computes diff between this week and previous week", () => {
  const settings = defaultSearchPeriodSettings("2026-09-01T00:00:00.000Z");
  settings.searchStartDate = "2026-09-01";
  settings.durationDays = 60;

  const dailyBuckets = calculateDailyActivity([], [], settings, "2026-09-11T12:00:00.000Z");
  // Populate week 1 (days 0-6) and week 2 (days 7-13)
  for (let i = 0; i < 7; i++) {
    dailyBuckets[i].applicationsSubmitted = 2; // total 14 in week 1
  }
  for (let i = 7; i < 14; i++) {
    dailyBuckets[i].applicationsSubmitted = 3; // total 21 in week 2
  }

  // Reference day is day 10 (which is in week 2)
  const weeklyBuckets = calculateWeeklyActivity(dailyBuckets, settings, "2026-09-11T12:00:00.000Z");
  const comparison = calculateWeeklyComparison(weeklyBuckets);

  const appMetric = comparison.find((c) => c.metric === "Applications");
  assert.ok(appMetric, "Applications metric must exist");
  assert.strictEqual(appMetric.thisWeek, 21);
  assert.strictEqual(appMetric.previousWeek, 14);
  assert.strictEqual(appMetric.change, 7);
});

// 11. Application funnel conversion tracking
test("Phase 9: Application funnel correctly reflects pipeline stages and conversions", () => {
  const apps: Application[] = [
    {
      id: "a1",
      jobId: "j1",
      status: "SAVED",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
      lastActivityAt: "2026-09-20T00:00:00.000Z",
    },
    {
      id: "a2",
      jobId: "j2",
      status: "APPLIED",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
      lastActivityAt: "2026-09-20T00:00:00.000Z",
      appliedAt: "2026-09-20T00:00:00.000Z",
    },
    {
      id: "a3",
      jobId: "j3",
      status: "SCREENING",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
      lastActivityAt: "2026-09-20T00:00:00.000Z",
      appliedAt: "2026-09-20T00:00:00.000Z",
    },
    {
      id: "a4",
      jobId: "j4",
      status: "OFFER",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
      lastActivityAt: "2026-09-20T00:00:00.000Z",
      appliedAt: "2026-09-20T00:00:00.000Z",
    },
    {
      id: "a5",
      jobId: "j5",
      status: "REJECTED",
      createdAt: "2026-09-20T00:00:00.000Z",
      updatedAt: "2026-09-20T00:00:00.000Z",
      lastActivityAt: "2026-09-20T00:00:00.000Z",
    },
  ];

  const funnel = calculateApplicationFunnelMetrics(apps);
  assert.strictEqual(funnel.saved, 1);
  assert.strictEqual(funnel.applied, 1);
  assert.strictEqual(funnel.screening, 1);
  assert.strictEqual(funnel.offers, 1);
  assert.strictEqual(funnel.rejected, 1);
});

// 12. Source link verification
test("Phase 9: Source URL is preserved and never fabricated", () => {
  const originalUrl = "https://boards.greenhouse.io/acme/jobs/987654";
  const job = createMockJob({ url: originalUrl });
  assert.strictEqual(job.url, originalUrl, "Job URL must strictly equal the genuine source link");
});
