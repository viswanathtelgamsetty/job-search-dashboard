import test from "node:test";
import assert from "node:assert";
import type { Job } from "../types/index.ts";
import {
  calculateOpportunityPriority,
  getOpportunityPriorityReasons,
  getOpportunityPriority,
  sortMarketRadarJobs,
} from "../lib/marketRadar.ts";

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "mock-job-1",
    title: "Senior Frontend Architect",
    normalizedTitle: "Senior Frontend Architect",
    company: "Acme Corp",
    normalizedCompany: "Acme Corp",
    location: "Hyderabad, India",
    normalizedLocation: "HYDERABAD",
    remoteType: "HYBRID",
    isIndiaEligible: true,
    salaryState: "SALARY_CONFIRMED",
    salaryDisclosed: true,
    salaryLpaMin: 45,
    seniority: "ARCHITECT",
    skills: ["React", "Next.js", "TypeScript"],
    actualJobTechnologies: ["React", "Next.js", "TypeScript"],
    matchedTargetTechnologies: ["React", "Next.js", "TypeScript"],
    technologyMatchDetails: [],
    roleFamily: "FRONTEND_ARCHITECT",
    domains: ["FRONTEND"],
    secondaryEvidenceDomains: [],
    domainMatches: [],
    careerFit: "HIGH_RELEVANCE",
    travel: {
      type: "INTERNATIONAL_TRAVEL",
      percentage: 20,
      destinations: ["USA"],
      evidence: "Travel up to 20%",
    },
    source: "greenhouse",
    url: "https://example.com/job/1",
    discoveredAt: "2026-09-24T00:00:00.000Z",
    postedAt: "2026-09-23T00:00:00.000Z",
    freshness: "FRESH",
    postedDaysAgo: 1,
    status: "DISCOVERED",
    isDemo: false,
    updatedAt: "2026-09-24T00:00:00.000Z",
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

// 1. Deterministic Opportunity Priority Classification Tests (All 9 Required Combinations)

test("Priority Classification: High + Fresh => PRIORITY", () => {
  const result = calculateOpportunityPriority("HIGH_RELEVANCE", "FRESH");
  assert.strictEqual(result, "PRIORITY");
});

test("Priority Classification: Relevant + Recent => PRIORITY", () => {
  const result = calculateOpportunityPriority("RELEVANT", "RECENT");
  assert.strictEqual(result, "PRIORITY");
});

test("Priority Classification: High + Older => ACTIVE", () => {
  const result = calculateOpportunityPriority("HIGH_RELEVANCE", "OLDER");
  assert.strictEqual(result, "ACTIVE");
});

test("Priority Classification: Relevant + Older => ACTIVE", () => {
  const result = calculateOpportunityPriority("RELEVANT", "OLDER");
  assert.strictEqual(result, "ACTIVE");
});

test("Priority Classification: Possible + Fresh => WATCH", () => {
  const result = calculateOpportunityPriority("POSSIBLE", "FRESH");
  assert.strictEqual(result, "WATCH");
});

test("Priority Classification: Possible + Recent => WATCH", () => {
  const result = calculateOpportunityPriority("POSSIBLE", "RECENT");
  assert.strictEqual(result, "WATCH");
});

test("Priority Classification: Possible + Older => LOW", () => {
  const result = calculateOpportunityPriority("POSSIBLE", "OLDER");
  assert.strictEqual(result, "LOW");
});

test("Priority Classification: Low + Fresh => LOW", () => {
  const result = calculateOpportunityPriority("LOW_RELEVANCE", "FRESH");
  assert.strictEqual(result, "LOW");
});

test("Priority Classification: Low + Older => LOW", () => {
  const result = calculateOpportunityPriority("LOW_RELEVANCE", "OLDER");
  assert.strictEqual(result, "LOW");
});

test("Priority Helper: Extracts priority directly from Job object", () => {
  const job = createMockJob({ careerFit: "HIGH_RELEVANCE", freshness: "FRESH" });
  assert.strictEqual(getOpportunityPriority(job), "PRIORITY");

  const jobOlder = createMockJob({ careerFit: "RELEVANT", freshness: "OLDER" });
  assert.strictEqual(getOpportunityPriority(jobOlder), "ACTIVE");
});

// 2. Priority Reasons Generation Tests

