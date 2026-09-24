import test from "node:test";
import assert from "node:assert/strict";
import { AshbyCareerProvider } from "../services/job-providers/AshbyCareerProvider.ts";
import { LeverCareerProvider } from "../services/job-providers/LeverCareerProvider.ts";
import { HimalayasJobProvider } from "../services/job-providers/HimalayasJobProvider.ts";
import { GreenhouseCareerProvider } from "../services/job-providers/GreenhouseCareerProvider.ts";
import { deduplicateJobs } from "../lib/deduplication.ts";
import { classifyLocation } from "../lib/locationClassifier.ts";
import { classifyMarketAndEmeaCountry } from "../lib/marketClassifier.ts";
import { extractTravelDetails } from "../lib/travelExtractor.ts";
import { classifyWorkAuthorization } from "../lib/workAuthorizationClassifier.ts";
import { classifyInternationalExposure } from "../lib/internationalExposure.ts";
import type { Job } from "../types/index.ts";

test("Phase 8: AshbyCareerProvider lists all configured boards", () => {
  const provider = new AshbyCareerProvider();
  assert.equal(provider.id, "ashby");
  assert.equal(provider.isConfigured, true);
  const boards = provider.getBoardsQueried();
  assert.ok(boards.includes("sanity"), "Should include Sanity.io");
  assert.ok(boards.includes("sentry"), "Should include Sentry");
  assert.ok(boards.includes("linear"), "Should include Linear");
  assert.ok(boards.includes("supabase"), "Should include Supabase");
  assert.ok(boards.length >= 10, "Should configure at least 10 Ashby boards");
});

test("Phase 8: LeverCareerProvider lists all configured boards", () => {
  const provider = new LeverCareerProvider();
  assert.equal(provider.id, "lever");
  assert.equal(provider.isConfigured, true);
  const boards = provider.getBoardsQueried();
  assert.ok(boards.includes("palantir"), "Should include Palantir");
  assert.ok(boards.includes("spotify"), "Should include Spotify");
  assert.ok(boards.includes("coupa"), "Should include Coupa");
  assert.ok(boards.includes("cred"), "Should include CRED");
  assert.ok(boards.includes("meesho"), "Should include Meesho");
});

test("Phase 8: GreenhouseCareerProvider expanded board catalog", () => {
  const provider = new GreenhouseCareerProvider();
  assert.equal(provider.id, "greenhouse");
  assert.equal(provider.isConfigured, true);
  const boards = provider.getBoardsQueried();
  assert.ok(boards.includes("contentful"), "Should include Contentful");
  assert.ok(boards.includes("storyblok"), "Should include Storyblok");
  assert.ok(boards.includes("commercetools"), "Should include commercetools");
  assert.ok(boards.includes("bloomreach"), "Should include Bloomreach");
  assert.ok(boards.includes("thoughtworks"), "Should include Thoughtworks");
  assert.ok(boards.includes("slalom"), "Should include Slalom");
  assert.ok(boards.length >= 20, "Should configure at least 20 Greenhouse boards");
});

test("Phase 8: HimalayasJobProvider configuration and defaults", () => {
  const provider = new HimalayasJobProvider();
  assert.equal(provider.id, "himalayas");
  assert.equal(provider.isConfigured, true);
});

test("Phase 8: Missing fields and malformed data handling", () => {
  // Test location classifier with empty/missing values
  const emptyLoc = classifyLocation("", "REMOTE");
  assert.equal(emptyLoc, "UNKNOWN");

  // Test travel extractor with empty string
  const emptyTravel = extractTravelDetails("");
  assert.equal(emptyTravel.type, "NO_TRAVEL_MENTIONED");
  assert.equal(emptyTravel.percentage, undefined);

  // Test work authorization with unknown text and not India eligible
  const unknownAuth = classifyWorkAuthorization("Remote", "We are hiring a frontend architect.", false);
  assert.equal(unknownAuth.authorization, "UNKNOWN");
});

