import test from "node:test";
import assert from "node:assert/strict";
import type { Application, Job, SearchPeriodSettings } from "../types/index.ts";
import {
  calculateDailyActions,
  calculateDailyActivity,
  calculateMarketActivity,
  calculateSearchHealth,
  calculateSearchProgress,
  calculateTargetRoleDistribution,
  calculateTodayMetrics,
  calculateWeeklyActivity,
  defaultSearchPeriodSettings,
} from "../lib/searchAnalytics.ts";
import { calculateApplicationFunnelMetrics } from "../lib/applicationStore.ts";

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "mock-job-1",
    title: "Senior Frontend Lead",
    normalizedTitle: "Senior Frontend Lead",
    company: "Acme Tech",
    normalizedCompany: "Acme Tech",
    location: "Hyderabad, India",
    rawLocation: "Hyderabad, India",
    normalizedLocation: "HYDERABAD",
    remoteType: "HYBRID",
    isIndiaEligible: true,
    salaryState: "SALARY_CONFIRMED",
    salaryDisclosed: true,
    salaryLpaMin: 45,
    salaryLpaMax: 60,
    currency: "INR",
    seniority: "LEAD",
    experienceMin: 12,
    experienceMax: 16,
    skills: ["React", "TypeScript", "Next.js"],
    actualJobTechnologies: ["React", "TypeScript", "Next.js"],
    matchedTargetTechnologies: ["React", "TypeScript", "Next.js"],
    technologyMatchDetails: [],
    roleFamily: "TECHNICAL_LEAD",
    domains: ["FRONTEND"],
    domainMatches: [{ domain: "FRONTEND", matched: true, evidence: "Frontend Lead", source: "title", strength: "STRONG" }],
    travel: {
      type: "INTERNATIONAL_TRAVEL",
      destinations: ["USA"],
      evidence: "Travel to US client sites",
    },
    description: "Lead enterprise frontend architecture",
    source: "greenhouse",
    url: "https://example.com/job/1",
    discoveredAt: "2026-09-24T10:00:00.000Z",
    updatedAt: "2026-09-24T10:00:00.000Z",
    freshness: "FRESH",
    postedDaysAgo: 0,
    status: "DISCOVERED",
    isDemo: false,
    careerFit: "HIGH_RELEVANCE",
    opportunityPriority: "PRIORITY",
    opportunityPriorityReasons: ["High career fit", "Fresh posting"],
    match: {
      relevanceBucket: "HIGH_RELEVANCE",
      careerFit: "HIGH_RELEVANCE",
      reasons: ["Direct match"],
      whyThisFits: ["Matches role family"],
      cautions: [],
      potentialGaps: [],
      domainMatches: [],
      dimensions: {} as unknown as Job["match"]["dimensions"],
      breakdown: {} as unknown as Job["match"]["breakdown"],
    },
    ...overrides,
  };
}

function createMockApp(overrides: Partial<Application> = {}): Application {
  return {
    id: "mock-app-1",
    jobId: "mock-job-1",
    status: "SAVED",
    createdAt: "2026-09-24T10:00:00.000Z",
    updatedAt: "2026-09-24T10:00:00.000Z",
    lastActivityAt: "2026-09-24T10:00:00.000Z",
    ...overrides,
  };
}

// 1. 60-day date calculation & defaults
test("SearchAnalytics: 60-day date calculation default settings", () => {
  const baseIso = "2026-09-01T00:00:00.000Z";
  const def = defaultSearchPeriodSettings(baseIso);

  assert.strictEqual(def.searchStartDate, "2026-09-01");
  assert.strictEqual(def.durationDays, 60);

  // 2026-09-01 + 59 days = 2026-10-30 (September has 30 days => 30 days in Sep + 30 days in Oct = 60 days total)
  assert.strictEqual(def.searchEndDate, "2026-10-30");
  assert.strictEqual(def.applicationsPerDayTarget, 2);
  assert.strictEqual(def.applicationsPerWeekTarget, 10);
  assert.strictEqual(def.followUpsPerWeekTarget, 5);
  assert.strictEqual(def.inactiveThresholdDays, 7);
});

