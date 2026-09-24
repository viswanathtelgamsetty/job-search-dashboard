import test from "node:test";
import assert from "node:assert";
import { classifyRoleFamily } from "../lib/roleClassifier.ts";
import { detectSeniority } from "../lib/seniorityDetector.ts";
import { extractAndNormalizeTechnologies, normalizeTechnology } from "../lib/technologyNormalizer.ts";
import { classifyLocation, checkIndiaEligibility } from "../lib/locationClassifier.ts";
import { parseAndNormalizeSalary } from "../lib/salaryParser.ts";
import { extractTravelDetails } from "../lib/travelExtractor.ts";
import { evaluateJobMatch } from "../lib/matchingEngine.ts";
import { extractActualJobTechnologies, matchTargetTechnologies } from "../lib/technologyMatcher.ts";
import { extractDomainMatches } from "../lib/domainMatcher.ts";
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

// 9. Evidence-Based Technology Matching Tests (Phase 3.1)
test("TEST: Job description = 'React and TypeScript required' -> React & TypeScript matched with evidence", () => {
  const desc = "Strong experience with React and TypeScript required for this platform role.";
  const matchResult = matchTargetTechnologies(["React", "TypeScript"], desc, []);
  
  const reactMatch = matchResult.matched.find((m) => m.technology === "React");
  const tsMatch = matchResult.matched.find((m) => m.technology === "TypeScript");

  assert.ok(reactMatch, "React should be in matched list");
  assert.strictEqual(reactMatch?.matched, true);
  assert.ok(reactMatch?.evidence && reactMatch.evidence.includes("React"));

  assert.ok(tsMatch, "TypeScript should be in matched list");
  assert.strictEqual(tsMatch?.matched, true);
  assert.ok(tsMatch?.evidence && tsMatch.evidence.includes("TypeScript"));
});

test("TEST: Job description = 'Java and AWS required' -> React & TypeScript NOT matched", () => {
  const desc = "Java and AWS required for cloud microservices development.";
  const matchResult = matchTargetTechnologies(["React", "TypeScript"], desc, ["Java", "AWS"]);

  const reactMatch = matchResult.unmatched.find((m) => m.technology === "React");
  const tsMatch = matchResult.unmatched.find((m) => m.technology === "TypeScript");

  assert.ok(reactMatch, "React should be in unmatched list");
  assert.strictEqual(reactMatch?.matched, false);
  assert.strictEqual(reactMatch?.evidence, null);

  assert.ok(tsMatch, "TypeScript should be in unmatched list");
  assert.strictEqual(tsMatch?.matched, false);
  assert.strictEqual(tsMatch?.evidence, null);
});

test("TEST: Job title = 'Solutions Architect' -> roleFamily = SOLUTIONS_ARCHITECT & React NOT automatically matched", () => {
  const roleFamilyRes = classifyRoleFamily("Solutions Architect");
  assert.strictEqual(roleFamilyRes.primary, "SOLUTIONS_ARCHITECT");

  const match = evaluateJobMatch(
    {
      title: "Solutions Architect",
      company: "Cloud Systems Inc",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["Java", "AWS", "Kubernetes"],
      roleFamily: "SOLUTIONS_ARCHITECT",
      seniority: "ARCHITECT",
      experienceMin: 12,
      description: "Design cloud enterprise systems using Java, AWS, and Kubernetes.",
    },
    defaultSearchProfile
  );

  // React must NOT be automatically matched
  const reactDetail = match.breakdown.technologyMatch.details?.find((d) => d.technology === "React");
  assert.strictEqual(reactDetail?.matched, false);
  assert.strictEqual(reactDetail?.evidence, null);
  assert.ok(!match.reasons.some((r) => r.includes("React")));
  // Should NOT be HIGH_RELEVANCE because target tech stack is missing
  assert.notStrictEqual(match.relevanceBucket, "HIGH_RELEVANCE");
});

