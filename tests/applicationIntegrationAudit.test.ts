import test from "node:test";
import assert from "node:assert/strict";
import type { Application, ApplicationStatus, Job } from "../types/index.ts";
import {
  _clearApplicationsForTest,
  applyToJobAsApplication,
  createApplication,
  getApplicationById,
  getApplicationForJob,
  getApplications,
  isFollowUpDue,
  markFollowUpDone,
  saveJobAsApplication,
  updateApplication,
  updateApplicationStatus,
} from "../lib/applicationStore.ts";
import { deduplicateJobs } from "../lib/deduplication.ts";

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-audit-1",
    title: "Senior Technical Lead - Frontend",
    normalizedTitle: "Senior Technical Lead - Frontend",
    company: "Acme Enterprise",
    normalizedCompany: "Acme Enterprise",
    location: "Hyderabad, India",
    rawLocation: "Hyderabad, India",
    normalizedLocation: "HYDERABAD",
    remoteType: "HYBRID",
    isIndiaEligible: true,
    salaryState: "SALARY_CONFIRMED",
    salaryDisclosed: true,
    salaryLpaMin: 42,
    salaryLpaMax: 55,
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
    domainMatches: [],
    travel: {
      type: "NO_TRAVEL_MENTIONED",
      destinations: [],
      evidence: "",
    },
    description: "Lead enterprise frontend digital experience",
    source: "greenhouse",
    url: "https://careers.acme.com/jobs/audit-1",
    discoveredAt: "2026-09-24T10:00:00.000Z",
    updatedAt: "2026-09-24T10:00:00.000Z",
    freshness: "FRESH",
    postedDaysAgo: 1,
    status: "DISCOVERED",
    isDemo: false,
    careerFit: "HIGH_RELEVANCE",
    opportunityPriority: "PRIORITY",
    opportunityPriorityReasons: ["Strong career fit", "Recently posted"],
    match: {
      relevanceBucket: "HIGH_RELEVANCE",
      careerFit: "HIGH_RELEVANCE",
      reasons: ["✓ Direct match for Technical Lead"],
      whyThisFits: ["✓ Matches target role Technical Lead"],
      cautions: [],
      potentialGaps: [],
      domainMatches: [],
      dimensions: {} as unknown as Job["match"]["dimensions"],
      breakdown: {} as unknown as Job["match"]["breakdown"],
    },
    ...overrides,
  };
}

// 1. Save -> Application created
test("Audit 1: Save -> Application created with complete timestamps", () => {
  _clearApplicationsForTest();
  const job = createMockJob({ id: "job-audit-save-1" });

  const app = saveJobAsApplication(job);

  assert.ok(app.id.startsWith("app-"), "Application ID must be prefixed with app-");
  assert.strictEqual(app.jobId, job.id, "jobId must match canonical job id");
  assert.strictEqual(app.status, "SAVED", "status must be SAVED");
  assert.ok(app.savedAt, "savedAt must be populated");
  assert.ok(app.createdAt, "createdAt must be populated");
  assert.ok(app.updatedAt, "updatedAt must be populated");
  assert.ok(app.lastActivityAt, "lastActivityAt must be populated");

  const apps = getApplications();
  assert.strictEqual(apps.length, 1, "Exactly one application must exist in store");
  assert.strictEqual(apps[0].id, app.id);
});

// 2. Save twice -> one application
test("Audit 2: Save twice -> exactly one application (idempotency)", () => {
  _clearApplicationsForTest();
  const job = createMockJob({ id: "job-audit-save-twice" });

  const appFirst = saveJobAsApplication(job);
  const appSecond = saveJobAsApplication(job);

  assert.strictEqual(appFirst.id, appSecond.id, "Second save must return the existing application");
  const apps = getApplications();
  assert.strictEqual(apps.length, 1, "Repeated save calls must never create duplicate applications");
});