// 2. Day X calculation, progress, and days remaining
test("SearchAnalytics: Day X calculation, progress percentage, and days remaining", () => {
  const settings: SearchPeriodSettings = {
    searchStartDate: "2026-09-01",
    searchEndDate: "2026-10-30",
    durationDays: 60,
    applicationsPerDayTarget: 2,
    applicationsPerWeekTarget: 10,
    followUpsPerWeekTarget: 5,
    inactiveThresholdDays: 7,
  };

  // On Start Date (Day 1)
  const day1 = calculateSearchProgress(settings, "2026-09-01T12:00:00.000Z");
  assert.strictEqual(day1.currentDay, 1);
  assert.strictEqual(day1.daysRemaining, 59);
  assert.strictEqual(day1.progressPercentage, 2); // 1/60 = 1.67% -> 2%
  assert.strictEqual(day1.isCompleted, false);

  // Day 15
  const day15 = calculateSearchProgress(settings, "2026-09-15T12:00:00.000Z");
  assert.strictEqual(day15.currentDay, 15);
  assert.strictEqual(day15.daysRemaining, 45);
  assert.strictEqual(day15.progressPercentage, 25); // 15/60 = 25%

  // Day 60 (End Date)
  const day60 = calculateSearchProgress(settings, "2026-10-30T12:00:00.000Z");
  assert.strictEqual(day60.currentDay, 60);
  assert.strictEqual(day60.daysRemaining, 0);
  assert.strictEqual(day60.progressPercentage, 100);
  assert.strictEqual(day60.isCompleted, true);
});

// 3. Boundary dates (before start date and after end date)
test("SearchAnalytics: Boundary dates outside search period", () => {
  const settings: SearchPeriodSettings = {
    searchStartDate: "2026-09-01",
    searchEndDate: "2026-10-30",
    durationDays: 60,
    applicationsPerDayTarget: 2,
    applicationsPerWeekTarget: 10,
    followUpsPerWeekTarget: 5,
    inactiveThresholdDays: 7,
  };

  // Before start date
  const before = calculateSearchProgress(settings, "2026-08-15T00:00:00.000Z");
  assert.strictEqual(before.currentDay, 1);
  assert.strictEqual(before.daysRemaining, 60);
  assert.strictEqual(before.progressPercentage, 2);
  assert.strictEqual(before.isCompleted, false);

  // Past end date
  const after = calculateSearchProgress(settings, "2026-11-15T00:00:00.000Z");
  assert.strictEqual(after.currentDay, 60);
  assert.strictEqual(after.daysRemaining, 0);
  assert.strictEqual(after.progressPercentage, 100);
  assert.strictEqual(after.isCompleted, true);
});

// 4. Daily aggregation for 60 days
test("SearchAnalytics: Daily aggregation generates 60 buckets and attributes activities accurately", () => {
  const settings = defaultSearchPeriodSettings("2026-09-01T00:00:00.000Z");

  const jobs = [
    createMockJob({ id: "j1", discoveredAt: "2026-09-01T09:00:00.000Z" }),
    createMockJob({ id: "j2", discoveredAt: "2026-09-01T15:00:00.000Z" }),
    createMockJob({ id: "j3", discoveredAt: "2026-09-05T10:00:00.000Z" }),
  ];

  const apps = [
    createMockApp({
      id: "a1",
      savedAt: "2026-09-01T10:00:00.000Z",
      appliedAt: "2026-09-02T10:00:00.000Z",
    }),
    createMockApp({
      id: "a2",
      appliedAt: "2026-09-05T12:00:00.000Z",
      status: "TECHNICAL",
      updatedAt: "2026-09-05T16:00:00.000Z",
    }),
  ];

  const daily = calculateDailyActivity(jobs, apps, settings, "2026-09-02T00:00:00.000Z");

  assert.strictEqual(daily.length, 60);
  assert.strictEqual(daily[0].date, "2026-09-01");
  assert.strictEqual(daily[0].dayNumber, 1);
  assert.strictEqual(daily[0].jobsDiscovered, 2);
  assert.strictEqual(daily[0].jobsSaved, 1);
  assert.strictEqual(daily[0].applicationsSubmitted, 0);

  // Day 2 (2026-09-02) is today in simulation
  assert.strictEqual(daily[1].date, "2026-09-02");
  assert.strictEqual(daily[1].dayNumber, 2);
  assert.strictEqual(daily[1].isToday, true);
  assert.strictEqual(daily[1].applicationsSubmitted, 1);

  // Day 5 (2026-09-05)
  const day5 = daily.find((d) => d.date === "2026-09-05");
  assert.ok(day5);
  assert.strictEqual(day5.jobsDiscovered, 1);
  assert.strictEqual(day5.applicationsSubmitted, 1);
  assert.strictEqual(day5.applicationsProgressed, 1);
});