test("TEST: Job title = 'React Architect' -> React matched", () => {
  const title = "React Architect";
  const matchResult = matchTargetTechnologies(["React"], title, []);
  const reactMatch = matchResult.matched.find((m) => m.technology === "React");

  assert.ok(reactMatch, "React should be in matched list");
  assert.strictEqual(reactMatch?.matched, true);
  assert.ok(reactMatch?.evidence?.includes("React"));
});

test("TEST: Job description = 'Experience working with React' -> React matched", () => {
  const desc = "Experience working with React and modern UI libraries is essential.";
  const matchResult = matchTargetTechnologies(["React"], desc, []);
  const reactMatch = matchResult.matched.find((m) => m.technology === "React");

  assert.ok(reactMatch, "React should be in matched list");
  assert.strictEqual(reactMatch?.matched, true);
  assert.ok(reactMatch?.evidence && reactMatch.evidence.includes("React"));
});

test("TEST: Never invent generic technologies (Architecture, Enterprise Solutions)", () => {
  const rawSkills = ["Architecture", "Enterprise Solutions", "Java", "Kubernetes"];
  const actualTechs = extractActualJobTechnologies(rawSkills, "Backend engineer with Java and Kubernetes");

  assert.ok(actualTechs.includes("Java"));
  assert.ok(actualTechs.includes("Kubernetes"));
  assert.ok(!actualTechs.includes("Architecture"), "Architecture should NOT be treated as a technology");
  assert.ok(!actualTechs.includes("Enterprise Solutions"), "Enterprise Solutions should NOT be treated as a technology");
});

test("TEST: High relevance strictly requires target technology match, seniority, role family, and India", () => {
  // A Solutions Architect in Hyderabad requiring AWS & Java without React/CMS is RELEVANT or POSSIBLE, not HIGH_RELEVANCE
  const matchNoTech = evaluateJobMatch(
    {
      title: "Solutions Architect",
      company: "Enterprise Cloud",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["Java", "AWS"],
      roleFamily: "SOLUTIONS_ARCHITECT",
      seniority: "ARCHITECT",
      experienceMin: 12,
      description: "Enterprise Java and AWS architecture.",
    },
    defaultSearchProfile
  );
  assert.notStrictEqual(matchNoTech.relevanceBucket, "HIGH_RELEVANCE");

  // An Architect in Hyderabad WITH Contentful, Next.js, and TypeScript IS HIGH_RELEVANCE
  const matchWithTech = evaluateJobMatch(
    {
      title: "Digital Experience Architect",
      company: "Modern Web Co",
      location: "Hyderabad, India",
      remoteType: "HYBRID",
      skills: ["Contentful", "Next.js", "TypeScript"],
      roleFamily: "CMS_DIGITAL_EXPERIENCE",
      seniority: "ARCHITECT",
      experienceMin: 12,
      description: "Architecting headless experience platforms with Contentful, Next.js, and TypeScript.",
    },
    defaultSearchProfile
  );
  assert.strictEqual(matchWithTech.relevanceBucket, "HIGH_RELEVANCE");
  assert.ok(matchWithTech.reasons.some((r) => r.includes("Contentful")));
  assert.ok(matchWithTech.reasons.some((r) => r.includes("Next.js")));
});

// 10. Phase 3.2 — Career Fit & Domain Matching Tests
test("TEST 1: Frontend Architect + React + Next.js -> HIGH_RELEVANCE & FRONTEND domain", () => {
  const job = {
    title: "Frontend Architect",
    company: "Acme Global",
    location: "Hyderabad, India",
    remoteType: "HYBRID" as const,
    skills: ["React", "Next.js", "TypeScript"],
    roleFamily: "FRONTEND_ARCHITECT" as const,
    seniority: "ARCHITECT" as const,
    experienceMin: 12,
    description: "Lead frontend architecture for digital experience using React, Next.js and TypeScript.",
  };

  const match = evaluateJobMatch(job, defaultSearchProfile);
  assert.strictEqual(match.careerFit, "HIGH_RELEVANCE");
  assert.strictEqual(match.dimensions.roleFit.strength, "STRONG");
  assert.strictEqual(match.dimensions.technologyFit.strength, "STRONG");
  assert.ok(match.domainMatches.some((d) => d.domain === "FRONTEND" && d.matched));
  assert.ok(match.whyThisFits.some((r) => r.includes("React")));
});

