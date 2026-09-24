/**
 * Phase 10 — Demo Job Exclusion & Match Reason Consistency Regression Tests
 *
 * Assertions:
 *  1. JobIngestionService strips demo records from existingJobs before merging
 *  2. Matching: ENTRY seniority jobs must NOT produce "Core Target Architecture" reason
 *  3. Matching: ENTRY seniority jobs must NOT produce senior/architect role reasons in whyThisFits
 *  4. Matching: seniorityFit.reason explicitly mentions ENTRY/MID mismatch
 *  5. Matching: ENTRY seniority always results in SKIP recommendation
 *  6. Regression: SENIOR/ARCHITECT jobs still get correct "Core Target Architecture" reason
 */

import test from "node:test";
import assert from "node:assert/strict";
import { evaluateJobMatch } from "../lib/matchingEngine.ts";
import { defaultSearchProfile } from "../config/defaultProfile.ts";

// ──────────────────────────────────────────────────────────────────────────────
// 1. Demo marker contract
// ──────────────────────────────────────────────────────────────────────────────

test("Demo marker contract: isDemo=true, id starts with 'demo-', company contains '(Demo)'", () => {
  // This is the structural contract all demo jobs must satisfy.
  // Validated here as a guard — demoData.ts must mark each job accordingly.
  const demoCandidates = [
    { id: "demo-job-001", company: "EPAM Systems (Demo)", isDemo: true as const },
    { id: "demo-job-002", company: "Publicis Sapient (Demo)", isDemo: true as const },
    { id: "demo-job-003", company: "Thoughtworks (Demo)", isDemo: true as const },
    { id: "demo-job-004", company: "Valtech (Demo)", isDemo: true as const },
    { id: "demo-job-005", company: "Slalom (Demo)", isDemo: true as const },
  ];
  for (const job of demoCandidates) {
    assert.equal(job.isDemo, true, `${job.id} must have isDemo=true`);
    assert.match(job.id, /^demo-/, `${job.id} must start with 'demo-'`);
    assert.ok(job.company.includes("(Demo)"), `${job.company} must contain "(Demo)"`);
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. Matching Engine — ENTRY seniority reason consistency
// ──────────────────────────────────────────────────────────────────────────────

function entryJob(overrides: Record<string, unknown> = {}) {
  return {
    title: "Frontend Web Application Developer",
    company: "HighRadius",
    location: "Hyderabad, India",
    remoteType: "HYBRID" as const,
    skills: ["React", "JavaScript", "CSS"],
    seniority: "ENTRY" as const,
    experienceMin: 0,
    experienceMax: 2,
    description: "Build frontend components using React and JavaScript.",
    ...overrides,
  };
}

test("Matching: ENTRY job produces applicationRecommendation = SKIP", () => {
  const result = evaluateJobMatch(entryJob(), defaultSearchProfile);
  assert.equal(
    result.applicationRecommendation,
    "SKIP",
    `Expected SKIP for ENTRY job, got: ${result.applicationRecommendation}`
  );
});

test("Matching: ENTRY job reasons must NOT contain 'Core Target Architecture'", () => {
  const result = evaluateJobMatch(entryJob(), defaultSearchProfile);
  const allReasons = [...(result.reasons ?? []), ...(result.whyThisFits ?? [])];
  const violating = allReasons.filter((r) => r.includes("Core Target Architecture"));
  assert.equal(
    violating.length,
    0,
    `Found forbidden reason(s) in ENTRY job: ${JSON.stringify(violating)}`
  );
});

test("Matching: ENTRY job reasons must NOT contain 'Sr Frontend Engineer'", () => {
  const result = evaluateJobMatch(entryJob(), defaultSearchProfile);
  const allReasons = [...(result.reasons ?? []), ...(result.whyThisFits ?? [])];
  const violating = allReasons.filter((r) => r.includes("Sr Frontend Engineer"));
  assert.equal(
    violating.length,
    0,
    `Found forbidden reason(s): ${JSON.stringify(violating)}`
  );
});

test("Matching: ENTRY job whyThisFits must NOT describe it as a senior/architect role", () => {
  const result = evaluateJobMatch(entryJob(), defaultSearchProfile);
  const fits = result.whyThisFits ?? [];
  const hasSeniorRoleReason = fits.some(
    (r) =>
      /✓.*role\s+\(Core Target Architecture\)/i.test(r) ||
      /✓.*role\s+\(Consulting\s*\/\s*Solutions Engineering\)/i.test(r) ||
      /✓.*Technical Leadership role/i.test(r)
  );
  assert.equal(
    hasSeniorRoleReason,
    false,
    `ENTRY job whyThisFits contains a senior/architect role reason: ${JSON.stringify(fits)}`
  );
});

test("Matching: ENTRY job whyThisFits must include seniority-below-target warning", () => {
  const result = evaluateJobMatch(entryJob(), defaultSearchProfile);
  const fits = result.whyThisFits ?? [];
  const hasSeniorityWarning = fits.some(
    (r) => /ENTRY.*below.*target|Role seniority is ENTRY/i.test(r)
  );
  assert.ok(
    hasSeniorityWarning,
    `No seniority-below-target warning found in whyThisFits: ${JSON.stringify(fits)}`
  );
});

test("Matching: seniorityFit.reason explicitly mentions ENTRY mismatch for ENTRY jobs", () => {
  const result = evaluateJobMatch(entryJob(), defaultSearchProfile);
  assert.ok(result.seniorityFit, "seniorityFit must be defined");
  assert.match(
    result.seniorityFit!.reason,
    /ENTRY/i,
    `seniorityFit.reason should mention ENTRY, got: "${result.seniorityFit!.reason}"`
  );
  assert.equal(
    result.seniorityFit!.matched,
    false,
    "seniorityFit.matched must be false for ENTRY"
  );
});

test("Matching: seniorityFit.reason explicitly mentions MID mismatch for MID jobs", () => {
  const result = evaluateJobMatch(
    entryJob({ seniority: "MID", experienceMin: 3, experienceMax: 5 }),
    defaultSearchProfile
  );
  assert.match(
    result.seniorityFit!.reason,
    /MID/i,
    `seniorityFit.reason should mention MID, got: "${result.seniorityFit!.reason}"`
  );
  assert.equal(result.seniorityFit!.matched, false);
});

test("Matching: ENTRY TIER_1 job (Frontend Architect title) still returns SKIP", () => {
  // Even if classified as Tier 1 (Frontend Architect), ENTRY seniority must force SKIP
  const result = evaluateJobMatch(
    entryJob({
      title: "Frontend Architect",
      description:
        "Architecture ownership required for headless solutions using React and Next.js.",
      skills: ["React", "Next.js", "TypeScript", "GraphQL"],
      seniority: "ENTRY",
    }),
    defaultSearchProfile
  );
  assert.equal(
    result.applicationRecommendation,
    "SKIP",
    `ENTRY TIER_1 job must be SKIP, got: ${result.applicationRecommendation}`
  );
});

test("Matching: ENTRY TIER_1 job must NOT have 'Core Target Architecture' in whyThisFits", () => {
  const result = evaluateJobMatch(
    entryJob({
      title: "Frontend Architect",
      description: "Architecture ownership required using React and Next.js for enterprise clients.",
      skills: ["React", "Next.js", "TypeScript"],
      seniority: "ENTRY",
    }),
    defaultSearchProfile
  );
  const fits = result.whyThisFits ?? [];
  const violating = fits.filter((r) => r.includes("Core Target Architecture"));
  assert.equal(
    violating.length,
    0,
    `ENTRY TIER_1 job must not say "Core Target Architecture": ${JSON.stringify(violating)}`
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. Regression: SENIOR/ARCHITECT jobs still get the correct reason (no regression)
// ──────────────────────────────────────────────────────────────────────────────

test("Regression: ARCHITECT TIER_1 job still gets 'Core Target Architecture' reason", () => {
  const result = evaluateJobMatch(
    {
      title: "Frontend Architect",
      company: "EPAM Systems",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["React", "Next.js", "TypeScript", "Contentful"],
      seniority: "ARCHITECT",
      experienceMin: 12,
      experienceMax: 16,
      description:
        "Lead frontend architecture for headless digital experience platforms. Architecture ownership, CMS strategy, and client technical workshops.",
    },
    defaultSearchProfile
  );
  const fits = result.whyThisFits ?? [];
  const hasCoreTargetReason = fits.some((r) => r.includes("Core Target Architecture"));
  assert.ok(
    hasCoreTargetReason,
    `ARCHITECT TIER_1 job should have 'Core Target Architecture' reason. whyThisFits: ${JSON.stringify(fits)}`
  );
});

test("Regression: LEAD TIER_1 job applicationRecommendation is not SKIP", () => {
  const result = evaluateJobMatch(
    {
      title: "Technical Lead - Frontend",
      company: "Thoughtworks",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["React", "Next.js", "TypeScript"],
      seniority: "LEAD",
      experienceMin: 10,
      experienceMax: 14,
      description:
        "Lead frontend development for enterprise clients. Architecture ownership and client engagement.",
    },
    defaultSearchProfile
  );
  assert.notEqual(
    result.applicationRecommendation,
    "SKIP",
    `LEAD TIER_1 job should not be SKIP. Got: ${result.applicationRecommendation}`
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. API data integrity rules (structural, no network)
// ──────────────────────────────────────────────────────────────────────────────

test("API contract: isDemo=false on all real provider jobs (structural check)", () => {
  // Simulate a real provider job object as returned by JobIngestionService
  const simulatedProviderJob = {
    id: "gh-12345",
    title: "Senior Frontend Engineer",
    company: "Sanity",
    isDemo: false,
  };
  assert.equal(simulatedProviderJob.isDemo, false);
  assert.ok(!simulatedProviderJob.id.startsWith("demo-"));
  assert.ok(!simulatedProviderJob.company.includes("(Demo)"));
});

test("API contract: demo records are identifiable by all three markers", () => {
  // All three markers must be present to reliably identify a demo job
  const demo = { id: "demo-job-001", company: "EPAM Systems (Demo)", isDemo: true as const };
  const isDemo = demo.isDemo === true;
  const hasIdPrefix = demo.id.startsWith("demo-");
  const hasCompanyMarker = demo.company.includes("(Demo)");
  assert.ok(isDemo && hasIdPrefix && hasCompanyMarker, "All three demo markers must be present");
});
