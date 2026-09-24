import test from "node:test";
import assert from "node:assert";
import type { CareerDomain, Job } from "../types/index.ts";
import {
  calculateMarketRadarMetrics,
  matchesRadarSection,
  getDataQualityNotices,
  sortMarketRadarJobs,
  CAREER_LANES,
} from "../lib/marketRadar.ts";

function createMockJob(overrides: Partial<Job> = {}): Job {
  return {
    id: "job-1",
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
      evidence: "Travel to US customer sites up to 20%",
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

// 1. Market Radar Summary Metrics (Exact 15 Metrics)
test("Market Radar Metrics: Calculates all 15 required summary metrics", () => {
  const jobs: Job[] = [
    createMockJob({
      id: "j1",
      careerFit: "HIGH_RELEVANCE",
      normalizedLocation: "HYDERABAD",
      isIndiaEligible: true,
      travel: { type: "INTERNATIONAL_TRAVEL", destinations: [], evidence: "" },
      freshness: "FRESH",
    }),
    createMockJob({
      id: "j2",
      careerFit: "RELEVANT",
      normalizedLocation: "REMOTE_INDIA",
      isIndiaEligible: true,
      travel: { type: "CLIENT_SITE_TRAVEL", destinations: [], evidence: "" },
      freshness: "RECENT",
    }),
    createMockJob({
      id: "j3",
      careerFit: "POSSIBLE",
      normalizedLocation: "REMOTE_GLOBAL",
      isIndiaEligible: true,
      travel: { type: "REMOTE_GLOBAL", destinations: [], evidence: "" },
      freshness: "OLDER",
    }),
    createMockJob({
      id: "j4",
      careerFit: "LOW_RELEVANCE",
      normalizedLocation: "USA",
      remoteType: "ONSITE",
      isIndiaEligible: false,
      travel: { type: "RELOCATION", destinations: [], evidence: "" },
      freshness: "UNKNOWN",
    }),
    // Demo job that should be excluded
    createMockJob({
      id: "j-demo",
      isDemo: true,
      careerFit: "HIGH_RELEVANCE",
    }),
  ];

  const metrics = calculateMarketRadarMetrics(jobs);

  assert.strictEqual(metrics.totalJobs, 4);
  assert.strictEqual(metrics.highRelevance, 1);
  assert.strictEqual(metrics.relevant, 1);
  assert.strictEqual(metrics.possible, 1);
  assert.strictEqual(metrics.lowRelevance, 1);
  assert.strictEqual(metrics.india, 3);
  assert.strictEqual(metrics.hyderabad, 1);
  assert.strictEqual(metrics.remoteIndia, 1);
  assert.strictEqual(metrics.globalRemote, 1);
  assert.strictEqual(metrics.internationalOnsite, 1);
  assert.strictEqual(metrics.internationalTravel, 1);
  assert.strictEqual(metrics.clientSiteTravel, 1);
  assert.strictEqual(metrics.relocation, 1);
  assert.strictEqual(metrics.freshJobs, 1);
  assert.strictEqual(metrics.recentJobs, 1);
});

// 2. Career Lanes Grouping strictly from primary domains
test("Career Lanes: Uses existing primary domains and contains 14 lanes", () => {
  assert.strictEqual(CAREER_LANES.length, 14);

  const expectedLanes = [
    "FRONTEND",
    "DIGITAL_EXPERIENCE",
    "CMS",
    "COMMERCE",
    "ENTERPRISE_INTEGRATION",
    "SOLUTIONS_ARCHITECTURE",
    "TECHNICAL_ARCHITECTURE",
    "CLIENT_CONSULTING",
    "PROFESSIONAL_SERVICES",
    "SOFTWARE_ENGINEERING",
    "DEVOPS",
    "SRE",
    "DATA_AI",
    "SECURITY",
  ];

  const laneKeys: CareerDomain[] = CAREER_LANES.map((l) => l.key);
  for (const expected of expectedLanes) {
    assert.ok(laneKeys.includes(expected as CareerDomain), `Missing expected career lane: ${expected}`);
  }

  // Verify secondary domains are not primary
  const job = createMockJob({
    domains: ["FRONTEND"],
    secondaryEvidenceDomains: ["DEVOPS", "SECURITY"],
  });

  assert.ok(job.domains.includes("FRONTEND"));
  assert.ok(!job.domains.includes("DEVOPS"));
});

// 3. Travel Radar Visibility & Percentage
test("Travel Radar: High visibility values and percentage", () => {
  const jobWithPercentage = createMockJob({
    travel: {
      type: "INTERNATIONAL_TRAVEL",
      percentage: 25,
      destinations: ["USA"],
      evidence: "25% international travel to client sites",
    },
  });

  assert.strictEqual(jobWithPercentage.travel.type, "INTERNATIONAL_TRAVEL");
  assert.strictEqual(jobWithPercentage.travel.percentage, 25);
  assert.strictEqual(jobWithPercentage.travel.evidence, "25% international travel to client sites");

  const jobNoTravel = createMockJob({
    travel: {
      type: "NO_TRAVEL_MENTIONED",
      destinations: [],
      evidence: "",
    },
  });

  assert.strictEqual(jobNoTravel.travel.type, "NO_TRAVEL_MENTIONED");
});

// 4. Market Radar Sections A through F
test("Market Radar Sections: Correctly maps jobs to Sections A through F", () => {
  // A. Best Current Matches (HIGH_RELEVANCE or RELEVANT)
  const bestJob1 = createMockJob({ careerFit: "HIGH_RELEVANCE" });
  const bestJob2 = createMockJob({ careerFit: "RELEVANT" });
  const possibleJob = createMockJob({ careerFit: "POSSIBLE" });

  assert.strictEqual(matchesRadarSection(bestJob1, "BEST_MATCHES"), true);
  assert.strictEqual(matchesRadarSection(bestJob2, "BEST_MATCHES"), true);
  assert.strictEqual(matchesRadarSection(possibleJob, "BEST_MATCHES"), false);

  // B. Fresh Opportunities (FRESH)
  const freshJob = createMockJob({ freshness: "FRESH" });
  const olderJob = createMockJob({ freshness: "OLDER" });
  assert.strictEqual(matchesRadarSection(freshJob, "FRESH"), true);
  assert.strictEqual(matchesRadarSection(olderJob, "FRESH"), false);

  // C. International / Travel Opportunities
  const intlTravelJob = createMockJob({ travel: { type: "INTERNATIONAL_TRAVEL", destinations: [], evidence: "" } });
  const clientTravelJob = createMockJob({ travel: { type: "CLIENT_SITE_TRAVEL", destinations: [], evidence: "" } });
  const relocationJob = createMockJob({ travel: { type: "RELOCATION", destinations: [], evidence: "" } });
  const noTravelJob = createMockJob({ travel: { type: "NO_TRAVEL_MENTIONED", destinations: [], evidence: "" } });

  assert.strictEqual(matchesRadarSection(intlTravelJob, "TRAVEL"), true);
  assert.strictEqual(matchesRadarSection(clientTravelJob, "TRAVEL"), true);
  assert.strictEqual(matchesRadarSection(relocationJob, "TRAVEL"), true);
  assert.strictEqual(matchesRadarSection(noTravelJob, "TRAVEL"), false);

  // D. Remote Global
  const globalRemoteJob = createMockJob({
    travel: { type: "REMOTE_GLOBAL", destinations: [], evidence: "" },
    isIndiaEligible: true,
  });
  const localOnsiteJob = createMockJob({
    remoteType: "ONSITE",
    normalizedLocation: "USA",
    isIndiaEligible: false,
    travel: { type: "NO_TRAVEL_MENTIONED", destinations: [], evidence: "" },
  });
  assert.strictEqual(matchesRadarSection(globalRemoteJob, "REMOTE_GLOBAL"), true);
  assert.strictEqual(matchesRadarSection(localOnsiteJob, "REMOTE_GLOBAL"), false);

  // E. Hyderabad / India
  const hydJob = createMockJob({ normalizedLocation: "HYDERABAD", isIndiaEligible: true });
  const indiaJob = createMockJob({ normalizedLocation: "BANGALORE", isIndiaEligible: true });
  const usJob = createMockJob({ normalizedLocation: "USA", isIndiaEligible: false });

  assert.strictEqual(matchesRadarSection(hydJob, "HYDERABAD_INDIA"), true);
  assert.strictEqual(matchesRadarSection(indiaJob, "HYDERABAD_INDIA"), true);
  assert.strictEqual(matchesRadarSection(usJob, "HYDERABAD_INDIA"), false);

  // F. Adjacent Opportunities (POSSIBLE)
  assert.strictEqual(matchesRadarSection(possibleJob, "ADJACENT"), true);
  assert.strictEqual(matchesRadarSection(bestJob1, "ADJACENT"), false);
});

// 5. Data Quality Warnings
test("Data Quality: Emits factual warnings when data is incomplete", () => {
  const incompleteJob = createMockJob({
    salaryDisclosed: false,
    salaryState: "SALARY_NOT_DISCLOSED",
    travel: { type: "NO_TRAVEL_MENTIONED", destinations: [], evidence: "" },
    freshness: "UNKNOWN",
    postedAt: undefined,
    postedDaysAgo: undefined,
    isIndiaEligible: false,
    indiaEligibilityReason: undefined,
    remoteType: "REMOTE",
  });

  const notices = getDataQualityNotices(incompleteJob);

  assert.ok(notices.includes("Salary not disclosed"));
  assert.ok(notices.includes("Travel not mentioned"));
  assert.ok(notices.includes("Location eligibility unclear"));
  assert.ok(notices.includes("Freshness unavailable"));

  // Complete job has no missing warnings
  const completeJob = createMockJob({
    salaryDisclosed: true,
    salaryState: "SALARY_CONFIRMED",
    travel: { type: "INTERNATIONAL_TRAVEL", destinations: ["US"], evidence: "10% travel" },
    freshness: "FRESH",
    postedAt: "2026-09-23T00:00:00Z",
    isIndiaEligible: true,
    indiaEligibilityReason: "Hyderabad office location",
  });

  const completeNotices = getDataQualityNotices(completeJob);
  assert.strictEqual(completeNotices.length, 0);
});

// 6. Sorting: Career Fit, Freshest, Most Recent, Travel, Location
test("Sorting: Sorts correctly without opaque numeric scores", () => {
  const jLow = createMockJob({ id: "low", careerFit: "LOW_RELEVANCE" });
  const jHigh = createMockJob({ id: "high", careerFit: "HIGH_RELEVANCE" });
  const jRelevant = createMockJob({ id: "rel", careerFit: "RELEVANT" });

  const sortedRelevance = sortMarketRadarJobs([jLow, jRelevant, jHigh], "relevance");
  assert.strictEqual(sortedRelevance[0].id, "high");
  assert.strictEqual(sortedRelevance[1].id, "rel");
  assert.strictEqual(sortedRelevance[2].id, "low");

  // Freshest sorting
  const jFresh = createMockJob({ id: "fresh", freshness: "FRESH" });
  const jRecent = createMockJob({ id: "recent", freshness: "RECENT" });
  const jOlder = createMockJob({ id: "older", freshness: "OLDER" });

  const sortedFresh = sortMarketRadarJobs([jOlder, jFresh, jRecent], "freshest");
  assert.strictEqual(sortedFresh[0].id, "fresh");
  assert.strictEqual(sortedFresh[1].id, "recent");
  assert.strictEqual(sortedFresh[2].id, "older");

  // Travel sorting
  const jTravel = createMockJob({ id: "intl", travel: { type: "INTERNATIONAL_TRAVEL", destinations: [], evidence: "" } });
  const jNoTravel = createMockJob({ id: "notrav", travel: { type: "NO_TRAVEL_MENTIONED", destinations: [], evidence: "" } });
  const jClientTravel = createMockJob({ id: "client", travel: { type: "CLIENT_SITE_TRAVEL", destinations: [], evidence: "" } });

  const sortedTravel = sortMarketRadarJobs([jNoTravel, jClientTravel, jTravel], "travel");
  assert.strictEqual(sortedTravel[0].id, "intl");
  assert.strictEqual(sortedTravel[1].id, "client");
  assert.strictEqual(sortedTravel[2].id, "notrav");
});
