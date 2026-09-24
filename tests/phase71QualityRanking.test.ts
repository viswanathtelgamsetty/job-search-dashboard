import test from "node:test";
import assert from "node:assert";
import { classifyMarket } from "../lib/marketClassifier.ts";
import { classifyLocation } from "../lib/locationClassifier.ts";
import { classifyRoleTier } from "../lib/roleClassifier.ts";
import { matchWeightedTechnologies } from "../lib/technologyMatcher.ts";
import { evaluateJobMatch } from "../lib/matchingEngine.ts";
import { defaultSearchProfile } from "../config/defaultProfile.ts";
import { sortMarketRadarJobs } from "../lib/marketRadar.ts";
import type { Job } from "../types/index.ts";

// =========================================================================
// 1. Multi-region classification & Location separation (Section 1 & 2)
// =========================================================================

test("Phase 7.1: 'Northern America, LATAM, Europe, APAC' must NOT become EMEA or USA", () => {
  const locStr = "Northern America, LATAM, Europe, APAC";
  const marketResult = classifyMarket(locStr, "Global team working across NA, LATAM, Europe, and APAC");

  // Market must be MULTI_REGION_REMOTE or GLOBAL_REMOTE
  assert.ok(
    marketResult.market === "MULTI_REGION_REMOTE" || marketResult.market === "GLOBAL_REMOTE",
    `Expected MULTI_REGION_REMOTE or GLOBAL_REMOTE but got ${marketResult.market}`
  );
  assert.strictEqual(marketResult.isEmea, false, "Must not be classified as EMEA");

  // Regions must contain all 4 detected
  assert.ok(marketResult.regions?.includes("NORTH_AMERICA"));
  assert.ok(marketResult.regions?.includes("LATAM"));
  assert.ok(marketResult.regions?.includes("EMEA"));
  assert.ok(marketResult.regions?.includes("APAC"));

  // Location must NOT be USA
  const normLoc = classifyLocation(locStr, "REMOTE");
  assert.notStrictEqual(normLoc, "USA", "Multi-region string must not infer USA");
  assert.ok(normLoc === "MULTI_REGION" || normLoc === "REMOTE_GLOBAL");
});

test("Phase 7.1: Single region EMEA vs LATAM vs North America", () => {
  const emeaRes = classifyMarket("Berlin, Germany", "Work with European teams");
  assert.strictEqual(emeaRes.market, "EMEA");
  assert.strictEqual(emeaRes.isEmea, true);

  const latamRes = classifyMarket("Buenos Aires, Argentina", "LATAM based team");
  assert.strictEqual(latamRes.market, "LATAM");
  assert.strictEqual(latamRes.isEmea, false);
});

// =========================================================================
// 2. India -> International directional classification (Section 3)
// =========================================================================

test("Phase 7.1: Mumbai + customer-facing + 25% travel => INDIA + CLIENT_FACING + INTERNATIONAL_TRAVEL (not EMEA)", () => {
  const marketResult = classifyMarket("Mumbai, India", "Client-facing architecture with international travel up to 25%");
  assert.strictEqual(marketResult.market, "INDIA");
  assert.strictEqual(marketResult.isEmea, false);

  const match = evaluateJobMatch(
    {
      title: "Solutions Architect",
      company: "Global Consulting Corp",
      location: "Mumbai, India",
      remoteType: "HYBRID",
      skills: ["React", "TypeScript", "REST APIs"],
      experienceMin: 12,
      description: "Customer-facing technical architecture consulting with international travel up to 25% to US and UK clients.",
    },
    defaultSearchProfile
  );

  assert.strictEqual(match.dimensions.clientFacingFit.strength, "STRONG");
  assert.strictEqual(match.dimensions.travelFit.strength, "STRONG");
  assert.strictEqual(match.careerFit, "HIGH_RELEVANCE");
});

// =========================================================================
// 3. Role Tier Classification (Section 10)
// =========================================================================

