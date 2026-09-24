import test from "node:test";
import assert from "node:assert";
import { classifyMarketAndEmeaCountry } from "../lib/marketClassifier.ts";
import { classifyWorkAuthorization } from "../lib/workAuthorizationClassifier.ts";
import {
  classifyInternationalExposure,
  classifyClientFacing,
} from "../lib/internationalExposure.ts";
import { classifyOpportunityTypes } from "../lib/opportunityType.ts";
import { evaluateInternationalOpportunity } from "../lib/internationalOpportunity.ts";
import { extractTravelDetails } from "../lib/travelExtractor.ts";
import { classifyRoleFamily } from "../lib/roleClassifier.ts";
import { detectSeniority } from "../lib/seniorityDetector.ts";
import { classifyLocation } from "../lib/locationClassifier.ts";
import { extractActualJobTechnologies } from "../lib/technologyMatcher.ts";
import { extractDomainMatches, getPrimaryDomains } from "../lib/domainMatcher.ts";
import { evaluateJobMatch } from "../lib/matchingEngine.ts";
import { defaultSearchProfile } from "../config/defaultProfile.ts";

// ==================================================
// PHASE 7: 23 REGRESSION SCENARIOS TEST SUITE
// ==================================================

test("Scenario 1: Senior Frontend Architect + React + India → high career fit", () => {
  const title = "Senior Frontend Architect";
  const desc = "Lead enterprise design system and modern microfrontends using React, TypeScript and Next.js.";
  const location = "Bangalore, India";

  const seniority = detectSeniority(title, desc);
  const roleClassification = classifyRoleFamily(title, desc);
  const actualTech = extractActualJobTechnologies(["React", "TypeScript", "Next.js"], `${title} ${desc}`);
  const domainMatches = extractDomainMatches(title, desc, actualTech);
  const primaryDomains = getPrimaryDomains(domainMatches);

  const match = evaluateJobMatch(
    {
      title,
      company: "Tech Corp",
      location,
      remoteType: "HYBRID",
      skills: actualTech,
      roleFamily: roleClassification.primary,
      seniority: seniority.level,
      experienceMin: 12,
      salaryLpaMin: 55,
      salaryDisclosed: true,
      travelType: "NO_TRAVEL_MENTIONED",
      description: desc,
    },
    defaultSearchProfile
  );

  assert.strictEqual(match.relevanceBucket, "HIGH_RELEVANCE");
  assert.ok(primaryDomains.includes("FRONTEND"));
  assert.ok(primaryDomains.includes("TECHNICAL_ARCHITECTURE") || roleClassification.primary === "FRONTEND_ARCHITECT");
});

test("Scenario 2: Technical Architect + APIs + India + EMEA customers → high/relevant international opportunity", () => {
  const title = "Technical Architect";
  const desc = "Architect REST APIs and integrations, working directly with enterprise customers across EMEA.";
  const location = "Hyderabad, India";

  const travel = extractTravelDetails(`${title} ${location} ${desc}`);
  const market = classifyMarketAndEmeaCountry(location, desc);
  const exposure = classifyInternationalExposure(`${title} ${location} ${desc}`, travel);
  const clientFacing = classifyClientFacing(desc, title);
  const oppTypes = classifyOpportunityTypes({
    market: market.market,
    emeaCountry: market.emeaCountry,
    remoteType: "HYBRID",
    location,
    isIndiaEligible: true,
    clientFacing: clientFacing.status,
    internationalExposure: exposure.exposure,
    travel,
    description: desc,
  });

  const intlOpp = evaluateInternationalOpportunity({
    careerFit: "HIGH_RELEVANCE",
    market: market.market,
    emeaCountry: market.emeaCountry,
    isIndiaEligible: true,
    clientFacing: clientFacing.status,
    internationalExposure: exposure.exposure,
    travel,
    workAuthorization: "INDIA_ELIGIBLE",
    freshness: "FRESH",
    seniority: "ARCHITECT",
    roleFamily: "TECHNICAL_ARCHITECT",
    isIndiaToEmea: oppTypes.isIndiaToEmea,
  });

  assert.strictEqual(exposure.exposure, "INTERNATIONAL_CUSTOMERS");
  assert.strictEqual(clientFacing.status, "YES");
  assert.strictEqual(oppTypes.isIndiaToEmea, true);
  assert.ok(
    intlOpp.bucket === "INTERNATIONAL_PRIORITY" || intlOpp.bucket === "INTERNATIONAL_ACTIVE",
    `Expected priority or active, got ${intlOpp.bucket}`
  );
});