// 3. Save -> Apply -> same application
test("Audit 3: Save -> Apply transitions to APPLIED and retains application identity", () => {
  _clearApplicationsForTest();
  const job = createMockJob({ id: "job-audit-save-apply" });

  const savedApp = saveJobAsApplication(job);
  assert.strictEqual(savedApp.status, "SAVED");

  const appliedApp = applyToJobAsApplication(job);
  assert.strictEqual(appliedApp.id, savedApp.id, "Application ID must be preserved");
  assert.strictEqual(appliedApp.status, "APPLIED", "Status must transition to APPLIED");
  assert.ok(appliedApp.appliedAt, "appliedAt must be populated");
  assert.ok(appliedApp.lastActivityAt, "lastActivityAt must be populated");

  const allApps = getApplications();
  assert.strictEqual(allApps.length, 1, "Must remain exactly one application");
});

// 4. Apply twice -> one application & does not downgrade later stages
test("Audit 4: Apply twice -> one application, and never downgrades advanced stages", () => {
  _clearApplicationsForTest();
  const job = createMockJob({ id: "job-audit-apply-twice" });

  const app1 = applyToJobAsApplication(job);
  const originalAppliedAt = app1.appliedAt;
  assert.strictEqual(app1.status, "APPLIED");

  // Second apply call
  const app2 = applyToJobAsApplication(job);
  assert.strictEqual(app1.id, app2.id);
  assert.strictEqual(app2.status, "APPLIED");
  assert.strictEqual(app2.appliedAt, originalAppliedAt, "appliedAt must not be overwritten");
  assert.strictEqual(getApplications().length, 1);

  // Advance application to SCREENING then to TECHNICAL
  updateApplicationStatus(app1.id, "SCREENING");
  updateApplicationStatus(app1.id, "TECHNICAL");
  const currentApp = getApplicationById(app1.id);
  assert.strictEqual(currentApp?.status, "TECHNICAL");

  // User clicks Apply again on same job
  const appAfterTech = applyToJobAsApplication(job);
  assert.strictEqual(appAfterTech.id, app1.id);
  assert.strictEqual(
    appAfterTech.status,
    "TECHNICAL",
    "Apply action must not downgrade or reset status when application is already in TECHNICAL"
  );
  assert.strictEqual(getApplications().length, 1);
});

// 5. Application status update -> Market Radar reflects status
test("Audit 5: Application status update -> Market Radar reflects status for all stages and outcomes", () => {
  _clearApplicationsForTest();
  const job = createMockJob({ id: "job-audit-radar-status" });
  const app = saveJobAsApplication(job);

  const statusesToTest: ApplicationStatus[] = [
    "SAVED",
    "APPLIED",
    "SCREENING",
    "TECHNICAL",
    "FINAL",
    "OFFER",
    "REJECTED",
    "WITHDRAWN",
    "IGNORED",
  ];

  for (const targetStatus of statusesToTest) {
    const res = updateApplicationStatus(app.id, targetStatus);
    assert.ok(res.success, `Transition to ${targetStatus} must succeed`);

    // Verify lookup by job reflects updated status for Market Radar
    const radarApp = getApplicationForJob(job.id);
    assert.ok(radarApp, "Radar must retrieve application for job");
    assert.strictEqual(radarApp?.status, targetStatus, `Radar must reflect status ${targetStatus}`);
  }

  // Reopening from IGNORED or REJECTED
  const reopenRes = updateApplicationStatus(app.id, "SCREENING");
  assert.ok(reopenRes.success, "Reopening to SCREENING must succeed");
  assert.strictEqual(getApplicationForJob(job.id)?.status, "SCREENING");
});

