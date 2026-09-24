import test from "node:test";
import assert from "node:assert/strict";
import type { Application, Job } from "../types/index.ts";
import {
  _clearApplicationsForTest,
  applyToJobAsApplication,
  calculateApplicationFunnelMetrics,
  createApplication,
  deleteApplication,
  getApplicationById,
  getApplicationForJob,
  getApplications,
  isFollowUpDue,
  markFollowUpDone,
  saveJobAsApplication,
  updateApplication,
  updateApplicationStatus,
} from "../lib/applicationStore.ts";

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-test-1",
    title: "Senior Frontend Architect",
    normalizedTitle: "Senior Frontend Architect",
    company: "Acme Corp",
    normalizedCompany: "Acme Corp",
    location: "Hyderabad, India",
    rawLocation: "Hyderabad, India",
    normalizedLocation: "HYDERABAD",
    remoteType: "HYBRID",
    isIndiaEligible: true,
    salaryState: "SALARY_CONFIRMED",
    salaryDisclosed: true,
    salaryLpaMin: 40,
    salaryLpaMax: 50,
    currency: "INR",
    seniority: "ARCHITECT",
    experienceMin: 12,
    experienceMax: 16,
    skills: ["React", "TypeScript", "Next.js"],
    actualJobTechnologies: ["React", "TypeScript", "Next.js"],
    matchedTargetTechnologies: ["React", "TypeScript", "Next.js"],
    technologyMatchDetails: [],
    roleFamily: "FRONTEND_ARCHITECT",
    domains: ["FRONTEND"],
    domainMatches: [],
    travel: {
      type: "NO_TRAVEL_MENTIONED",
      destinations: [],
      evidence: "",
    },
    description: "Architect high performance digital experience",
    source: "greenhouse",
    url: "https://careers.acme.com/jobs/1",
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
      reasons: ["✓ Direct match for Frontend Architect"],
      whyThisFits: ["✓ Matches target role Frontend Architect"],
      cautions: [],
      potentialGaps: [],
      domainMatches: [],
      dimensions: {} as unknown as Job["match"]["dimensions"],
      breakdown: {} as unknown as Job["match"]["breakdown"],
    },
    ...overrides,
  };
}

test("ApplicationStore: create and get application", () => {
  _clearApplicationsForTest();

  const app = createApplication({
    jobId: "job-101",
    status: "SAVED",
    notes: "Interesting lead",
  });

  assert.ok(app.id.startsWith("app-"));
  assert.strictEqual(app.jobId, "job-101");
  assert.strictEqual(app.status, "SAVED");
  assert.ok(app.createdAt);
  assert.ok(app.updatedAt);
  assert.ok(app.savedAt);
  assert.strictEqual(app.notes, "Interesting lead");

  const fetchedById = getApplicationById(app.id);
  assert.deepStrictEqual(fetchedById, app);

  const fetchedByJob = getApplicationForJob("job-101");
  assert.deepStrictEqual(fetchedByJob, app);
});

test("ApplicationStore: duplicate protection prevents multiple applications for same job", () => {
  _clearApplicationsForTest();

  const app1 = createApplication({
    jobId: "job-duplicate-test",
    status: "SAVED",
  });

  const app2 = createApplication({
    jobId: "job-duplicate-test",
    status: "APPLIED",
  });

  assert.strictEqual(app1.id, app2.id);
  const all = getApplications();
  assert.strictEqual(all.length, 1);
});

test("ApplicationStore: update application fields", () => {
  _clearApplicationsForTest();

  const app = createApplication({
    jobId: "job-update-test",
    status: "SAVED",
  });

  const updated = updateApplication(app.id, {
    recruiterName: "Jane Doe",
    recruiterEmail: "jane@company.com",
    salaryExpected: 4500000,
    resumeVersion: "v2.1-Principal-Architect",
    notes: "Spoke with recruiter on LinkedIn",
  });

  assert.ok(updated);
  assert.strictEqual(updated.recruiterName, "Jane Doe");
  assert.strictEqual(updated.recruiterEmail, "jane@company.com");
  assert.strictEqual(updated.salaryExpected, 4500000);
  assert.strictEqual(updated.resumeVersion, "v2.1-Principal-Architect");
  assert.strictEqual(updated.notes, "Spoke with recruiter on LinkedIn");
});

test("ApplicationStore: saveJobAsApplication creates SAVED application and avoids duplicates", () => {
  _clearApplicationsForTest();

  const mockJob = createMockJob({ id: "job-save-test" });

  const app1 = saveJobAsApplication(mockJob);
  assert.strictEqual(app1.status, "SAVED");
  assert.strictEqual(app1.jobId, "job-save-test");
  assert.ok(app1.savedAt);

  const app2 = saveJobAsApplication(mockJob);
  assert.strictEqual(app1.id, app2.id);
  assert.strictEqual(getApplications().length, 1);
});

