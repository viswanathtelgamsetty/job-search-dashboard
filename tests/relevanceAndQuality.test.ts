import test from "node:test";
import assert from "node:assert";
import { classifyRoleFamily } from "../lib/roleClassifier.ts";
import { detectSeniority } from "../lib/seniorityDetector.ts";
import { extractAndNormalizeTechnologies, normalizeTechnology } from "../lib/technologyNormalizer.ts";
import { classifyLocation, checkIndiaEligibility } from "../lib/locationClassifier.ts";
import { parseAndNormalizeSalary } from "../lib/salaryParser.ts";
import { extractTravelDetails } from "../lib/travelExtractor.ts";
import { evaluateJobMatch } from "../lib/matchingEngine.ts";
import { defaultSearchProfile } from "../config/defaultProfile.ts";

// 1. Role Family Classification Tests
test("Role Family: Frontend Architect positive match", () => {
  const result = classifyRoleFamily("Lead Frontend Architect - Digital Platforms");
  assert.strictEqual(result.primary, "FRONTEND_ARCHITECT");
});

test("Role Family: Solutions Architect positive match", () => {
  const result = classifyRoleFamily("Senior Solutions Architect - Cloud & Modern Web");
  assert.strictEqual(result.primary, "SOLUTIONS_ARCHITECT");
});

test("Role Family: CMS & Digital Experience positive match", () => {
  const result = classifyRoleFamily("Contentful & Headless CMS Solution Lead");
  assert.strictEqual(result.primary, "CMS_DIGITAL_EXPERIENCE");
});

test("Role Family: Commerce Architect positive match", () => {
  const result = classifyRoleFamily("eCommerce Solutions Consultant (Shopify / commercetools)");
  assert.strictEqual(result.primary, "COMMERCE");
});

test("Role Family: Negative case - General role falls back to OTHER", () => {
  const result = classifyRoleFamily("Operations Specialist");
  assert.strictEqual(result.primary, "OTHER");
});

// 2. Seniority Classification Tests
test("Seniority: Architect detected from title", () => {
  const result = detectSeniority("Principal Software Architect");
  assert.strictEqual(result.level, "ARCHITECT");
});

test("Seniority: Lead detected from title", () => {
  const result = detectSeniority("Technical Lead - Frontend");
  assert.strictEqual(result.level, "LEAD");
});

test("Seniority: 10+ years detected from description", () => {
  const result = detectSeniority("Engineering Specialist", "Requires 12+ years experience in frontend architecture");
  assert.strictEqual(result.level, "ARCHITECT");
});

test("Seniority: Entry level negative case", () => {
  const result = detectSeniority("Junior Web Developer / Intern");
  assert.strictEqual(result.level, "ENTRY");
});

test("Seniority: Unknown when no hints", () => {
  const result = detectSeniority("Specialist", "Work on tasks");
  assert.strictEqual(result.level, "UNKNOWN");
});

// 3. Technology Normalization Tests
test("Technology Normalization: Maps variations to canonical names", () => {
  assert.strictEqual(normalizeTechnology("react.js"), "React");
  assert.strictEqual(normalizeTechnology("NextJS"), "Next.js");
  assert.strictEqual(normalizeTechnology("angularjs"), "Angular");
  assert.strictEqual(normalizeTechnology("ts"), "TypeScript");
  assert.strictEqual(normalizeTechnology("nodejs"), "Node.js");
  assert.strictEqual(normalizeTechnology("contentful"), "Contentful");
  assert.strictEqual(normalizeTechnology("strapi"), "Headless CMS");
});

test("Technology Extraction: Extracts and normalizes skills from text", () => {
  const techs = extractAndNormalizeTechnologies(
    ["React", "Next.js"],
    "Building headless CMS platforms with Contentful, TypeScript and GraphQL on AWS"
  );
  assert.ok(techs.includes("React"));
  assert.ok(techs.includes("Next.js"));
  assert.ok(techs.includes("Contentful"));
  assert.ok(techs.includes("TypeScript"));
  assert.ok(techs.includes("GraphQL"));
});

// 4. Location Normalization Tests
test("Location Normalization: Hyderabad Tech Hub", () => {
  assert.strictEqual(classifyLocation("Hyderabad, Telangana, India"), "HYDERABAD");
  assert.strictEqual(classifyLocation("HITEC City, Hyderabad"), "HYDERABAD");
});

test("Location Normalization: Bangalore Hub", () => {
  assert.strictEqual(classifyLocation("Bengaluru, Karnataka"), "BANGALORE");
});

test("Location Normalization: Pune Hub", () => {
  assert.strictEqual(classifyLocation("Hinjewadi, Pune"), "PUNE");
});

test("Location Normalization: Remote India", () => {
  assert.strictEqual(classifyLocation("India (Remote)", "REMOTE"), "REMOTE_INDIA");
});

test("Location Normalization: Remote Global", () => {
  assert.strictEqual(classifyLocation("Worldwide Remote"), "REMOTE_GLOBAL");
});

// 5. Remote India Eligibility Tests
test("India Eligibility: Explicit Indian Metro is India eligible", () => {
  const res = checkIndiaEligibility("Hyderabad, India");
  assert.strictEqual(res.isIndiaEligible, true);
});