test("TEST 2: Senior Shopify + Next.js + Contentful + Commerce -> High Career Fit with domain evidence", () => {
  const job = {
    title: "Senior Shopify Developer",
    company: "Commerce Studio",
    location: "Worldwide (Remote)",
    remoteType: "REMOTE" as const,
    skills: ["Next.js", "Contentful", "Commerce", "TypeScript"],
    roleFamily: "COMMERCE" as const,
    seniority: "SENIOR" as const,
    experienceMin: 8,
    description: "Building custom Shopify Plus storefronts using Hydrogen, Next.js, and Contentful headless CMS.",
  };

  const match = evaluateJobMatch(job, defaultSearchProfile);
  // Qualifies as HIGH_RELEVANCE or RELEVANT due to deep domain specialization
  assert.ok(match.careerFit === "HIGH_RELEVANCE" || match.careerFit === "RELEVANT");
  assert.ok(match.domainMatches.some((d) => d.domain === "COMMERCE" && d.matched));
  assert.ok(match.domainMatches.some((d) => d.domain === "CMS" && d.matched));
  assert.ok(match.domainMatches.some((d) => d.domain === "FRONTEND" && d.matched));
  assert.strictEqual(match.dimensions.technologyFit.strength, "STRONG");
});

test("TEST 3: Solutions Architect + Node.js + AWS + travel -> Positive travel signal & client-facing fit", () => {
  const job = {
    title: "Solutions Architect",
    company: "Enterprise Cloud Co",
    location: "Mumbai, India",
    remoteType: "HYBRID" as const,
    skills: ["Node.js", "AWS"],
    roleFamily: "SOLUTIONS_ARCHITECT" as const,
    seniority: "ARCHITECT" as const,
    experienceMin: 12,
    travelType: "INTERNATIONAL_TRAVEL" as const,
    travelPercentage: 25,
    travelEvidence: "Ability to travel internationally up to 25% to client sites",
    description: "Lead enterprise solutions architecture, customer consulting, and integration using Node.js and AWS.",
  };

  const match = evaluateJobMatch(job, defaultSearchProfile);
  assert.ok(match.careerFit === "HIGH_RELEVANCE" || match.careerFit === "RELEVANT");
  assert.strictEqual(match.dimensions.travelFit.strength, "STRONG");
  assert.strictEqual(match.dimensions.clientFacingFit.strength, "STRONG");
  assert.ok(match.whyThisFits.some((r) => r.includes("travel")));
});

test("TEST 4: SRE Architect + AWS + Kubernetes -> NOT HIGH_RELEVANCE merely because of title", () => {
  const job = {
    title: "SRE Architect",
    company: "Infrastructure Tech",
    location: "Hyderabad, India",
    remoteType: "HYBRID" as const,
    skills: ["AWS", "Kubernetes", "Docker", "Terraform"],
    roleFamily: "TECHNICAL_ARCHITECT" as const,
    seniority: "ARCHITECT" as const,
    experienceMin: 12,
    description: "Site reliability engineering, observability, metrics, and incident management with Kubernetes.",
  };

  const match = evaluateJobMatch(job, defaultSearchProfile);
  // SRE is adjacent domain, must NOT be HIGH_RELEVANCE
  assert.notStrictEqual(match.careerFit, "HIGH_RELEVANCE");
  assert.ok(match.careerFit === "RELEVANT" || match.careerFit === "POSSIBLE");
  assert.ok(match.domainMatches.some((d) => d.domain === "SRE" && d.matched));
  assert.ok(match.potentialGaps.some((g) => g.includes("Target technologies")));
});