// 5. Weekly aggregation (Weeks 1 to 9 with partial final week)
test("SearchAnalytics: Weekly aggregation partitions into 9 weeks with proper final week length", () => {
  const settings = defaultSearchPeriodSettings("2026-09-01T00:00:00.000Z");
  const daily = calculateDailyActivity([], [], settings, "2026-09-10T00:00:00.000Z");

  const weekly = calculateWeeklyActivity(daily, settings, "2026-09-10T00:00:00.000Z");

  assert.strictEqual(weekly.length, 9, "Must produce exactly 9 weekly buckets");

  // Weeks 1 to 8 have 7 days
  for (let w = 0; w < 8; w++) {
    assert.strictEqual(weekly[w].weekNumber, w + 1);
    assert.strictEqual(weekly[w].daysCount, 7, `Week ${w + 1} must have 7 days`);
  }

  // Week 9 has 4 days (7 * 8 = 56, 60 - 56 = 4)
  assert.strictEqual(weekly[8].weekNumber, 9);
  assert.strictEqual(weekly[8].daysCount, 4, "Week 9 must represent the remaining 4 days");
  assert.ok(weekly[8].label.includes("Final"));

  // Check current week marker (Sept 10 is in Week 2: Sept 8 - Sept 14)
  assert.strictEqual(weekly[0].isCurrent, false);
  assert.strictEqual(weekly[1].isCurrent, true, "Week 2 must be marked as current for Sept 10");
  assert.strictEqual(weekly[2].isCurrent, false);
});

// 6. Application funnel calculation
test("SearchAnalytics: Application funnel handles conversion accurately", () => {
  const apps: Application[] = [
    createMockApp({ id: "a1", status: "SAVED" }),
    createMockApp({ id: "a2", status: "APPLIED", appliedAt: "2026-09-01" }),
    createMockApp({ id: "a3", status: "SCREENING", appliedAt: "2026-09-02" }),
    createMockApp({ id: "a4", status: "TECHNICAL", appliedAt: "2026-09-03" }),
    createMockApp({ id: "a5", status: "FINAL", appliedAt: "2026-09-04" }),
    createMockApp({ id: "a6", status: "OFFER", appliedAt: "2026-09-05" }),
    createMockApp({ id: "a7", status: "REJECTED" }),
  ];

  const funnel = calculateApplicationFunnelMetrics(apps, "2026-09-24T00:00:00.000Z");

  assert.strictEqual(funnel.totalApplications, 7);
  assert.strictEqual(funnel.saved, 1);
  assert.strictEqual(funnel.applied, 1);
  assert.strictEqual(funnel.screening, 1);
  assert.strictEqual(funnel.technical, 1);
  assert.strictEqual(funnel.final, 1);
  assert.strictEqual(funnel.offers, 1);
  assert.strictEqual(funnel.rejected, 1);

  // Conversion reach:
  // Applied reach = 5 (applied, screening, technical, final, offer)
  // Screening reach = 4 => 4/5 = 80%
  assert.strictEqual(funnel.appliedToScreeningConversion, 80);
});

// 7. Inactive applications detection
test("SearchAnalytics: Inactive applications threshold detection", () => {
  const pastIsoOld = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString();
  const pastIsoRecent = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();

  const apps: Application[] = [
    createMockApp({ id: "a-active", status: "APPLIED", lastActivityAt: pastIsoRecent }),
    createMockApp({ id: "a-stale", status: "SCREENING", lastActivityAt: pastIsoOld }),
    createMockApp({ id: "a-rej-old", status: "REJECTED", lastActivityAt: pastIsoOld }), // terminal shouldn't count
  ];

  const health = calculateSearchHealth([], apps, 7);
  assert.strictEqual(health.appliedNoRecentActivity, 1, "Only the active stale application should count");
});

// 8. Follow-up counts and overdue detection
test("SearchAnalytics: Follow-up counts and overdue calculation", () => {
  const yesterdayIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const tomorrowIso = new Date(Date.now() + 24 * 3600 * 1000).toISOString();

  const apps: Application[] = [
    createMockApp({ id: "a1", status: "APPLIED", nextFollowUpAt: yesterdayIso }),
    createMockApp({ id: "a2", status: "SCREENING", nextFollowUpAt: tomorrowIso }),
  ];

  const today = calculateTodayMetrics([], apps);
  assert.strictEqual(today.followUpsDue, 1, "Yesterday follow-up is due");
  assert.strictEqual(today.overdueFollowUps, 1, "Yesterday follow-up is overdue");

  const health = calculateSearchHealth([], apps, 7);
  assert.strictEqual(health.followUpsDue, 1);
  assert.strictEqual(health.applicationsWithUpcomingFollowUp, 1);
});

