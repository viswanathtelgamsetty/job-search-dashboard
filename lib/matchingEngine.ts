import type {
  JobMatchDetails,
  MatchCriterion,
  RelevanceBucket,
  RemoteType,
  RoleFamily,
  SearchProfile,
  SeniorityLevel,
  TechnologyMatchDetail,
  TravelType,
} from "@/types";
import { matchesSalaryRequirement } from "./salaryParser.ts";
import { classifyLocation, checkIndiaEligibility } from "./locationClassifier.ts";
import { matchTargetTechnologies } from "./technologyMatcher.ts";
import { classifyRoleFamily, formatRoleFamily } from "./roleClassifier.ts";
import { detectSeniority } from "./seniorityDetector.ts";

export interface JobForEvaluation {
  title: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  skills: string[]; // actual technologies from source
  roleFamily?: RoleFamily;
  seniority?: SeniorityLevel;
  experienceMin?: number;
  experienceMax?: number;
  salaryLpaMin?: number;
  salaryDisclosed?: boolean;
  travelType?: TravelType;
  travelPercentage?: number;
  travelDestinations?: string[];
  travelEvidence?: string;
  description?: string;
}

/**
 * Deterministic, Evidence-Based Relevance Engine
 *
 * Strict Rules:
 * 1. NEVER invent technologies or infer technologies from job seniority/roleFamily.
 * 2. Every matched technology MUST have verifiable evidence in the title, description, or source tags.
 * 3. Match reasons MUST be traceable to actual job text.
 * 4. High Relevance requires:
 *    - Appropriate Seniority (Architect / Lead / Principal / Staff / Director)
 *    - Target Architecture / Solutions / Lead / Consulting role family
 *    - Verifiable presence of at least one target technology (React, Next.js, Angular, TypeScript, Contentful, Headless CMS, Commerce, Digital Experience)
 *    - India-eligible location (Hyderabad, Remote India, Bangalore, Pune, etc.)
 */