test("TEST 5: Delivery Director with no technical evidence -> POSSIBLE or LOW_RELEVANCE", () => {
  const job = {
    title: "Delivery Director",
    company: "Corporate Ops",
    location: "Hyderabad, India",
    remoteType: "HYBRID" as const,
    skills: [],
    roleFamily: "OTHER" as const,
    seniority: "DIRECTOR" as const,
    experienceMin: 15,
    description: "Manage delivery timelines, operational budgets, and resource allocation across business units.",
  };

  const match = evaluateJobMatch(job, defaultSearchProfile);
  assert.notStrictEqual(match.careerFit, "HIGH_RELEVANCE");
  assert.ok(match.careerFit === "POSSIBLE" || match.careerFit === "LOW_RELEVANCE");
  assert.strictEqual(match.dimensions.technologyFit.strength, "NONE");
});

test("TEST 6: React/Next.js frontend role -> Evidence-based FRONTEND domain match", () => {
  const domains = extractDomainMatches(
    "Senior Frontend Developer",
    "Building scalable user interfaces using React, Next.js and CSS modules.",
    ["React", "Next.js"]
  );
  assert.ok(domains.some((d) => d.domain === "FRONTEND" && d.matched));
  const frontDetail = domains.find((d) => d.domain === "FRONTEND");
  assert.ok(frontDetail?.evidence && frontDetail.evidence.length > 0);
});

test("TEST 7: CMS Architect -> CMS domain match with evidence", () => {
  const domains = extractDomainMatches(
    "Headless CMS Architect",
    "Architecting enterprise content hubs with Contentful and decoupled CMS platforms.",
    ["Contentful"]
  );
  assert.ok(domains.some((d) => d.domain === "CMS" && d.matched));
  assert.ok(domains.some((d) => d.domain === "TECHNICAL_ARCHITECTURE" && d.matched));
});

test("TEST 8: Commerce Architect -> COMMERCE domain match with evidence", () => {
  const domains = extractDomainMatches(
    "Digital Commerce Architect",
    "Designing commerce integrations with Shopify Plus, commercetools, and payment APIs.",
    ["Commerce"]
  );
  assert.ok(domains.some((d) => d.domain === "COMMERCE" && d.matched));
  assert.ok(domains.some((d) => d.domain === "TECHNICAL_ARCHITECTURE" && d.matched));
});

test("TEST 9: Client-facing Professional Services Architect -> CLIENT_CONSULTING & PROFESSIONAL_SERVICES", () => {
  const domains = extractDomainMatches(
    "Principal Architect, Professional Services",
    "Client-facing architecture, technical advisory, customer implementation, and executive stakeholder engagement.",
    []
  );
  assert.ok(domains.some((d) => d.domain === "CLIENT_CONSULTING" && d.matched));
  assert.ok(domains.some((d) => d.domain === "PROFESSIONAL_SERVICES" && d.matched));
});

// 11. Phase 3.2.1 — Anti-Contamination Domain Matching Regression Tests
test("REGRESSION: Data Scientist + React mention -> DATA_AI, not FRONTEND", () => {
  const title = "Senior Data Scientist";
  const desc = "Build predictive models and ML pipelines. Our company stack includes Python, PyTorch, React, and AWS.";
  const domains = extractDomainMatches(title, desc, ["Python", "React"]);

  assert.ok(domains.some((d) => d.domain === "DATA_AI" && d.matched), "Must match DATA_AI");
  assert.strictEqual(domains.some((d) => d.domain === "FRONTEND"), false, "Must NOT match FRONTEND");
  assert.strictEqual(classifyRoleFamily(title).primary, "DATA_AI");
});

test("REGRESSION: QA Engineer + Shopify mention -> QA/OTHER/SOFTWARE_ENGINEERING, not COMMERCE", () => {
  const title = "Senior QA Engineer";
  const desc = "Conduct manual and automated testing for web applications. The client uses Shopify for their store.";
  const domains = extractDomainMatches(title, desc, ["Testing", "Shopify"]);

  assert.strictEqual(domains.some((d) => d.domain === "COMMERCE"), false, "Must NOT match COMMERCE");
  assert.ok(domains.some((d) => (d.domain === "SOFTWARE_ENGINEERING" || d.domain === "OTHER") && d.matched));
  assert.strictEqual(classifyRoleFamily(title).primary, "SOFTWARE_ENGINEERING");
});