test("Phase 8: Location normalization & remote classification", () => {
  // India locations
  const hydLoc = classifyLocation("Hyderabad, India", "ONSITE");
  assert.equal(hydLoc, "HYDERABAD");

  const blrLoc = classifyLocation("Bengaluru, Karnataka, India", "HYBRID");
  assert.equal(blrLoc, "BANGALORE");

  // Worldwide Remote
  const remoteLoc = classifyLocation("Worldwide Remote (India eligible)", "REMOTE");
  assert.equal(remoteLoc, "REMOTE_GLOBAL");

  // EMEA Market
  const londonLoc = classifyMarketAndEmeaCountry("London, United Kingdom");
  assert.equal(londonLoc.market, "EMEA");
  assert.equal(londonLoc.emeaCountry, "UK");

  const berlinLoc = classifyMarketAndEmeaCountry("Berlin, Germany");
  assert.equal(berlinLoc.market, "EMEA");
  assert.equal(berlinLoc.emeaCountry, "GERMANY");

  // North America Market
  const usLoc = classifyMarketAndEmeaCountry("San Francisco, CA, USA");
  assert.equal(usLoc.market, "NORTH_AMERICA");

  // India Market
  const indiaLoc = classifyMarketAndEmeaCountry("Pune, Maharashtra, India");
  assert.equal(indiaLoc.market, "INDIA");
});

test("Phase 8: International customer detection & travel extraction", () => {
  const jobText = "Solutions Architect based in Bengaluru serving EMEA enterprise customers with 20% travel to client sites in London and Frankfurt.";
  const travel = extractTravelDetails(jobText);
  assert.equal(travel.type, "INTERNATIONAL_TRAVEL");
  assert.equal(travel.percentage, 20);
  assert.ok(travel.evidence.length > 0);

  const exposure = classifyInternationalExposure(jobText, travel);
  assert.ok(exposure.exposure !== "NONE_MENTIONED");
  assert.ok(exposure.evidence.length > 0);
});

test("Phase 8: Deduplication and source provenance preservation across providers", () => {
  const job1 = {
    id: "job-1",
    title: "Senior Solutions Architect",
    company: "Acme Cloud Corp",
    location: "Bengaluru, India",
    remoteType: "HYBRID",
    status: "DISCOVERED",
    source: "Greenhouse",
    url: "https://boards.greenhouse.io/acme/jobs/123",
    postedAt: "2026-03-20T10:00:00Z",
    discoveredAt: "2026-03-20T10:00:00Z",
    skills: ["React", "TypeScript"],
    experienceMin: 10,
    experienceMax: 15,
    roleFamily: "SOLUTIONS_ARCHITECT",
    seniority: "LEAD",
    isIndiaEligible: true,
    travel: { type: "NO_TRAVEL_MENTIONED", percentage: 0, destinations: [], evidence: "No travel mentioned" },
    opportunityPriority: "PRIORITY",
    opportunityPriorityReasons: ["Strong architecture fit"],
    opportunityTypes: ["INDIA_LOCAL"],
    freshness: "FRESH",
    postedDaysAgo: 1,
    domains: ["SOLUTIONS_ARCHITECTURE"],
    domainMatches: [],
    careerFit: "HIGH_RELEVANCE",
    match: {
      overallScore: 85,
    },
    dataQualityWarnings: [],
  } as unknown as Job;

  const job2Duplicate = {
    ...job1,
    id: "job-2",
    source: "Ashby",
    url: "https://jobs.ashbyhq.com/acme/abc-456",
    discoveredAt: "2026-03-21T12:00:00Z",
    skills: ["React", "TypeScript", "Node.js", "GraphQL"],
    salaryDisclosed: true,
    salaryLpaMin: 45,
    salaryLpaMax: 60,
  } as unknown as Job;

  const deduplicated = deduplicateJobs([job1, job2Duplicate]);

  // Should merge into 1 job
  assert.equal(deduplicated.length, 1, "Duplicate jobs should merge into a single job");
  const merged = deduplicated[0];

  // Preserved primary identity
  assert.equal(merged.company, "Acme Cloud Corp");
  assert.equal(merged.id, "job-1");

  // Enriched salary and skills
  assert.equal(merged.salaryDisclosed, true);
  assert.equal(merged.salaryLpaMin, 45);
  assert.ok(merged.skills.includes("GraphQL"));

  // Preserved provenance in otherSources
  assert.ok(merged.otherSources, "otherSources should exist");
  assert.equal(merged.otherSources?.length, 2, "Both primary and duplicate source should be tracked");
  const sources = merged.otherSources?.map((s) => s.source);
  assert.ok(sources?.includes("Greenhouse"));
  assert.ok(sources?.includes("Ashby"));
});
