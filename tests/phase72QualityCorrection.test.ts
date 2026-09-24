import test from "node:test";
import assert from "node:assert";
import { evaluateJobMatch } from "../lib/matchingEngine.ts";
import { defaultSearchProfile } from "../config/defaultProfile.ts";
import { classifyMarketAndEmeaCountry } from "../lib/marketClassifier.ts";
import { checkIndiaEligibility } from "../lib/locationClassifier.ts";
import { classifyWorkAuthorization } from "../lib/workAuthorizationClassifier.ts";
import { classifyOpportunityTypes } from "../lib/opportunityType.ts";
import { extractTravelDetails } from "../lib/travelExtractor.ts";
import { classifyRoleFamily, classifyRoleTier } from "../lib/roleClassifier.ts";

// 1. Tier 4 cannot become RELEVANT without explicit architecture evidence
test("Phase 7.2: Tier 4 cannot become RELEVANT without explicit architecture evidence", () => {
  const roleFamily = classifyRoleFamily("Agent Developer Test III", "Develop internal test tools and scripts");
  const roleTier = classifyRoleTier("Agent Developer Test III", "Develop internal test tools and scripts", roleFamily.primary);

  assert.strictEqual(roleTier.tier, "TIER_4", "Agent Developer Test III should be Tier 4");

  const match = evaluateJobMatch(
    {
      title: "Agent Developer Test III",
      company: "HighRadius",
      location: "Hyderabad, India",
      remoteType: "ONSITE",
      skills: ["Java", "JavaScript", "Selenium"],
      description: "Responsible for writing automated tests and maintaining developer test pipelines. 10+ years experience required.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  // Must NOT be RELEVANT: Tier 4 without explicit architecture evidence is POSSIBLE or LOW_RELEVANCE
  assert.notStrictEqual(
    match.careerFit,
    "RELEVANT",
    "Agent Developer Test III must NOT be classified as RELEVANT"
  );
  assert.ok(
    match.careerFit === "POSSIBLE" || match.careerFit === "LOW_RELEVANCE",
    `Expected POSSIBLE or LOW_RELEVANCE, got ${match.careerFit}`
  );
});

test("Phase 7.2: Tier 4 WITH explicit architecture evidence can become RELEVANT", () => {
  const match = evaluateJobMatch(
    {
      title: "Platform Systems Lead",
      company: "Enterprise Corp",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["Go", "Kubernetes"],
      description: "Hands-on technical leadership and frontend architecture ownership for platform tools. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.strictEqual(
    match.careerFit,
    "RELEVANT",
    "Tier 4 role with explicit frontend architecture ownership can be RELEVANT"
  );
});

// 2. Mobile Architect without web/frontend evidence is not HIGH
test("Phase 7.2: Mobile Architect without web/frontend evidence is not HIGH", () => {
  const match = evaluateJobMatch(
    {
      title: "Mobile Architect",
      company: "Fintech Mobile",
      location: "Bangalore, India",
      remoteType: "HYBRID",
      skills: ["Swift", "Kotlin", "iOS", "Android"],
      description: "Lead native iOS and Android application architecture. Swift, Objective-C, Kotlin. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(
    match.careerFit,
    "HIGH_RELEVANCE",
    "Mobile Architect without web/frontend evidence must NOT be HIGH_RELEVANCE"
  );
  assert.strictEqual(
    match.careerFit,
    "RELEVANT",
    "Mobile Architect should be classified as RELEVANT instead of HIGH"
  );
  assert.ok(
    match.potentialGaps.some((g) => g.toLowerCase().includes("mobile architecture")),
    "Should include mobile architecture gap explanation"
  );
});

// 3. Data/AI Architect without target-domain evidence is not HIGH
test("Phase 7.2: Data/AI Architect without target-domain evidence is not HIGH", () => {
  const match = evaluateJobMatch(
    {
      title: "Data & AI Architect",
      company: "DataCorp",
      location: "Hyderabad, India",
      remoteType: "REMOTE",
      skills: ["Python", "Spark", "PyTorch", "Databricks"],
      description: "Design machine learning pipelines and big data architecture. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(
    match.careerFit,
    "HIGH_RELEVANCE",
    "Data/AI Architect without target frontend/integration domain must NOT be HIGH_RELEVANCE"
  );
  assert.ok(
    match.careerFit === "RELEVANT" || match.careerFit === "POSSIBLE",
    `Data/AI Architect should be RELEVANT or POSSIBLE rather than HIGH or forced to LOW, got ${match.careerFit}`
  );
});

// 4. Cloud Architect without target-domain evidence is not HIGH
test("Phase 7.2: Cloud Architect without target-domain evidence is not HIGH", () => {
  const match = evaluateJobMatch(
    {
      title: "Cloud Infrastructure Architect",
      company: "CloudScale",
      location: "Remote - India",
      remoteType: "REMOTE",
      skills: ["AWS", "Terraform", "Kubernetes", "Docker"],
      description: "Design multi-region AWS cloud infrastructure, VPC peering, and terraform modules. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(
    match.careerFit,
    "HIGH_RELEVANCE",
    "Cloud Architect without target frontend/integration domain must NOT be HIGH_RELEVANCE"
  );
  assert.strictEqual(
    match.careerFit,
    "RELEVANT",
    "Cloud Architect should remain RELEVANT rather than forced to LOW"
  );
});

// 5. Frontend Architect + React = HIGH
test("Phase 7.2: Frontend Architect + React = HIGH and APPLY_NOW", () => {
  const match = evaluateJobMatch(
    {
      title: "Frontend Architect",
      company: "SaaS Scaleup",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["React", "TypeScript", "Next.js"],
      description: "Lead frontend architecture for our modern web application using React, Next.js, and TypeScript. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.strictEqual(
    match.careerFit,
    "HIGH_RELEVANCE",
    "Frontend Architect + React should be HIGH_RELEVANCE"
  );
  assert.strictEqual(
    match.applicationRecommendation,
    "APPLY_NOW",
    "Frontend Architect + React with India eligibility should be APPLY_NOW"
  );
});

// 6. Solutions Architect + customer architecture + APIs = HIGH/RELEVANT
test("Phase 7.2: Solutions Architect + customer architecture + APIs = HIGH or RELEVANT", () => {
  const match = evaluateJobMatch(
    {
      title: "Solutions Architect",
      company: "Global Integration Ltd",
      location: "Bangalore, India",
      remoteType: "HYBRID",
      skills: ["REST APIs", "GraphQL", "Node.js"],
      description: "Customer architecture and technical consulting for enterprise client delivery. Lead integration architecture and REST APIs. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.ok(
    match.careerFit === "HIGH_RELEVANCE" || match.careerFit === "RELEVANT",
    `Expected HIGH_RELEVANCE or RELEVANT, got ${match.careerFit}`
  );
  assert.ok(
    match.applicationRecommendation === "APPLY_NOW" || match.applicationRecommendation === "REVIEW",
    `Expected APPLY_NOW or REVIEW, got ${match.applicationRecommendation}`
  );
});

// 7. India + EMEA customer + travel = India -> EMEA
test("Phase 7.2: India + EMEA customer + travel = India -> EMEA", () => {
  const location = "Mumbai, India";
  const desc = "Solutions Architect engaging directly with enterprise customers across EMEA. 25% international travel to customer sites in Europe.";

  const marketResult = classifyMarketAndEmeaCountry(location, desc);
  const travel = extractTravelDetails(desc);
  const indiaCheck = checkIndiaEligibility(location, "HYBRID", desc);
  const oppTypeResult = classifyOpportunityTypes({
    market: marketResult.market,
    remoteType: "HYBRID",
    location,
    isIndiaEligible: indiaCheck.isIndiaEligible,
    travel,
    description: desc,
  });

  assert.strictEqual(marketResult.market, "INDIA", "Market must be INDIA, not EMEA");
  assert.strictEqual(oppTypeResult.isIndiaToEmea, true, "isIndiaToEmea must be true");
  assert.strictEqual(oppTypeResult.customerRegion, "EMEA", "Customer region must be EMEA");
  assert.strictEqual(travel.percentage, 25, "Travel percentage must be 25%");

  const match = evaluateJobMatch(
    {
      title: "Solutions Architect",
      company: "TravelTech",
      location,
      remoteType: "HYBRID",
      skills: ["REST APIs", "React"],
      description: desc,
      market: marketResult.market,
      isIndiaToEmea: oppTypeResult.isIndiaToEmea,
      customerRegion: oppTypeResult.customerRegion,
      travelPercentage: travel.percentage,
      travelType: travel.type,
      travelEvidence: travel.evidence,
    },
    defaultSearchProfile
  );

  assert.ok(
    match.applicationRecommendation === "APPLY_NOW" || match.applicationRecommendation === "REVIEW",
    `Expected APPLY_NOW or REVIEW, got ${match.applicationRecommendation}`
  );
});

// 8. London + UK work authorization = EMEA local, not India eligible
test("Phase 7.2: London + UK work authorization = EMEA local, not India eligible", () => {
  const location = "London, UK";
  const desc = "Frontend Architect role. Must have valid UK work authorization. No visa sponsorship available.";
  const marketResult = classifyMarketAndEmeaCountry(location, desc);
  const indiaCheck = checkIndiaEligibility(location, "ONSITE", desc);
  const workAuth = classifyWorkAuthorization(location, desc, indiaCheck.isIndiaEligible);
  const oppTypes = classifyOpportunityTypes({
    market: marketResult.market,
    emeaCountry: marketResult.emeaCountry,
    remoteType: "ONSITE",
    location,
    isIndiaEligible: indiaCheck.isIndiaEligible,
    description: desc,
  });

  assert.strictEqual(marketResult.market, "EMEA", "Market should be EMEA");
  assert.strictEqual(oppTypes.primary, "EMEA_LOCAL", "Opportunity type should be EMEA_LOCAL");
  assert.strictEqual(indiaCheck.isIndiaEligible, false, "India eligible must be false");
  assert.strictEqual(workAuth.authorization, "LOCAL_WORK_AUTH_REQUIRED", "Work auth must be LOCAL_WORK_AUTH_REQUIRED");

  const match = evaluateJobMatch(
    {
      title: "Frontend Architect",
      company: "London Fintech",
      location,
      remoteType: "ONSITE",
      skills: ["React", "TypeScript"],
      description: desc,
      market: marketResult.market,
      opportunityType: oppTypes.primary,
      workAuthorization: workAuth.authorization,
    },
    defaultSearchProfile
  );

  // Must not be APPLY_NOW since it requires local work auth and candidate is in India
  assert.notStrictEqual(match.applicationRecommendation, "APPLY_NOW");
  assert.ok(
    match.applicationRecommendation === "REVIEW" || match.applicationRecommendation === "WATCH",
    `Expected REVIEW or WATCH, got ${match.applicationRecommendation}`
  );
});

// 9. Multi-region remote = GLOBAL/MULTI_REGION, not EMEA
test("Phase 7.2: Multi-region remote = GLOBAL/MULTI_REGION, not EMEA", () => {
  const location = "Northern America, LATAM, Europe, APAC";
  const marketResult = classifyMarketAndEmeaCountry(location, "Remote across multiple continents");

  assert.notStrictEqual(marketResult.market, "EMEA", "Multi-region must NOT be classified as EMEA");
  assert.ok(
    marketResult.market === "GLOBAL_REMOTE" || marketResult.market === "MULTI_REGION_REMOTE",
    `Expected GLOBAL_REMOTE or MULTI_REGION_REMOTE, got ${marketResult.market}`
  );
});

// 10. Unknown salary does not produce SKIP
test("Phase 7.2: Unknown salary does NOT produce SKIP", () => {
  const match = evaluateJobMatch(
    {
      title: "Technical Architect - Digital Experience",
      company: "Modern Web Inc",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["React", "Node.js", "Contentful"],
      description: "Lead technical architecture and CMS solutions. Competitive compensation package. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(
    match.applicationRecommendation,
    "SKIP",
    "Undisclosed salary must NOT produce SKIP"
  );
  assert.strictEqual(
    match.applicationRecommendation,
    "APPLY_NOW",
    "Target architect with undisclosed salary should still be APPLY_NOW"
  );
});

// 11. LOW career fit = SKIP
test("Phase 7.2: LOW career fit = SKIP", () => {
  const match = evaluateJobMatch(
    {
      title: "Senior Technical Recruiter",
      company: "Talent Source",
      location: "Hyderabad, India",
      remoteType: "REMOTE",
      skills: [],
      description: "Recruit engineering talent for scaling startups.",
      salaryDisclosed: true,
      salaryLpaMin: 35,
    },
    defaultSearchProfile
  );

  assert.strictEqual(match.careerFit, "LOW_RELEVANCE", "Non-technical role must be LOW_RELEVANCE");
  assert.strictEqual(
    match.applicationRecommendation,
    "SKIP",
    "LOW_RELEVANCE role must be recommended as SKIP"
  );
});

// 12. Fit Dimensions exposed with evidence
test("Phase 7.2: 7 Fit Dimensions exposed with evidence", () => {
  const match = evaluateJobMatch(
    {
      title: "Solutions Architect - Headless Commerce",
      company: "Global Commerce Ltd",
      location: "Mumbai, India",
      remoteType: "HYBRID",
      skills: ["Shopify", "React", "REST APIs"],
      description: "Customer architecture and technical consulting for enterprise retail clients in EMEA. 20% international travel. 12+ years experience.",
      salaryDisclosed: false,
    },
    defaultSearchProfile
  );

  assert.ok(match.technologyFit, "technologyFit must be present");
  assert.ok(match.technologyFit.matched, "technologyFit.matched must be true");
  assert.ok(match.technologyFit.evidence.length > 0, "technologyFit must have evidence");

  assert.ok(match.domainFit, "domainFit must be present");
  assert.ok(match.domainFit.matched, "domainFit.matched must be true");

  assert.ok(match.architectureFit, "architectureFit must be present");
  assert.strictEqual(match.architectureFit.strength, "STRONG", "architectureFit should be STRONG");

  assert.ok(match.clientConsultingFit, "clientConsultingFit must be present");
  assert.strictEqual(match.clientConsultingFit.strength, "STRONG", "clientConsultingFit should be STRONG");

  assert.ok(match.seniorityFit, "seniorityFit must be present");
  assert.ok(match.seniorityFit.matched, "seniorityFit.matched must be true");

  assert.ok(match.locationFit, "locationFit must be present");
  assert.ok(match.locationFit.matched, "locationFit.matched must be true");

  assert.ok(match.internationalFit, "internationalFit must be present");
  assert.strictEqual(match.internationalFit.strength, "STRONG", "internationalFit should be STRONG");
});