test("Scenario 3: Solutions Architect + India + 25% international travel → international opportunity", () => {
  const desc = "Lead customer architecture with 25% international travel to global client sites.";
  const travel = extractTravelDetails(desc);

  assert.ok(travel.type === "INTERNATIONAL_TRAVEL" || travel.type === "CLIENT_SITE_TRAVEL");
  assert.strictEqual(travel.percentage, 25);
  assert.strictEqual(travel.travelCategory, "TRAVEL_20_30");

  const exposure = classifyInternationalExposure(desc, travel);
  const intlOpp = evaluateInternationalOpportunity({
    careerFit: "HIGH_RELEVANCE",
    market: "INDIA",
    isIndiaEligible: true,
    clientFacing: "YES",
    internationalExposure: exposure.exposure,
    travel,
    workAuthorization: "INDIA_ELIGIBLE",
    freshness: "FRESH",
    seniority: "ARCHITECT",
    roleFamily: "SOLUTIONS_ARCHITECT",
    isIndiaToEmea: false,
  });

  assert.ok(
    intlOpp.bucket === "INTERNATIONAL_PRIORITY" || intlOpp.bucket === "INTERNATIONAL_ACTIVE",
    `Expected international priority/active, got ${intlOpp.bucket}`
  );
});

test("Scenario 4: Solutions Architect + EMEA + local work authorization → EMEA opportunity", () => {
  const location = "Berlin, Germany";
  const desc = "Solutions Architect for cloud platform. Must have valid German / EU work authorization.";
  const market = classifyMarketAndEmeaCountry(location, desc);
  const workAuth = classifyWorkAuthorization(location, desc, false);

  assert.strictEqual(market.market, "EMEA");
  assert.strictEqual(market.emeaCountry, "GERMANY");
  assert.strictEqual(workAuth.authorization, "LOCAL_WORK_AUTH_REQUIRED");
});

test("Scenario 5: Solutions Architect + UK + sponsorship available → EMEA opportunity", () => {
  const location = "London, UK";
  const desc = "Enterprise Solutions Architect. Visa sponsorship available for qualified candidates.";
  const market = classifyMarketAndEmeaCountry(location, desc);
  const workAuth = classifyWorkAuthorization(location, desc, false);

  assert.strictEqual(market.market, "EMEA");
  assert.strictEqual(market.emeaCountry, "UK");
  assert.strictEqual(workAuth.authorization, "SPONSORSHIP_AVAILABLE");
});

test("Scenario 6: Senior Frontend Engineer + London → EMEA", () => {
  const location = "London, United Kingdom";
  const desc = "Building high-performance React UI applications in our London headquarters.";
  const market = classifyMarketAndEmeaCountry(location, desc);

  assert.strictEqual(market.market, "EMEA");
  assert.strictEqual(market.emeaCountry, "UK");
});

test("Scenario 7: Senior Frontend Engineer + Remote India → India Remote", () => {
  const location = "Remote - India";
  const normalized = classifyLocation(location, "REMOTE");
  const market = classifyMarketAndEmeaCountry(location);
  const oppTypes = classifyOpportunityTypes({
    market: market.market,
    remoteType: "REMOTE",
    location,
    isIndiaEligible: true,
  });

  assert.strictEqual(normalized, "REMOTE_INDIA");
  assert.strictEqual(market.market, "INDIA");
  assert.strictEqual(oppTypes.primary, "INDIA_REMOTE");
});

test("Scenario 8: Senior Frontend Engineer + global remote → Global Remote", () => {
  const location = "Worldwide / Anywhere in the World (Remote)";
  const normalized = classifyLocation(location, "REMOTE");
  const market = classifyMarketAndEmeaCountry(location);
  const oppTypes = classifyOpportunityTypes({
    market: market.market,
    remoteType: "REMOTE",
    location,
    isIndiaEligible: true,
  });

  assert.strictEqual(normalized, "REMOTE_GLOBAL");
  assert.strictEqual(market.market, "GLOBAL_REMOTE");
  assert.strictEqual(oppTypes.primary, "GLOBAL_REMOTE");
});