test("ApplicationStore: applyToJobAsApplication marks as APPLIED with timestamps", () => {
  _clearApplicationsForTest();

  const mockJob = createMockJob({ id: "job-apply-test" });

  // First apply directly
  const app = applyToJobAsApplication(mockJob);
  assert.strictEqual(app.status, "APPLIED");
  assert.ok(app.appliedAt);
  assert.ok(app.lastActivityAt);

  // Calling again on same job preserves id
  const appRepeat = applyToJobAsApplication(mockJob);
  assert.strictEqual(app.id, appRepeat.id);
  assert.strictEqual(appRepeat.status, "APPLIED");
});

test("ApplicationStore: status transitions and stage-specific dates", () => {
  _clearApplicationsForTest();

  const app = createApplication({
    jobId: "job-transition-test",
    status: "SAVED",
  });

  // SAVED -> APPLIED
  const res1 = updateApplicationStatus(app.id, "APPLIED");
  assert.ok(res1.success);
  assert.strictEqual(res1.application?.status, "APPLIED");
  assert.ok(res1.application?.appliedAt);

  // APPLIED -> SCREENING
  const res2 = updateApplicationStatus(app.id, "SCREENING");
  assert.ok(res2.success);
  assert.strictEqual(res2.application?.status, "SCREENING");

  // SCREENING -> TECHNICAL
  const res3 = updateApplicationStatus(app.id, "TECHNICAL");
  assert.ok(res3.success);
  assert.strictEqual(res3.application?.status, "TECHNICAL");

  // TECHNICAL -> FINAL
  const res4 = updateApplicationStatus(app.id, "FINAL");
  assert.ok(res4.success);
  assert.strictEqual(res4.application?.status, "FINAL");

  // FINAL -> OFFER
  const res5 = updateApplicationStatus(app.id, "OFFER");
  assert.ok(res5.success);
  assert.strictEqual(res5.application?.status, "OFFER");
});

test("ApplicationStore: transition to terminal states with reason", () => {
  _clearApplicationsForTest();

  const app1 = createApplication({ jobId: "job-rej-test", status: "SCREENING" });
  const rejRes = updateApplicationStatus(app1.id, "REJECTED", {
    rejectionReason: "Position filled internally",
  });
  assert.ok(rejRes.success);
  assert.strictEqual(rejRes.application?.status, "REJECTED");
  assert.strictEqual(rejRes.application?.rejectionReason, "Position filled internally");

  const app2 = createApplication({ jobId: "job-with-test", status: "TECHNICAL" });
  const withRes = updateApplicationStatus(app2.id, "WITHDRAWN", {
    withdrawalReason: "Accepted another offer",
  });
  assert.ok(withRes.success);
  assert.strictEqual(withRes.application?.status, "WITHDRAWN");
  assert.strictEqual(withRes.application?.withdrawalReason, "Accepted another offer");

  const app3 = createApplication({ jobId: "job-ign-test", status: "SAVED" });
  const ignRes = updateApplicationStatus(app3.id, "IGNORED");
  assert.ok(ignRes.success);
  assert.strictEqual(ignRes.application?.status, "IGNORED");
});

test("ApplicationStore: reopening rejected or ignored application", () => {
  _clearApplicationsForTest();

  const app = createApplication({
    jobId: "job-reopen-test",
    status: "REJECTED",
    rejectionReason: "Role paused",
  });

  // Reopen rejected back to APPLIED or SCREENING
  const reopened = updateApplicationStatus(app.id, "SCREENING");
  assert.ok(reopened.success);
  assert.strictEqual(reopened.application?.status, "SCREENING");

  // Move to IGNORED then reopen to SAVED
  updateApplicationStatus(app.id, "IGNORED");
  const reopenedFromIgnored = updateApplicationStatus(app.id, "SAVED");
  assert.ok(reopenedFromIgnored.success);
  assert.strictEqual(reopenedFromIgnored.application?.status, "SAVED");
});

test("ApplicationStore: invalid transitions handling", () => {
  _clearApplicationsForTest();

  const res = updateApplicationStatus("non-existent-app-id", "APPLIED");
  assert.strictEqual(res.success, false);
  assert.strictEqual(res.error, "Application not found");
});