test("REGRESSION: Office Assistant + CMS company context -> OTHER", () => {
  const title = "Remote Office Assistant";
  const desc = "Manage office scheduling, correspondence, and documentation. Coalition Technologies builds custom CMS and WordPress websites for global clients.";
  const domains = extractDomainMatches(title, desc, ["Administration"]);

  assert.strictEqual(domains.length, 1);
  assert.strictEqual(domains[0].domain, "OTHER");
  assert.strictEqual(domains.some((d) => d.domain === "CMS" || d.domain === "FRONTEND" || d.domain === "CLIENT_CONSULTING"), false);
  assert.strictEqual(classifyRoleFamily(title).primary, "OTHER");
});

test("REGRESSION: Frontend Web Application Developer -> FRONTEND", () => {
  const title = "Frontend Web Application Developer";
  const desc = "Develop interactive web applications using modern JavaScript and TypeScript.";
  const domains = extractDomainMatches(title, desc, ["JavaScript", "TypeScript"]);

  assert.ok(domains.some((d) => d.domain === "FRONTEND" && d.matched), "Must match FRONTEND");
  const frontDetail = domains.find((d) => d.domain === "FRONTEND");
  assert.strictEqual(frontDetail?.source, "title");
  assert.strictEqual(classifyRoleFamily(title).primary, "SENIOR_FRONTEND_ENGINEER");
});

test("REGRESSION: Senior Shopify Developer + Next.js + Contentful -> COMMERCE + FRONTEND + CMS", () => {
  const title = "Senior Shopify Developer";
  const desc = "Building custom Shopify Plus storefronts using Hydrogen, Next.js, and Contentful headless CMS.";
  const domains = extractDomainMatches(title, desc, ["Shopify", "Next.js", "Contentful"]);

  assert.ok(domains.some((d) => d.domain === "COMMERCE" && d.matched), "Must match COMMERCE");
  assert.ok(domains.some((d) => d.domain === "FRONTEND" && d.matched), "Must match FRONTEND");
  assert.ok(domains.some((d) => d.domain === "CMS" && d.matched), "Must match CMS");
});

test("REGRESSION: Solutions Architect + customer implementation -> SOLUTIONS_ARCHITECTURE + CLIENT_CONSULTING / PROFESSIONAL_SERVICES", () => {
  const title = "Solutions Architect";
  const desc = "Lead technical solution design, pre-sales architecture, and customer implementation consulting for enterprise clients.";
  const domains = extractDomainMatches(title, desc, []);

  assert.ok(domains.some((d) => d.domain === "SOLUTIONS_ARCHITECTURE" && d.matched), "Must match SOLUTIONS_ARCHITECTURE");
  assert.ok(domains.some((d) => d.domain === "PROFESSIONAL_SERVICES" && d.matched), "Must match PROFESSIONAL_SERVICES");
  assert.ok(domains.some((d) => d.domain === "CLIENT_CONSULTING" && d.matched), "Must match CLIENT_CONSULTING");
});

test("REGRESSION: Technical Architect + MuleSoft -> TECHNICAL_ARCHITECTURE + ENTERPRISE_INTEGRATION", () => {
  const title = "Technical Architect";
  const desc = "Own the technical architecture and lead enterprise integration using MuleSoft APIs.";
  const domains = extractDomainMatches(title, desc, ["MuleSoft"]);

  assert.ok(domains.some((d) => d.domain === "TECHNICAL_ARCHITECTURE" && d.matched), "Must match TECHNICAL_ARCHITECTURE");
  assert.ok(domains.some((d) => d.domain === "ENTERPRISE_INTEGRATION" && d.matched), "Must match ENTERPRISE_INTEGRATION");
});