test("Scenario 9: Data Scientist + React tag → must NOT become Frontend", () => {
  const title = "Senior Data Scientist";
  const desc = "Build NLP and predictive ML models in Python, PyTorch. Some dashboards built with React.";
  const skills = ["Python", "PyTorch", "React"];

  const role = classifyRoleFamily(title, desc);
  const domainMatches = extractDomainMatches(title, desc, skills);
  const primaryDomains = getPrimaryDomains(domainMatches);

  const match = evaluateJobMatch(
    {
      title,
      company: "Analytics AI",
      location: "Bangalore",
      remoteType: "HYBRID",
      skills,
      roleFamily: role.primary,
      seniority: "SENIOR",
      description: desc,
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(role.primary, "FRONTEND_ARCHITECT");
  assert.notStrictEqual(role.primary, "SENIOR_FRONTEND");
  assert.ok(!primaryDomains.includes("FRONTEND"), "Primary domains must NOT include FRONTEND");
  assert.strictEqual(match.relevanceBucket, "LOW_RELEVANCE");
});

test("Scenario 10: QA Engineer + Docker → must NOT become DevOps automatically", () => {
  const title = "Senior QA Automation Engineer";
  const desc = "Automate regression test suites using Cypress and run tests inside Docker containers.";
  const skills = ["Cypress", "Selenium", "Docker"];

  const role = classifyRoleFamily(title, desc);
  const domainMatches = extractDomainMatches(title, desc, skills);
  const primaryDomains = getPrimaryDomains(domainMatches);

  const match = evaluateJobMatch(
    {
      title,
      company: "QualityLab",
      location: "Remote India",
      remoteType: "REMOTE",
      skills,
      roleFamily: role.primary,
      seniority: "SENIOR",
      description: desc,
    },
    defaultSearchProfile
  );

  assert.notStrictEqual(role.primary, "DEVOPS");
  assert.ok(!primaryDomains.includes("DEVOPS"), "Primary domains must NOT include DEVOPS");
  assert.strictEqual(match.relevanceBucket, "LOW_RELEVANCE");
});

test("Scenario 11: Office Assistant + international company → must NOT become international career opportunity", () => {
  const title = "Remote Office Assistant";
  const desc = "Global multinational enterprise looking for an office administrative coordinator. Travel to international branches occasionally.";
  const location = "Remote - India";

  const role = classifyRoleFamily(title, desc);
  const travel = extractTravelDetails(desc);
  const exposure = classifyInternationalExposure(desc, travel);

  const match = evaluateJobMatch(
    {
      title,
      company: "Global Enterprise Inc",
      location,
      remoteType: "REMOTE",
      skills: ["Administrative Support", "Scheduling"],
      roleFamily: role.primary,
      seniority: "MID",
      description: desc,
    },
    defaultSearchProfile
  );

  const intlOpp = evaluateInternationalOpportunity({
    careerFit: match.relevanceBucket,
    market: "INDIA",
    isIndiaEligible: true,
    clientFacing: "NO",
    internationalExposure: exposure.exposure,
    travel,
    workAuthorization: "INDIA_ELIGIBLE",
    freshness: "FRESH",
    seniority: "MID",
    roleFamily: role.primary,
    isIndiaToEmea: false,
  });

  assert.strictEqual(match.relevanceBucket, "LOW_RELEVANCE");
  assert.strictEqual(intlOpp.bucket, "NOT_INTERNATIONAL");
});

test("Scenario 12: Engineering Manager + frontend team → adjacent/managerial, not automatically target architect", () => {
  const title = "Engineering Manager - Frontend Platform";
  const desc = "Manage people and hiring for our frontend engineering team building React web apps.";

  const role = classifyRoleFamily(title, desc);
  const seniority = detectSeniority(title, desc);

  assert.notStrictEqual(role.primary, "FRONTEND_ARCHITECT");
  assert.notStrictEqual(role.primary, "SOLUTIONS_ARCHITECT");
  assert.notStrictEqual(seniority.level, "ARCHITECT");
});

test("Scenario 13: Job mentioning 'global company' → must NOT automatically become international exposure", () => {
  const text = "We are a global company with offices worldwide looking for a backend developer.";
  const travel = extractTravelDetails(text);
  const exposure = classifyInternationalExposure(text, travel);

  assert.strictEqual(exposure.exposure, "NONE_MENTIONED");
});

test("Scenario 14: Job saying 'collaborate with teams in Europe' → INTERNATIONAL_TEAM", () => {
  const text = "You will collaborate with distributed engineering teams in Europe and North America.";
  const exposure = classifyInternationalExposure(text);

  assert.strictEqual(exposure.exposure, "INTERNATIONAL_TEAM");
});

test("Scenario 15: Job saying 'work with EMEA customers' → INTERNATIONAL_CUSTOMERS", () => {
  const text = "Serve as technical lead to work directly with enterprise customers across EMEA.";
  const exposure = classifyInternationalExposure(text);

  assert.strictEqual(exposure.exposure, "INTERNATIONAL_CUSTOMERS");
});

test("Scenario 16: Job saying 'travel 25% to customer sites' → CLIENT_SITE_TRAVEL + TRAVEL_20_30", () => {
  const text = "Travel 25% to customer sites across the region for technical workshops.";
  const travel = extractTravelDetails(text);
  const exposure = classifyInternationalExposure(text, travel);

  assert.strictEqual(travel.type, "CLIENT_SITE_TRAVEL");
  assert.strictEqual(travel.percentage, 25);
  assert.strictEqual(travel.travelCategory, "TRAVEL_20_30");
  assert.strictEqual(exposure.exposure, "CLIENT_SITE_TRAVEL");
});

test("Scenario 17: Job saying 'must have UK work authorization' → LOCAL_WORK_AUTH_REQUIRED", () => {
  const text = "Applicants must have valid UK work authorization. No visa sponsorship provided.";
  const result = classifyWorkAuthorization("London, UK", text, false);

  assert.strictEqual(result.authorization, "LOCAL_WORK_AUTH_REQUIRED");
});

test("Scenario 18: Job saying 'visa sponsorship available' → SPONSORSHIP_AVAILABLE", () => {
  const text = "Visa sponsorship available for outstanding senior architectural talent.";
  const result = classifyWorkAuthorization("Amsterdam, Netherlands", text, false);

  assert.strictEqual(result.authorization, "SPONSORSHIP_AVAILABLE");
});

test("Scenario 19: Missing location → UNKNOWN, not inferred", () => {
  const result = classifyMarketAndEmeaCountry("", "Software role with no location specified");

  assert.strictEqual(result.market, "UNKNOWN");
  assert.strictEqual(result.emeaCountry, undefined);
});

test("Scenario 20: Missing travel → UNKNOWN / NO_TRAVEL_MENTIONED according to existing semantics", () => {
  const travel = extractTravelDetails("Senior engineer to write Clean Code");

  assert.ok(
    travel.type === "NO_TRAVEL_MENTIONED" || travel.type === "TRAVEL_UNKNOWN",
    `Expected NO_TRAVEL_MENTIONED or TRAVEL_UNKNOWN, got ${travel.type}`
  );
});

test("Scenario 21: Company headquartered in Germany but job located India → market should be INDIA unless explicit EMEA scope", () => {
  const location = "Bangalore, India";
  const desc = "Siemens is headquartered in Munich, Germany. We are hiring a Senior Software Engineer in our Bangalore technology center.";
  const result = classifyMarketAndEmeaCountry(location, desc);

  assert.strictEqual(result.market, "INDIA");
});

test("Scenario 22: India job supporting EMEA customers → INDIA + EMEA INTERNATIONAL OPPORTUNITY", () => {
  const location = "Hyderabad, India";
  const desc = "Senior Solution Architect based in India to support enterprise clients across EMEA and Europe.";

  const market = classifyMarketAndEmeaCountry(location, desc);
  const exposure = classifyInternationalExposure(`${location} ${desc}`);
  const clientFacing = classifyClientFacing(desc, "Senior Solution Architect");
  const oppTypes = classifyOpportunityTypes({
    market: market.market,
    remoteType: "ONSITE",
    location,
    isIndiaEligible: true,
    clientFacing: clientFacing.status,
    internationalExposure: exposure.exposure,
    description: desc,
  });

  assert.strictEqual(market.market, "INDIA");
  assert.strictEqual(exposure.exposure, "INTERNATIONAL_CUSTOMERS");
  assert.strictEqual(oppTypes.isIndiaToEmea, true);
  assert.ok(oppTypes.types.includes("INDIA_INTERNATIONAL"));
});

test("Scenario 23: Unrelated job with international travel → must remain LOW career fit", () => {
  const title = "Corporate Office Travel Coordinator";
  const desc = "Manage bookings and logistics with 30% international travel to conference locations.";
  const location = "Mumbai, India";

  const travel = extractTravelDetails(desc);
  const role = classifyRoleFamily(title, desc);

  const match = evaluateJobMatch(
    {
      title,
      company: "TravelCo",
      location,
      remoteType: "ONSITE",
      skills: ["Booking", "Logistics"],
      roleFamily: role.primary,
      seniority: "MID",
      travelType: travel.type,
      travelPercentage: travel.percentage,
      description: desc,
    },
    defaultSearchProfile
  );

  const intlOpp = evaluateInternationalOpportunity({
    careerFit: match.relevanceBucket,
    market: "INDIA",
    isIndiaEligible: true,
    clientFacing: "NO",
    internationalExposure: "INTERNATIONAL_TRAVEL",
    travel,
    workAuthorization: "INDIA_ELIGIBLE",
    freshness: "FRESH",
    seniority: "MID",
    roleFamily: role.primary,
    isIndiaToEmea: false,
  });

  assert.strictEqual(match.relevanceBucket, "LOW_RELEVANCE");
  assert.strictEqual(intlOpp.bucket, "NOT_INTERNATIONAL");
});