test("Priority Reasons: Exposes factual reasons for each bucket", () => {
  const priorityReasons = getOpportunityPriorityReasons("HIGH_RELEVANCE", "FRESH");
  assert.deepStrictEqual(priorityReasons, ["Strong career fit", "Recently posted"]);

  const activeReasons = getOpportunityPriorityReasons("RELEVANT", "OLDER");
  assert.deepStrictEqual(activeReasons, ["Strong career fit", "Older posting"]);

  const watchReasons = getOpportunityPriorityReasons("POSSIBLE", "FRESH");
  assert.deepStrictEqual(watchReasons, ["Possible career fit", "Recently posted"]);

  const lowReasons = getOpportunityPriorityReasons("LOW_RELEVANCE", "OLDER");
  assert.deepStrictEqual(lowReasons, ["Lower career fit", "Older posting"]);
});

// 3. Sorting by Opportunity Priority & Internal Tier Hierarchy

test("Opportunity Priority Sorting: Orders PRIORITY > ACTIVE > WATCH > LOW", () => {
  const jLow = createMockJob({ id: "j-low", careerFit: "LOW_RELEVANCE", freshness: "OLDER" });
  const jWatch = createMockJob({ id: "j-watch", careerFit: "POSSIBLE", freshness: "FRESH" });
  const jActive = createMockJob({ id: "j-active", careerFit: "RELEVANT", freshness: "OLDER" });
  const jPriority = createMockJob({ id: "j-priority", careerFit: "HIGH_RELEVANCE", freshness: "FRESH" });

  const sorted = sortMarketRadarJobs([jLow, jActive, jWatch, jPriority], "relevance");

  assert.strictEqual(sorted[0].id, "j-priority");
  assert.strictEqual(sorted[1].id, "j-active");
  assert.strictEqual(sorted[2].id, "j-watch");
  assert.strictEqual(sorted[3].id, "j-low");
});

test("Opportunity Priority Sorting Within Bucket: Freshest first, then Career Fit, then Hyderabad, then India", () => {
  // Two jobs in PRIORITY bucket: one is FRESH, one is RECENT
  const jPriorityRecent = createMockJob({
    id: "j-p-recent",
    careerFit: "HIGH_RELEVANCE",
    freshness: "RECENT",
    normalizedLocation: "HYDERABAD",
  });
  const jPriorityFresh = createMockJob({
    id: "j-p-fresh",
    careerFit: "RELEVANT",
    freshness: "FRESH",
    normalizedLocation: "BANGALORE",
  });

  const sortedFreshness = sortMarketRadarJobs([jPriorityRecent, jPriorityFresh], "relevance");
  // FRESH should come before RECENT even if career fit is RELEVANT vs HIGH
  assert.strictEqual(sortedFreshness[0].id, "j-p-fresh");
  assert.strictEqual(sortedFreshness[1].id, "j-p-recent");

  // Two jobs in PRIORITY with same freshness (FRESH): HIGH_RELEVANCE should beat RELEVANT
  const jHighFresh = createMockJob({
    id: "j-high-fresh",
    careerFit: "HIGH_RELEVANCE",
    freshness: "FRESH",
    normalizedLocation: "BANGALORE",
  });
  const jRelFresh = createMockJob({
    id: "j-rel-fresh",
    careerFit: "RELEVANT",
    freshness: "FRESH",
    normalizedLocation: "BANGALORE",
  });
  const sortedFit = sortMarketRadarJobs([jRelFresh, jHighFresh], "relevance");
  assert.strictEqual(sortedFit[0].id, "j-high-fresh");
  assert.strictEqual(sortedFit[1].id, "j-rel-fresh");

  // Two jobs with same fit and freshness: Hyderabad beats Bangalore
  const jHyd = createMockJob({
    id: "j-hyd",
    careerFit: "HIGH_RELEVANCE",
    freshness: "FRESH",
    normalizedLocation: "HYDERABAD",
  });
  const jBlr = createMockJob({
    id: "j-blr",
    careerFit: "HIGH_RELEVANCE",
    freshness: "FRESH",
    normalizedLocation: "BANGALORE",
  });
  const sortedLocation = sortMarketRadarJobs([jBlr, jHyd], "relevance");
  assert.strictEqual(sortedLocation[0].id, "j-hyd");
  assert.strictEqual(sortedLocation[1].id, "j-blr");
});