export function evaluateJobMatch(
  job: JobForEvaluation,
  profile: SearchProfile
): JobMatchDetails {
  const fullText = `${job.title} ${job.company} ${job.location} ${job.description || ""}`;
  const fullTextLower = fullText.toLowerCase();

  // 1. Role Family Classification & Match
  const roleClassification = job.roleFamily
    ? { primary: job.roleFamily, secondary: [], evidence: [`Title: "${job.title}"`] }
    : classifyRoleFamily(job.title, job.description);

  const targetFamilies: RoleFamily[] = [
    "FRONTEND_ARCHITECT",
    "TECHNICAL_ARCHITECT",
    "SOLUTIONS_ARCHITECT",
    "TECHNICAL_LEAD",
    "SENIOR_FRONTEND_ENGINEER",
    "SOLUTIONS_ENGINEER",
    "TECHNICAL_CONSULTANT",
    "IMPLEMENTATION_CONSULTANT",
    "PROFESSIONAL_SERVICES",
    "CMS_DIGITAL_EXPERIENCE",
    "COMMERCE",
    "ENTERPRISE_INTEGRATION",
  ];

  const isTargetFamily = targetFamilies.includes(roleClassification.primary);
  const isArchitectOrLead = [
    "FRONTEND_ARCHITECT",
    "TECHNICAL_ARCHITECT",
    "SOLUTIONS_ARCHITECT",
    "TECHNICAL_LEAD",
    "CMS_DIGITAL_EXPERIENCE",
    "COMMERCE",
  ].includes(roleClassification.primary);

  const roleMatch: MatchCriterion = {
    matched: isTargetFamily,
    evidence: [`Job title: "${job.title}"`],
    reason: isTargetFamily
      ? `Role family (${formatRoleFamily(roleClassification.primary)}) matches target architecture/leadership profile`
      : `Role family (${formatRoleFamily(roleClassification.primary)}) is outside target leadership families`,
  };

  // 2. Evidence-Based Technology & Skills Match (Strictly Separate from Profile)
  const targetTechnologies = [
    "React",
    "Next.js",
    "Angular",
    "TypeScript",
    "Contentful",
    "Headless CMS",
    "Commerce",
    "Digital Experience",
    "Frontend Architecture",
    "Node.js",
    "GraphQL",
    "Design Systems",
    "REST APIs",
  ];

  // Match target technologies against actual job content (job.skills + fullText)
  const techMatchResult = matchTargetTechnologies(
    targetTechnologies,
    fullText,
    job.skills || []
  );

  const matchedTechs = techMatchResult.matched;
  const matchedTechNames = matchedTechs.map((m) => m.technology);

  const technologyMatch: MatchCriterion & { details?: TechnologyMatchDetail[] } = {
    matched: matchedTechs.length > 0,
    evidence: matchedTechs.map((m) => `${m.technology}: "${m.evidence}"`),
    reason:
      matchedTechs.length > 0
        ? `Found ${matchedTechs.length} verified target technologies: ${matchedTechNames.join(", ")}`
        : "None of target technologies (React, Next.js, Angular, Contentful, CMS) found in job content",
    details: [...techMatchResult.matched, ...techMatchResult.unmatched],
  };

  // 3. Seniority & Experience Match
  const seniorityResult = job.seniority
    ? { level: job.seniority, evidence: `Title/experience indicates ${job.seniority}`, experienceMin: job.experienceMin, experienceMax: job.experienceMax }
    : detectSeniority(job.title, job.description, job.experienceMin, job.experienceMax);

  const isSeniorLevel = [
    "ARCHITECT",
    "PRINCIPAL",
    "STAFF",
    "LEAD",
    "DIRECTOR",
  ].includes(seniorityResult.level);

  const expMatchesYears =
    seniorityResult.experienceMin !== undefined
      ? seniorityResult.experienceMin <= profile.experienceYears + 2
      : true;

  const seniorityMatch: MatchCriterion = {
    matched: isSeniorLevel || seniorityResult.level === "SENIOR",
    evidence: [seniorityResult.evidence],
    reason: isSeniorLevel
      ? `Seniority (${seniorityResult.level}) matches 12+ years Architect/Lead expectation`
      : `Seniority level is ${seniorityResult.level}`,
  };

  const experienceMatch: MatchCriterion = {
    matched: expMatchesYears,
    evidence: seniorityResult.experienceMin ? [`${seniorityResult.experienceMin}+ years requested`] : [seniorityResult.evidence],
    reason: expMatchesYears
      ? `Experience requirement aligns with ${profile.experienceYears}+ years profile`
      : `Experience requirement (${seniorityResult.experienceMin}+ yrs) exceeds target profile`,
  };

  // 4. Location & Remote & India Eligibility Match
  const normLoc = classifyLocation(job.location, job.remoteType);
  const indiaCheck = checkIndiaEligibility(job.location, job.remoteType, job.description);

  const isPreferredCity = ["HYDERABAD", "BANGALORE", "PUNE", "CHENNAI", "MUMBAI", "DELHI_NCR"].includes(normLoc);
  const isIndiaRemote = normLoc === "REMOTE_INDIA";
  const isLocationCompatible = indiaCheck.isIndiaEligible;

  const locationMatch: MatchCriterion = {
    matched: isLocationCompatible,
    evidence: [`Location: "${job.location}"`],
    reason: normLoc === "HYDERABAD"
      ? "Hyderabad location directly matches primary preferred city"
      : isPreferredCity
      ? `Target Indian metro hub (${normLoc})`
      : indiaCheck.reason,
  };

  const remoteMatch: MatchCriterion = {
    matched: job.remoteType === "REMOTE" || isIndiaRemote || normLoc === "REMOTE_GLOBAL",
    evidence: [`Remote Type: ${job.remoteType || "ONSITE"}`, `Location: ${normLoc}`],
    reason: isIndiaRemote
      ? "Remote from India permitted"
      : normLoc === "REMOTE_GLOBAL" && indiaCheck.isIndiaEligible
      ? "Worldwide remote compatible with India"
      : job.remoteType === "REMOTE"
      ? "Remote position"
      : `Onsite / Hybrid at ${job.location}`,
  };

  // 5. Travel Match
  const tType = job.travelType || "UNKNOWN";
  const isIntlTravel = tType === "INTERNATIONAL_TRAVEL" || tType === "CLIENT_SITE_TRAVEL";

  const travelMatch: MatchCriterion = {
    matched: isIntlTravel || tType === "REMOTE_GLOBAL" || tType === "INTERNATIONAL_TEAM_ONLY",
    evidence: job.travelEvidence ? [job.travelEvidence] : [tType],
    reason: tType === "INTERNATIONAL_TRAVEL"
      ? `Explicit international travel requirement (${job.travelPercentage ? `${job.travelPercentage}%` : "customer site"})`
      : tType === "CLIENT_SITE_TRAVEL"
      ? "Client-site travel opportunities"
      : tType === "INTERNATIONAL_TEAM_ONLY"
      ? "International team collaboration (no physical travel required)"
      : tType === "REMOTE_GLOBAL"
      ? "Global remote collaboration"
      : "No travel requirement mentioned",
  };

  // 6. Compensation / Salary Match
  const salaryCheck = matchesSalaryRequirement(
    job.salaryLpaMin,
    job.salaryDisclosed,
    profile.minSalaryLpa
  );

  const salaryMatch: MatchCriterion = {
    matched: salaryCheck.matches,
    evidence: job.salaryDisclosed && job.salaryLpaMin ? [`₹${job.salaryLpaMin}L PA`] : ["Undisclosed"],
    reason: salaryCheck.reason,
  };

  // 7. Client-Facing / Consulting Match
  const clientFacingKeywords = /\b(?:client|customer|stakeholder|consulting|professional services|solutions|presales|vendor|partner)\b/i;
  const isClientFacing = clientFacingKeywords.test(fullTextLower) || [
    "SOLUTIONS_ARCHITECT",
    "TECHNICAL_CONSULTANT",
    "IMPLEMENTATION_CONSULTANT",
    "PROFESSIONAL_SERVICES",
    "SOLUTIONS_ENGINEER",
  ].includes(roleClassification.primary);

  const clientFacingMatch: MatchCriterion = {
    matched: isClientFacing,
    evidence: isClientFacing ? ["Client-facing / consulting elements detected in title or description"] : [],
    reason: isClientFacing
      ? "Involves client-facing, advisory, or enterprise stakeholder interaction"
      : "Internal engineering focus",
  };

  // Traceable Match Reasons (Only include what has real evidence!)
  const reasons: string[] = [];
  if (roleMatch.matched) {
    reasons.push(`✓ ${formatRoleFamily(roleClassification.primary)} (Evidence: "${job.title}")`);
  }
  if (seniorityMatch.matched && seniorityResult.level !== "UNKNOWN") {
    reasons.push(`✓ ${seniorityResult.level} seniority (Evidence: ${seniorityResult.evidence})`);
  }

  // ONLY add technology match reasons if ACTUALLY matched with evidence!
  if (matchedTechs.length > 0) {
    matchedTechs.slice(0, 3).forEach((m) => {
      reasons.push(`✓ ${m.technology} (Evidence: "${m.evidence}")`);
    });
  }

  if (normLoc === "HYDERABAD") {
    reasons.push(`✓ Hyderabad location (Evidence: "${job.location}")`);
  } else if (indiaCheck.isIndiaEligible) {
    reasons.push(`✓ India eligible (Evidence: "${job.location}")`);
  }

  if (tType === "INTERNATIONAL_TRAVEL" && job.travelEvidence) {
    reasons.push(`✓ International travel: "${job.travelEvidence}"`);
  } else if (tType === "INTERNATIONAL_TRAVEL") {
    reasons.push(`✓ International travel${job.travelPercentage ? ` up to ${job.travelPercentage}%` : ""}`);
  }

  // Cautions ("Why it may NOT match")
  const cautions: string[] = [];
  if (!indiaCheck.isIndiaEligible) {
    cautions.push(`! Location (${job.location}) does not confirm India hiring eligibility`);
  }
  if (tType === "RELOCATION") {
    cautions.push(`! Requires relocation: ${job.travelEvidence || "International relocation"}`);
  }
  if (seniorityResult.experienceMin && seniorityResult.experienceMin > 15) {
    cautions.push(`! Requires ${seniorityResult.experienceMin}+ years experience`);
  }
  if (seniorityResult.level === "ENTRY" || seniorityResult.level === "MID") {
    cautions.push(`! Listed as ${seniorityResult.level}-level opportunity`);
  }
  if (matchedTechs.length === 0) {
    cautions.push("! Target technologies (React, Next.js, Angular, Contentful) not found in posting");
  }

  // Deterministic Relevance Buckets
  let relevanceBucket: RelevanceBucket;

  const hasHighSeniority = isSeniorLevel || (seniorityResult.experienceMin && seniorityResult.experienceMin >= 10);
  const hasTargetTech = matchedTechs.length > 0;
  const isIndiaFriendly = indiaCheck.isIndiaEligible;

  // Strict: HIGH_RELEVANCE requires ALL 4: Seniority + Role + TARGET TECH + India
  if (
    hasHighSeniority &&
    isArchitectOrLead &&
    hasTargetTech &&
    isIndiaFriendly
  ) {
    relevanceBucket = "HIGH_RELEVANCE";
  } else if (
    (hasHighSeniority || isArchitectOrLead) &&
    isIndiaFriendly &&
    (hasTargetTech || isClientFacing)
  ) {
    relevanceBucket = "RELEVANT";
  } else if (
    isTargetFamily ||
    hasTargetTech ||
    (isSeniorLevel && isIndiaFriendly)
  ) {
    relevanceBucket = "POSSIBLE";
  } else {
    relevanceBucket = "LOW_RELEVANCE";
  }

  // Legacy score for sorting
  let legacyScore = 30;
  if (relevanceBucket === "HIGH_RELEVANCE") legacyScore = 90;
  else if (relevanceBucket === "RELEVANT") legacyScore = 70;
  else if (relevanceBucket === "POSSIBLE") legacyScore = 50;
  else legacyScore = 20;

  if (normLoc === "HYDERABAD") legacyScore += 5;
  if (tType === "INTERNATIONAL_TRAVEL") legacyScore += 5;
  legacyScore = Math.min(100, Math.max(10, legacyScore));

  return {
    relevanceBucket,
    reasons: reasons.slice(0, 5),
    cautions: cautions.slice(0, 3),
    breakdown: {
      roleMatch,
      technologyMatch,
      experienceMatch,
      locationMatch,
      remoteMatch,
      travelMatch,
      seniorityMatch,
      salaryMatch,
      clientFacingMatch,
    },
    overallScore: legacyScore,
  };
}