// 6. Live sync -> application remains linked
test("Audit 6: Live sync deduplication preserves existing canonical job ID and application linkage", () => {
  _clearApplicationsForTest();
  const canonicalJob = createMockJob({
    id: "canonical-job-12345",
    title: "Digital Experience Lead",
    company: "Global Tech Inc",
    url: "https://careers.globaltech.com/jobs/12345",
    status: "SAVED",
  });

  // User saved the canonical job
  const app = saveJobAsApplication(canonicalJob);
  assert.strictEqual(app.jobId, "canonical-job-12345");

  // Live ingestion runs again and discovers the same job posting under a fresh temporary ID
  const redisoveredJob = createMockJob({
    id: "fresh-ingest-temp-id-99999",
    title: "Digital Experience Lead",
    company: "Global Tech Inc",
    url: "https://careers.globaltech.com/jobs/12345",
    status: "DISCOVERED",
  });

  // JobIngestionService combines existing canonical jobs with newly discovered jobs
  const combined = [canonicalJob, redisoveredJob];
  const deduplicated = deduplicateJobs(combined);

  assert.strictEqual(deduplicated.length, 1, "Must deduplicate down to 1 job");
  const mergedJob = deduplicated[0];

  assert.strictEqual(
    mergedJob.id,
    "canonical-job-12345",
    "Canonical job ID must be preserved to prevent link churn"
  );
  assert.strictEqual(
    mergedJob.status,
    "SAVED",
    "Canonical saved status must not be reverted to DISCOVERED"
  );

  // Application lookup for the canonical job must remain intact
  const linkedApp = getApplicationForJob(mergedJob.id);
  assert.ok(linkedApp, "Application must remain linked to canonical job");
  assert.strictEqual(linkedApp?.id, app.id);
  assert.strictEqual(linkedApp?.jobId, mergedJob.id);
});

// 7. Follow-up due -> indicator appears
test("Audit 7: Follow-up due calculation correctly flags overdue active applications", () => {
  const pastIso = new Date(Date.now() - 3600 * 1000).toISOString();
  const futureIso = new Date(Date.now() + 3600 * 1000).toISOString();

  const activeOverdueApp: Application = {
    id: "app-audit-due",
    jobId: "job-due-1",
    status: "APPLIED",
    createdAt: pastIso,
    updatedAt: pastIso,
    lastActivityAt: pastIso,
    nextFollowUpAt: pastIso,
  };

  const activeFutureApp: Application = {
    id: "app-audit-future",
    jobId: "job-due-2",
    status: "APPLIED",
    createdAt: pastIso,
    updatedAt: pastIso,
    lastActivityAt: pastIso,
    nextFollowUpAt: futureIso,
  };

  const terminalOverdueApp: Application = {
    id: "app-audit-term",
    jobId: "job-due-3",
    status: "REJECTED",
    createdAt: pastIso,
    updatedAt: pastIso,
    lastActivityAt: pastIso,
    nextFollowUpAt: pastIso,
  };

  assert.strictEqual(isFollowUpDue(activeOverdueApp), true, "Active overdue must flag as due");
  assert.strictEqual(isFollowUpDue(activeFutureApp), false, "Future follow-up must not flag as due");
  assert.strictEqual(
    isFollowUpDue(terminalOverdueApp),
    false,
    "Terminal applications (e.g. REJECTED) must not flag follow-up due"
  );
});

// 8. Follow-up done -> indicator disappears
test("Audit 8: Follow-up done clears nextFollowUpAt and updates lastActivityAt", () => {
  _clearApplicationsForTest();
  const pastIso = new Date(Date.now() - 86400 * 1000).toISOString();
  const app = createApplication({
    jobId: "job-audit-done",
    status: "APPLIED",
    nextFollowUpAt: pastIso,
  });

  assert.strictEqual(isFollowUpDue(app), true);

  const doneApp = markFollowUpDone(app.id);
  assert.ok(doneApp, "markFollowUpDone must return updated application");
  assert.strictEqual(doneApp.nextFollowUpAt, undefined, "nextFollowUpAt must be cleared");
  assert.strictEqual(isFollowUpDue(doneApp), false, "Follow-up due indicator must disappear");
  assert.ok(
    new Date(doneApp.lastActivityAt).getTime() > new Date(pastIso).getTime(),
    "lastActivityAt must be updated"
  );
});