test("Phase 7.1: Role Tier hierarchy accurately separates target vs adjacent vs unrelated", () => {
  assert.strictEqual(classifyRoleTier("Frontend Architect").tier, "TIER_1");
  assert.strictEqual(classifyRoleTier("Technical Architect").tier, "TIER_1");
  assert.strictEqual(classifyRoleTier("Solutions Architect").tier, "TIER_1");
  assert.strictEqual(classifyRoleTier("Digital Experience Architect").tier, "TIER_1");
  assert.strictEqual(classifyRoleTier("Commerce Architect").tier, "TIER_1");
  assert.strictEqual(classifyRoleTier("Senior Frontend Engineer").tier, "TIER_1");
  assert.strictEqual(classifyRoleTier("Staff Frontend Engineer").tier, "TIER_1");

  assert.strictEqual(classifyRoleTier("Technical Consultant").tier, "TIER_2");
  assert.strictEqual(classifyRoleTier("Solutions Consultant").tier, "TIER_2");
  assert.strictEqual(classifyRoleTier("Solutions Engineer").tier, "TIER_2");
  assert.strictEqual(classifyRoleTier("Senior Full Stack Engineer").tier, "TIER_2");

  assert.strictEqual(classifyRoleTier("Senior Software Engineer").tier, "TIER_3");
  assert.strictEqual(classifyRoleTier("Staff Software Engineer").tier, "TIER_3");

  assert.strictEqual(classifyRoleTier("Cloud Operations Engineer").tier, "TIER_4");
  assert.strictEqual(classifyRoleTier("Site Reliability Engineer").tier, "TIER_4");
  assert.strictEqual(classifyRoleTier("Senior DevOps Engineer").tier, "TIER_4");
  assert.strictEqual(classifyRoleTier("Rust Engineering Lead").tier, "TIER_4");
  assert.strictEqual(classifyRoleTier("Data Scientist").tier, "TIER_4");

  assert.strictEqual(classifyRoleTier("Office Manager").tier, "TIER_5");
  assert.strictEqual(classifyRoleTier("Recruiter").tier, "TIER_5");
});

// =========================================================================
// 4. Current Audit Bug Fixes (Section 11)
// =========================================================================