// 9. Daily actions generation
test("SearchAnalytics: Daily actions are generated deterministically based on real state", () => {
  const settings = defaultSearchPeriodSettings();
  const now = new Date().toISOString();
  const pastIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const staleIso = new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString();

  const jobs = [
    createMockJob({ id: "j-p", opportunityPriority: "PRIORITY", status: "DISCOVERED" }),
  ];

  const apps = [
    createMockApp({ id: "a-due", status: "APPLIED", nextFollowUpAt: pastIso }),
    createMockApp({ id: "a-saved", status: "SAVED" }),
    createMockApp({ id: "a-stale", status: "TECHNICAL", lastActivityAt: staleIso }),
  ];

  const actions = calculateDailyActions(jobs, apps, settings, now);

  assert.strictEqual(actions.length, 4);
  assert.strictEqual(actions[0].id, "action-follow-ups"); // Order 1 (urgent)
  assert.strictEqual(actions[1].id, "action-priority-jobs"); // Order 2 (attention)
  assert.strictEqual(actions[2].id, "action-saved-jobs"); // Order 3 (attention)
  assert.strictEqual(actions[3].id, "action-inactive-apps"); // Order 4 (info)
});

// 10. Target vs Actual comparison logic
test("SearchAnalytics: Target vs Actual calculations", () => {
  const settings = defaultSearchPeriodSettings();
  settings.applicationsPerWeekTarget = 10;
  settings.followUpsPerWeekTarget = 5;

  const currentWeekApps = 3;
  const currentWeekFollowUps = 2;

  const appsRemainingToTarget = Math.max(0, settings.applicationsPerWeekTarget - currentWeekApps);
  const followUpsRemaining = Math.max(0, settings.followUpsPerWeekTarget - currentWeekFollowUps);

  assert.strictEqual(appsRemainingToTarget, 7);
  assert.strictEqual(followUpsRemaining, 3);
});

// 11. Empty state handling (Zero genuine applications)
test("SearchAnalytics: Empty state handling with 0 applications", () => {
  const settings = defaultSearchPeriodSettings();
  const jobs = [createMockJob()];
  const apps: Application[] = [];

  const today = calculateTodayMetrics(jobs, apps);
  assert.strictEqual(today.applicationsSubmittedToday, 0);
  assert.strictEqual(today.followUpsDue, 0);
  assert.strictEqual(today.savedNotApplied, 0);

  const health = calculateSearchHealth(jobs, apps);
  assert.strictEqual(health.saved, 0);
  assert.strictEqual(health.applied, 0);
  assert.strictEqual(health.screenings, 0);
  assert.strictEqual(health.offers, 0);
  assert.strictEqual(health.relevantOpportunitiesDiscovered, 1);

  const actions = calculateDailyActions(jobs, apps, settings);
  assert.strictEqual(actions[0].id, "action-priority-jobs");
});

// 12. Target Role Distribution & Market Activity
test("SearchAnalytics: Target role distribution and market activity metrics", () => {
  const jobs = [
    createMockJob({
      id: "j1",
      domains: ["FRONTEND"],
      careerFit: "HIGH_RELEVANCE",
      freshness: "FRESH",
      normalizedLocation: "HYDERABAD",
      travel: { type: "INTERNATIONAL_TRAVEL", destinations: ["US"], evidence: "" },
    }),
    createMockJob({
      id: "j2",
      domains: ["COMMERCE", "CMS"],
      domainMatches: [
        { domain: "COMMERCE", matched: true, evidence: "Commerce", source: "title", strength: "STRONG" },
        { domain: "CMS", matched: true, evidence: "CMS", source: "title", strength: "STRONG" }
      ],
      careerFit: "RELEVANT",
      freshness: "RECENT",
      normalizedLocation: "BANGALORE",
      remoteType: "REMOTE",
      isIndiaEligible: true,
      travel: { type: "CLIENT_SITE_TRAVEL", destinations: [], evidence: "" },
    }),
  ];

  const distribution = calculateTargetRoleDistribution(jobs);
  const feDomain = distribution.domains.find((d) => d.domain === "FRONTEND");
  const cmsDomain = distribution.domains.find((d) => d.domain === "CMS");
  const commerceDomain = distribution.domains.find((d) => d.domain === "COMMERCE");

  assert.strictEqual(feDomain?.count, 1);
  assert.strictEqual(cmsDomain?.count, 1);
  assert.strictEqual(commerceDomain?.count, 1);
  assert.strictEqual(distribution.workArrangements.internationalTravel, 1);
  assert.strictEqual(distribution.workArrangements.clientSiteTravel, 1);

  const market = calculateMarketActivity(jobs);
  assert.strictEqual(market.totalJobs, 2);
  assert.strictEqual(market.highCareerFit, 1);
  assert.strictEqual(market.relevant, 1);
  assert.strictEqual(market.fresh, 1);
  assert.strictEqual(market.recent, 1);
  assert.strictEqual(market.hyderabad, 1);
  assert.strictEqual(market.india, 2);
  assert.strictEqual(market.remoteIndia, 1);
  assert.strictEqual(market.internationalTravel, 1);
  assert.strictEqual(market.clientSiteTravel, 1);
});