test("India Eligibility: Worldwide remote allows India", () => {
  const res = checkIndiaEligibility("Worldwide Remote", "REMOTE");
  assert.strictEqual(res.isIndiaEligible, true);
});

test("India Eligibility: US-only restriction is NOT India eligible", () => {
  const res = checkIndiaEligibility("Remote (US Only)", "REMOTE", "Must reside in the US");
  assert.strictEqual(res.isIndiaEligible, false);
});

test("India Eligibility: Generic remote without worldwide confirmation is NOT India eligible", () => {
  const res = checkIndiaEligibility("Remote", "REMOTE");
  assert.strictEqual(res.isIndiaEligible, false);
});

// 6. Travel Classification Tests
test("Travel: International Travel with percentage", () => {
  const res = extractTravelDetails("Requires international travel to US customer locations up to 20%");
  assert.strictEqual(res.type, "INTERNATIONAL_TRAVEL");
  assert.strictEqual(res.percentage, 20);
});

test("Travel: International Team Only (not physical travel)", () => {
  const res = extractTravelDetails("Collaborate with US-based engineering stakeholders and global teams");
  assert.strictEqual(res.type, "INTERNATIONAL_TEAM_ONLY");
});

test("Travel: No Travel Mentioned", () => {
  const res = extractTravelDetails("Build scalable web apps using Next.js and TypeScript");
  assert.strictEqual(res.type, "NO_TRAVEL_MENTIONED");
});

test("Travel: Relocation Required", () => {
  const res = extractTravelDetails("Relocation to London, UK required for this role");
  assert.strictEqual(res.type, "RELOCATION");
});

// 7. Salary Parsing & Quality Tests
test("Salary Quality: Disclosed LPA range in INR", () => {
  const res = parseAndNormalizeSalary("35 - 45 LPA", undefined, undefined, "INR");
  assert.strictEqual(res.salaryState, "SALARY_RANGE");
  assert.strictEqual(res.lpaMin, 35);
  assert.strictEqual(res.lpaMax, 45);
  assert.strictEqual(res.isEstimated, false);
});

test("Salary Quality: Foreign USD salary marked as SALARY_ESTIMATED and retains USD source", () => {
  const res = parseAndNormalizeSalary("$140k - $180k", 140000, 180000, "USD");
  assert.strictEqual(res.salaryState, "SALARY_ESTIMATED");
  assert.strictEqual(res.isEstimated, true);
  assert.strictEqual(res.originalCurrency, "USD");
  assert.ok(res.originalSalary?.includes("$140k"));
  assert.ok(res.convertedSalary?.includes("est."));
});

test("Salary Quality: Undisclosed marked as SALARY_NOT_DISCLOSED", () => {
  const res = parseAndNormalizeSalary(undefined, undefined, undefined, "INR");
  assert.strictEqual(res.salaryState, "SALARY_NOT_DISCLOSED");
  assert.strictEqual(res.isDisclosed, false);
});

// 8. Deterministic Relevance Engine Tests
test("Relevance: High relevance for Senior Architect with React/CMS in Hyderabad", () => {
  const match = evaluateJobMatch(
    {
      title: "Senior Frontend Architect",
      company: "Enterprise Co",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["React", "Next.js", "Contentful", "TypeScript"],
      roleFamily: "FRONTEND_ARCHITECT",
      seniority: "ARCHITECT",
      experienceMin: 12,
      travelType: "INTERNATIONAL_TRAVEL",
      travelPercentage: 15,
      travelEvidence: "15% international travel to USA",
    },
    defaultSearchProfile
  );

  assert.strictEqual(match.relevanceBucket, "HIGH_RELEVANCE");
  assert.ok(match.reasons.length >= 2);
  assert.ok(match.reasons.some((r) => r.includes("Frontend Architect")));
});

test("Relevance: Low relevance for Junior Dev outside profile", () => {
  const match = evaluateJobMatch(
    {
      title: "Junior Python Intern",
      company: "Startup Co",
      location: "Berlin, Germany",
      remoteType: "ONSITE",
      skills: ["Python"],
      roleFamily: "OTHER",
      seniority: "ENTRY",
      experienceMin: 0,
      travelType: "NO_TRAVEL_MENTIONED",
    },
    defaultSearchProfile
  );

  assert.strictEqual(match.relevanceBucket, "LOW_RELEVANCE");
  assert.ok(match.cautions.length > 0);
});

test("Relevance: Relevant for Tech Lead in Bangalore with React", () => {
  const match = evaluateJobMatch(
    {
      title: "Technical Lead",
      company: "Tech Corp",
      location: "Bangalore, India",
      remoteType: "REMOTE",
      skills: ["React", "TypeScript", "Node.js"],
      roleFamily: "TECHNICAL_LEAD",
      seniority: "LEAD",
      experienceMin: 10,
      travelType: "NO_TRAVEL_MENTIONED",
    },
    defaultSearchProfile
  );

  assert.ok(match.relevanceBucket === "HIGH_RELEVANCE" || match.relevanceBucket === "RELEVANT");
});