test("Phase 7.1: Rust Engineering Lead — Canonical => LOW/POSSIBLE, not HIGH", () => {
  const match = evaluateJobMatch(
    {
      title: "Rust Engineering Lead",
      company: "Canonical",
      location: "Remote - EMEA",
      remoteType: "REMOTE",
      skills: ["Rust", "Linux", "C++"],
      experienceMin: 12,
      description: "Lead systems software engineering teams building low-level infrastructure in Rust and Linux.",
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(match.careerFit, "HIGH_RELEVANCE");
  assert.notStrictEqual(match.careerFit, "RELEVANT");
  assert.ok(match.careerFit === "POSSIBLE" || match.careerFit === "LOW_RELEVANCE");
});

test("Phase 7.1: Cloud Operations Engineer — MongoDB => POSSIBLE/LOW, not RELEVANT", () => {
  const match = evaluateJobMatch(
    {
      title: "Cloud Operations Engineer",
      company: "MongoDB",
      location: "Bengaluru, India",
      remoteType: "HYBRID",
      skills: ["AWS", "Azure", "GCP", "Kubernetes", "Docker", "Python"],
      experienceMin: 8,
      description: "Manage cloud operations, incident response, Kubernetes clusters, and cloud platform stability across AWS and Azure.",
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(match.careerFit, "HIGH_RELEVANCE");
  assert.notStrictEqual(match.careerFit, "RELEVANT");
  assert.ok(match.careerFit === "POSSIBLE" || match.careerFit === "LOW_RELEVANCE");
  assert.ok(match.potentialGaps.some((g) => g.toLowerCase().includes("cloud operations")));
});

test("Phase 7.1: Staff Software Engineer — Deliveroo => POSSIBLE unless frontend/arch evidence", () => {
  const matchGeneric = evaluateJobMatch(
    {
      title: "Staff Software Engineer",
      company: "Deliveroo",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["Java", "Kafka", "Postgres"],
      experienceMin: 12,
      description: "Backend logistics engine development with Java microservices and Kafka.",
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(matchGeneric.careerFit, "HIGH_RELEVANCE");
  assert.notStrictEqual(matchGeneric.careerFit, "RELEVANT");
  assert.strictEqual(matchGeneric.careerFit, "POSSIBLE");

  const matchFrontend = evaluateJobMatch(
    {
      title: "Staff Software Engineer - Frontend",
      company: "Deliveroo",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["React", "TypeScript", "Next.js"],
      experienceMin: 12,
      description: "Lead frontend architecture for consumer-facing web applications using React and Next.js.",
    },
    defaultSearchProfile
  );

  assert.strictEqual(matchFrontend.careerFit, "HIGH_RELEVANCE");
});

// =========================================================================
// 5. Adjacent tech must not dominate (Section 8 & 9)
// =========================================================================

test("Phase 7.1: 6 adjacent technologies (AWS, Azure, GCP, K8s, Docker, Terraform) do NOT overpower career identity", () => {
  const weighted = matchWeightedTechnologies(
    "Cloud infrastructure role with AWS, Azure, GCP, Kubernetes, Docker, and Terraform.",
    ["AWS", "Azure", "GCP", "Kubernetes", "Docker", "Terraform"]
  );

  assert.strictEqual(weighted.primaryMatched.length, 0);
  assert.strictEqual(weighted.secondaryMatched.length, 6);

  const weightedFrontend = matchWeightedTechnologies(
    "Frontend architect building web applications with React and Next.js.",
    ["React", "Next.js"]
  );

  assert.strictEqual(weightedFrontend.primaryMatched.length, 2);
  assert.strictEqual(weightedFrontend.secondaryMatched.length, 0);
});

// =========================================================================
// 6. Market Radar Relevance Sorting (Section 16)
// =========================================================================

test("Phase 7.1: Priority ranking ensures Tier 1 frontend/architecture beats Tier 4 DevOps/SRE with travel", () => {
  const now = new Date().toISOString();

  const devopsWithTravel: Job = {
    id: "job-devops",
    source: "greenhouse",
    title: "Senior DevOps Engineer",
    company: "InfraCorp",
    location: "Hyderabad, India",
    remoteType: "HYBRID",
    market: "INDIA",
    isIndiaEligible: true,
    careerFit: "LOW_RELEVANCE",
    roleTier: "TIER_4",
    seniority: "LEAD",
    freshness: "FRESH",
    postedAt: now,
    discoveredAt: now,
    roleFamily: "DEVOPS",
    primaryTechnologiesMatched: [],
    secondaryTechnologiesMatched: ["AWS", "Kubernetes", "Docker"],
    domains: ["DEVOPS"],
    clientFacing: "NO",
    travel: { type: "INTERNATIONAL_TRAVEL", percentage: 25, isInternational: true, evidence: "25% travel" },
    opportunityPriority: "LOW",
    isDemo: false,
    opportunityType: "INDIA_LOCAL",
  } as unknown as Job;

  const frontendArchitect: Job = {
    id: "job-frontend-arch",
    source: "greenhouse",
    title: "Senior Frontend Architect",
    company: "Digital Web Co",
    location: "Hyderabad, India",
    remoteType: "HYBRID",
    market: "INDIA",
    isIndiaEligible: true,
    careerFit: "HIGH_RELEVANCE",
    roleTier: "TIER_1",
    seniority: "ARCHITECT",
    freshness: "FRESH",
    postedAt: now,
    discoveredAt: now,
    roleFamily: "FRONTEND_ARCHITECT",
    primaryTechnologiesMatched: ["React", "TypeScript", "Next.js"],
    secondaryTechnologiesMatched: [],
    domains: ["FRONTEND", "TECHNICAL_ARCHITECTURE"],
    clientFacing: "YES",
    travel: { type: "NO_TRAVEL_MENTIONED", percentage: 0, isInternational: false, evidence: null },
    opportunityPriority: "PRIORITY",
    isDemo: false,
    opportunityType: "INDIA_LOCAL",
  } as unknown as Job;

  const sorted = sortMarketRadarJobs([devopsWithTravel, frontendArchitect], "relevance");
  assert.strictEqual(sorted[0].id, "job-frontend-arch", "Frontend Architect must beat DevOps even if DevOps has travel");
});