// 9. Application field edit -> persists
test("Audit 9: All 14 application CRM fields can be edited and persisted accurately", () => {
  _clearApplicationsForTest();
  const app = createApplication({
    jobId: "job-audit-all-fields",
    status: "SCREENING",
  });

  const interviewDate = "2026-10-05T14:00:00.000Z";
  const nextFollowUp = "2026-10-06T10:00:00.000Z";

  const updated = updateApplication(app.id, {
    resumeVersion: "v3.2-Enterprise-Architect",
    coverLetterUsed: "Custom lead architect pitch emphasizing CMS/Commerce scale",
    referral: true,
    referralName: "Senior Director of Engineering",
    recruiterName: "Sarah Connor",
    recruiterEmail: "sarah.connor@sky.net",
    recruiterLinkedIn: "https://linkedin.com/in/sarah-connor-talent",
    salaryExpected: 4800000,
    salaryOffered: 5200000,
    noticePeriodDiscussed: "30 days",
    interviewDates: [interviewDate],
    notes: "First screening round went very well. High interest in Contentful migration experience.",
    nextFollowUpAt: nextFollowUp,
    rejectionReason: undefined,
    withdrawalReason: undefined,
  });

  assert.ok(updated);
  assert.strictEqual(updated.resumeVersion, "v3.2-Enterprise-Architect");
  assert.strictEqual(
    updated.coverLetterUsed,
    "Custom lead architect pitch emphasizing CMS/Commerce scale"
  );
  assert.strictEqual(updated.referral, true);
  assert.strictEqual(updated.referralName, "Senior Director of Engineering");
  assert.strictEqual(updated.recruiterName, "Sarah Connor");
  assert.strictEqual(updated.recruiterEmail, "sarah.connor@sky.net");
  assert.strictEqual(updated.recruiterLinkedIn, "https://linkedin.com/in/sarah-connor-talent");
  assert.strictEqual(updated.salaryExpected, 4800000);
  assert.strictEqual(updated.salaryOffered, 5200000);
  assert.strictEqual(updated.noticePeriodDiscussed, "30 days");
  assert.deepStrictEqual(updated.interviewDates, [interviewDate]);
  assert.strictEqual(
    updated.notes,
    "First screening round went very well. High interest in Contentful migration experience."
  );
  assert.strictEqual(updated.nextFollowUpAt, nextFollowUp);

  // Fetch again from store to verify persistence
  const fetched = getApplicationById(app.id);
  assert.deepStrictEqual(fetched, updated);
});

// 10. Page reload -> application persists (localStorage simulation)
test("Audit 10: Page reload persistence via storage simulation preserves records", () => {
  _clearApplicationsForTest();

  // Create an in-memory mock storage
  const mockStorage: Record<string, string> = {};
  const mockLocalStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => {
      mockStorage[key] = String(val);
    },
    removeItem: (key: string) => {
      delete mockStorage[key];
    },
    clear: () => {
      for (const k of Object.keys(mockStorage)) delete mockStorage[k];
    },
  };

  const g = globalThis as unknown as Record<string, unknown>;
  const origWindow = g.window;
  const origLocalStorage = g.localStorage;

  g.window = {
    localStorage: mockLocalStorage,
    dispatchEvent: () => true,
  };
  g.localStorage = mockLocalStorage;

  try {
    const job = createMockJob({ id: "job-audit-reload" });
    const app = saveJobAsApplication(job);
    updateApplication(app.id, {
      recruiterName: "Alex Mercer",
      notes: "Saved before reload test",
    });

    // Verify localStorage has persisted JSON under APPLICATIONS_STORAGE_KEY
    const storageKey = "job-market-radar:applications:v1";
    const storedRaw = mockLocalStorage.getItem(storageKey);
    assert.ok(storedRaw, "Applications must be written to localStorage key");
    const parsed = JSON.parse(storedRaw);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].recruiterName, "Alex Mercer");

    // Simulate page reload: getApplications reads from mockLocalStorage
    const reloaded = getApplications();
    assert.strictEqual(reloaded.length, 1);
    assert.strictEqual(reloaded[0].id, app.id);
    assert.strictEqual(reloaded[0].recruiterName, "Alex Mercer");
    assert.strictEqual(reloaded[0].notes, "Saved before reload test");
  } finally {
    g.window = origWindow;
    g.localStorage = origLocalStorage;
    _clearApplicationsForTest();
  }
});