test("ApplicationStore: follow-up due calculation and mark follow-up done", () => {
  const pastIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const futureIso = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

  const overdueApp: Application = {
    id: "app-overdue",
    jobId: "job-o1",
    status: "APPLIED",
    createdAt: pastIso,
    updatedAt: pastIso,
    lastActivityAt: pastIso,
    nextFollowUpAt: pastIso,
  };

  const futureApp: Application = {
    id: "app-future",
    jobId: "job-f1",
    status: "SCREENING",
    createdAt: pastIso,
    updatedAt: pastIso,
    lastActivityAt: pastIso,
    nextFollowUpAt: futureIso,
  };

  const terminalOverdueApp: Application = {
    id: "app-term",
    jobId: "job-t1",
    status: "REJECTED",
    createdAt: pastIso,
    updatedAt: pastIso,
    lastActivityAt: pastIso,
    nextFollowUpAt: pastIso,
  };

  assert.strictEqual(isFollowUpDue(overdueApp), true);
  assert.strictEqual(isFollowUpDue(futureApp), false);
  assert.strictEqual(isFollowUpDue(terminalOverdueApp), false);

  // Test markFollowUpDone
  _clearApplicationsForTest();
  createApplication({
    id: "app-done-test",
    jobId: "job-dt",
    status: "APPLIED",
    nextFollowUpAt: pastIso,
  });

  const marked = markFollowUpDone("app-done-test");
  assert.ok(marked);
  assert.strictEqual(marked.nextFollowUpAt, undefined);
  assert.strictEqual(isFollowUpDue(marked), false);
});

test("ApplicationStore: delete application", () => {
  _clearApplicationsForTest();

  const app = createApplication({ jobId: "job-del-test", status: "SAVED" });
  assert.ok(getApplicationById(app.id));

  const deleted = deleteApplication(app.id);
  assert.strictEqual(deleted, true);
  assert.strictEqual(getApplicationById(app.id), undefined);

  // Deleting again returns false
  assert.strictEqual(deleteApplication(app.id), false);
});

test("ApplicationStore: conversion metrics calculation", () => {
  const dummyNow = "2026-09-01T00:00:00.000Z";
  const testApps: Application[] = [
    { id: "a1", jobId: "j1", status: "SAVED", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a2", jobId: "j2", status: "SAVED", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a3", jobId: "j3", status: "APPLIED", appliedAt: "2026-09-01", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a4", jobId: "j4", status: "SCREENING", appliedAt: "2026-09-02", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a5", jobId: "j5", status: "SCREENING", appliedAt: "2026-09-03", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a6", jobId: "j6", status: "TECHNICAL", appliedAt: "2026-09-04", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a7", jobId: "j7", status: "FINAL", appliedAt: "2026-09-05", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a8", jobId: "j8", status: "OFFER", appliedAt: "2026-09-06", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a9", jobId: "j9", status: "REJECTED", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    { id: "a10", jobId: "j10", status: "WITHDRAWN", createdAt: dummyNow, updatedAt: dummyNow, lastActivityAt: dummyNow },
    {
      id: "a11",
      jobId: "j11",
      status: "APPLIED",
      createdAt: dummyNow,
      updatedAt: dummyNow,
      lastActivityAt: dummyNow,
      nextFollowUpAt: "2026-01-01T00:00:00.000Z",
    },
  ];

  const metrics = calculateApplicationFunnelMetrics(testApps, "2026-09-24T00:00:00.000Z");

  assert.strictEqual(metrics.totalApplications, 11);
  assert.strictEqual(metrics.saved, 2);
  assert.strictEqual(metrics.applied, 2); // a3 + a11
  assert.strictEqual(metrics.screening, 2); // a4 + a5
  assert.strictEqual(metrics.technical, 1); // a6
  assert.strictEqual(metrics.final, 1); // a7
  assert.strictEqual(metrics.offers, 1); // a8
  assert.strictEqual(metrics.rejected, 1); // a9
  assert.strictEqual(metrics.withdrawn, 1); // a10
  assert.strictEqual(metrics.followUpsDue, 1); // a11

  // Funnel reach:
  // Applied reach = a3, a4, a5, a6, a7, a8, a11 = 7
  // Screening reach = a4, a5, a6, a7, a8 = 5 => 5/7 = 71%
  assert.strictEqual(metrics.appliedToScreeningConversion, 71);

  // Technical reach = a6, a7, a8 = 3 => 3/5 = 60%
  assert.strictEqual(metrics.screeningToTechnicalConversion, 60);

  // Final reach = a7, a8 = 2 => 2/3 = 67%
  assert.strictEqual(metrics.technicalToFinalConversion, 67);

  // Offer reach = a8 = 1 => 1/2 = 50%
  assert.strictEqual(metrics.finalToOfferConversion, 50);
});

test("ApplicationStore: conversion metrics handles empty or zero counts gracefully", () => {
  const metrics = calculateApplicationFunnelMetrics([]);

  assert.strictEqual(metrics.totalApplications, 0);
  assert.strictEqual(metrics.saved, 0);
  assert.strictEqual(metrics.applied, 0);
  assert.strictEqual(metrics.appliedToScreeningConversion, null);
  assert.strictEqual(metrics.screeningToTechnicalConversion, null);
  assert.strictEqual(metrics.technicalToFinalConversion, null);
  assert.strictEqual(metrics.finalToOfferConversion, null);
});
