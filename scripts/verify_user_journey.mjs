// scripts/verify_user_journey.mjs
import assert from "node:assert/strict";
import {
  applyToJobAsApplication,
  saveJobAsApplication,
  updateApplication,
  rescheduleFollowUp,
  markFollowUpDone,
  categorizeFollowUp,
  calculateApplicationFunnelMetrics,
  _clearApplicationsForTest,
  getApplications,
} from "../lib/applicationStore.ts";
import { calculateTodayMetrics } from "../lib/searchAnalytics.ts";
import { buildDailyQueue } from "../lib/dailyQueue.ts";
import { getSavedJobAgingInfo } from "../lib/savedJobsTracker.ts";

console.log("==================================================");
console.log("PHASE 9 — USER JOURNEY END-TO-END TEST");
console.log("==================================================");

// Step 1: Open dashboard (initialize controlled state)
console.log("Step 1: Open dashboard — initializing clean CRM sandbox state...");
_clearApplicationsForTest();

// Mock an APPLY_NOW job for testing
const testJob = {
  id: "uj-job-apply-now",
  title: "Principal Solutions Architect",
  company: "CloudVibe",
  location: "Hyderabad, India",
  normalizedLocation: "HYDERABAD",
  remoteType: "HYBRID",
  source: "GREENHOUSE",
  url: "https://boards.greenhouse.io/cloudvibe/jobs/8844",
  postedAt: "2026-09-24",
  description: "Lead enterprise frontend architecture with React, Next.js, and headless CMS",
  skills: ["React", "Next.js", "TypeScript", "CMS", "Architecture"],
  status: "DISCOVERED",
  isIndiaEligible: true,
  careerFit: "HIGH_RELEVANCE",
  applicationRecommendation: "APPLY_NOW",
  roleFamily: "SOLUTIONS_ARCHITECT",
  seniority: "ARCHITECT",
  roleTier: "TIER_1",
  freshness: "FRESH",
  opportunityPriority: "PRIORITY",
  travel: {
    type: "INTERNATIONAL_TRAVEL",
    percentage: 15,
    destinations: ["USA", "Europe"],
    evidence: "15% international travel",
  },
  match: {
    relevanceBucket: "HIGH_RELEVANCE",
    careerFit: "HIGH_RELEVANCE",
    applicationRecommendation: "APPLY_NOW",
    overallScore: 95,
    reasons: ["Strong architecture leadership", "Target tech match React/Next.js"],
    whyThisFits: ["Frontend & Solutions Architect alignment"],
    cautions: [],
    potentialGaps: [],
    technologyFit: { fit: "STRONG", evidence: "React, Next.js matched" },
    domainFit: { fit: "STRONG", evidence: "CMS domain matched" },
    architectureFit: { fit: "STRONG", evidence: "Solutions Architect title" },
    clientConsultingFit: { fit: "STRONG", evidence: "Enterprise client delivery" },
    internationalFit: { fit: "STRONG", evidence: "15% international travel" },
    dimensions: {
      technologyScore: 10,
      domainScore: 9,
      architectureScore: 10,
      clientConsultingScore: 9,
      internationalScore: 8,
    },
  },
};

// Step 2: Identify an APPLY_NOW job in daily queue
console.log("Step 2: Identify an APPLY_NOW job in daily queue...");
const queue = buildDailyQueue([testJob]);
assert.equal(queue.length, 1);
assert.equal(queue[0].applicationRecommendation, "APPLY_NOW");
console.log("  ✓ Found APPLY_NOW job:", queue[0].title, "at", queue[0].company);

// Step 3: Open details
console.log("Step 3: Open details modal...");
assert.ok(queue[0].match);
console.log("  ✓ Job details modal loaded with source URL:", queue[0].url);

// Step 4: Verify fit dimensions
console.log("Step 4: Verify fit dimensions...");
assert.equal(queue[0].match.technologyFit.fit, "STRONG");
assert.equal(queue[0].match.domainFit.fit, "STRONG");
assert.equal(queue[0].match.architectureFit.fit, "STRONG");
assert.equal(queue[0].match.clientConsultingFit.fit, "STRONG");
assert.equal(queue[0].match.internationalFit.fit, "STRONG");
console.log("  ✓ Fit dimensions verified: Technology, Domain, Architecture, Client Consulting, International");

// Step 5: Save the job
console.log("Step 5: Save the job...");
testJob.status = "SAVED";
testJob.savedAt = new Date().toISOString();
const savedApp = saveJobAsApplication(testJob);
console.log("  ✓ Saved job as application:", savedApp.id, "Status:", savedApp.status);

// Step 6: Confirm Saved state
console.log("Step 6: Confirm Saved state...");
assert.equal(savedApp.status, "SAVED");
const aging = getSavedJobAgingInfo(testJob, savedApp);
assert.equal(aging.daysSinceSaved, 0);
assert.equal(aging.isActionRecommended, false);
console.log("  ✓ Saved state confirmed, aging status:", aging.agingStatus);

// Step 7: Apply
console.log("Step 7: Apply to job...");
testJob.status = "APPLIED";
const appliedApp = applyToJobAsApplication(testJob);
console.log("  ✓ Applied to job. Application ID:", appliedApp.id);

// Step 8: Confirm application created
console.log("Step 8: Confirm application created...");
assert.ok(appliedApp);
assert.equal(appliedApp.status, "APPLIED");
assert.equal(appliedApp.jobId, testJob.id);
console.log("  ✓ Application verified in CRM");

// Step 9: Confirm appliedAt
console.log("Step 9: Confirm appliedAt recorded...");
assert.ok(appliedApp.appliedAt);
const originalAppliedAt = appliedApp.appliedAt;
console.log("  ✓ appliedAt recorded:", originalAppliedAt);

// Step 10: Add follow-up date
console.log("Step 10: Add follow-up date...");
const todayStr = new Date().toISOString().slice(0, 10);
const updatedWithFollowUp = rescheduleFollowUp(
  appliedApp.id,
  `${todayStr}T10:00:00.000Z`,
  "Check in with hiring manager"
);
assert.ok(updatedWithFollowUp);
console.log("  ✓ Follow-up scheduled for:", updatedWithFollowUp.followUpDate, "Note:", updatedWithFollowUp.followUpNote);

// Step 11: Confirm follow-up appears
console.log("Step 11: Confirm follow-up appears as DUE_TODAY...");
const cat = categorizeFollowUp(updatedWithFollowUp);
assert.equal(cat, "DUE_TODAY");
const todayMetrics1 = calculateTodayMetrics([testJob], [updatedWithFollowUp]);
assert.equal(todayMetrics1.followUpsDueToday, 1);
console.log("  ✓ Follow-up confirmed in Today's Action Center: followUpsDueToday =", todayMetrics1.followUpsDueToday);

// Step 12: Add application note
console.log("Step 12: Add application note...");
const updatedWithNote = updateApplication(appliedApp.id, {
  notes: "Referral submitted by senior director.",
  referralName: "Anita Sharma",
});
assert.equal(updatedWithNote.notes, "Referral submitted by senior director.");
assert.equal(updatedWithNote.referralName, "Anita Sharma");
console.log("  ✓ Notes added to application");

// Step 13: Refresh page (re-query application from store)
console.log("Step 13: Refresh page (reloading applications from CRM store)...");
const appsAfterRefresh = getApplications();
const refreshedApp = appsAfterRefresh.find((a) => a.id === appliedApp.id);
assert.ok(refreshedApp);
console.log("  ✓ Application successfully reloaded from store");

// Step 14: Confirm all state persists
console.log("Step 14: Confirm all state persists...");
assert.equal(refreshedApp.appliedAt, originalAppliedAt, "appliedAt must be preserved");
assert.equal(refreshedApp.followUpDate, todayStr, "followUpDate must be preserved");
assert.equal(refreshedApp.followUpNote, "Check in with hiring manager", "followUpNote must be preserved");
assert.equal(refreshedApp.notes, "Referral submitted by senior director.", "notes must be preserved");
assert.equal(refreshedApp.referralName, "Anita Sharma", "referralName must be preserved");
console.log("  ✓ All state persisted intact across simulated page reload");

// Step 15: Move application to SCREENING
console.log("Step 15: Move application to SCREENING...");
const screenedApp = updateApplication(refreshedApp.id, { status: "SCREENING" });
assert.equal(screenedApp.status, "SCREENING");
console.log("  ✓ Application status transitioned to SCREENING");

// Step 16: Confirm funnel updates
console.log("Step 16: Confirm funnel updates...");
const funnelMetrics = calculateApplicationFunnelMetrics([screenedApp]);
assert.equal(funnelMetrics.screening, 1);
assert.equal(funnelMetrics.appliedToScreeningConversion, 100);
console.log("  ✓ Funnel metrics updated: screening =", funnelMetrics.screening, "Conversion =", funnelMetrics.appliedToScreeningConversion + "%");

// Step 17: Mark follow-up complete
console.log("Step 17: Mark follow-up complete...");
const completedFollowUpApp = markFollowUpDone(screenedApp.id);
assert.equal(completedFollowUpApp.nextFollowUpAt, undefined);
assert.equal(completedFollowUpApp.followUpDate, undefined);
console.log("  ✓ Follow-up marked complete, cleared nextFollowUpAt");

// Step 18: Confirm overdue/due counters update
console.log("Step 18: Confirm overdue/due counters update...");
const todayMetricsFinal = calculateTodayMetrics([testJob], [completedFollowUpApp]);
assert.equal(todayMetricsFinal.followUpsDueToday, 0);
assert.equal(todayMetricsFinal.overdueFollowUps, 0);
console.log("  ✓ Due and Overdue counters updated: followUpsDueToday =", todayMetricsFinal.followUpsDueToday, "overdueFollowUps =", todayMetricsFinal.overdueFollowUps);

// Clean up sandbox
_clearApplicationsForTest();

console.log("\n==================================================");
console.log("ALL 18 USER JOURNEY STEPS PASSED SUCCESSFULLY!");
console.log("==================================================");
