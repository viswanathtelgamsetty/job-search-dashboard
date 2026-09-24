import type {
  JobMatchDetails,
  MatchCriterion,
  RelevanceBucket,
  RemoteType,
  RoleFamily,
  SearchProfile,
  SeniorityLevel,
  TravelType,
} from "@/types";
import { matchesSalaryRequirement } from "./salaryParser.ts";
import { classifyLocation, checkIndiaEligibility } from "./locationClassifier.ts";
import { extractAndNormalizeTechnologies } from "./technologyNormalizer.ts";
import { classifyRoleFamily, formatRoleFamily } from "./roleClassifier.ts";
import { detectSeniority } from "./seniorityDetector.ts";

export interface JobForEvaluation {
  title: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  skills: string[];
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
 * Deterministic, Transparent Relevance Engine
 *
 * Explicit Bucket Classification Rules:
 *
 * 1. HIGH_RELEVANCE:
 *    - Seniority is ARCHITECT, LEAD, STAFF, PRINCIPAL, DIRECTOR (or 10+ yrs exp requested).
 *    - Role family is in Target Architecture / Tech Lead / Consulting families.
 *    - At least one major target technology / domain matched (React, Next.js, Angular, Contentful, Headless CMS, Commerce, TypeScript, Frontend Architecture).
 *    - Location is India-compatible (Hyderabad, Remote India, Bangalore, Pune, Chennai, Mumbai, Delhi NCR, or Worldwide remote allowing India).
 *    - Not restricted away from India.
 *
 * 2. RELEVANT:
 *    - Role or Seniority aligns with Lead/Architect/Consultant profile.
 *    - Relevant tech stack or domain match.
 *    - India eligible or remote friendly.
 *
 * 3. POSSIBLE:
 *    - Adjacent engineering/consulting role (e.g. Senior Frontend Engineer, general solutions/consulting).
 *    - May require relocation or location confirmation.
 *
 * 4. LOW_RELEVANCE:
 *    - Junior / Entry level, non-tech, purely non-India onsite, or zero matching role/tech criteria.
 */
export function evaluateJobMatch(
  job: JobForEvaluation,
  profile: SearchProfile
): JobMatchDetails {
  const fullText = `${job.title} ${job.company} ${job.location} ${job.skills.join(" ")} ${job.roleFamily || ""} ${job.description || ""}`.toLowerCase();

  // 1. Role Family Classification & Match
  const roleClassification = job.roleFamily
    ? { primary: job.roleFamily, secondary: [], evidence: [`Specified: ${job.roleFamily}`] }
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
    evidence: roleClassification.evidence,
    reason: isTargetFamily
      ? `Role family (${roleClassification.primary}) matches target architectural/leadership profile`
      : `Role family (${roleClassification.primary}) is outside target leadership families`,
  };

  // 2. Technology & Skills Match
  const normalizedTechs = extractAndNormalizeTechnologies(job.skills, fullText);
  const targetTechKeywords = [
    "React",
    "Next.js",
    "Angular",
    "TypeScript",
    "Contentful",
    "Headless CMS",
    "Digital Experience",
    "Frontend Architecture",
    "Commerce",
    "Node.js",
    "Design Systems",
    "REST APIs",
    "GraphQL",
  ];

  const matchedTargetTechs = normalizedTechs.filter((tech) =>
    targetTechKeywords.includes(tech)
  );

  const technologyMatch: MatchCriterion = {
    matched: matchedTargetTechs.length > 0,
    evidence: matchedTargetTechs,
    reason:
      matchedTargetTechs.length > 0
        ? `Matches ${matchedTargetTechs.length} core profile technologies (${matchedTargetTechs.slice(0, 3).join(", ")})`
        : "No direct matches with target React/Architecture/CMS/Commerce tech stack",
  };

  // 3. Seniority & Experience Match
  const seniorityResult = job.seniority
    ? { level: job.seniority, evidence: `Seniority specified: ${job.seniority}`, experienceMin: job.experienceMin, experienceMax: job.experienceMax }
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
    evidence: [seniorityResult.level, seniorityResult.evidence],
    reason: isSeniorLevel
      ? `Seniority (${seniorityResult.level}) matches 12+ years Architect/Lead expectation`
      : `Seniority level is ${seniorityResult.level}`,
  };

  const experienceMatch: MatchCriterion = {
    matched: expMatchesYears,
    evidence: seniorityResult.experienceMin ? [`${seniorityResult.experienceMin}+ years requested`] : ["Seniority implied from role"],
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
    evidence: [normLoc, job.location],
    reason: normLoc === "HYDERABAD"
      ? "Hyderabad location directly matches primary preferred city"
      : isPreferredCity
      ? `Target Indian metro hub (${normLoc})`
      : indiaCheck.reason,
  };

  const remoteMatch: MatchCriterion = {
    matched: job.remoteType === "REMOTE" || isIndiaRemote || normLoc === "REMOTE_GLOBAL",
    evidence: [job.remoteType || "ONSITE", normLoc],
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
  const clientFacingKeywords = /\b(client|customer|stakeholder|consulting|professional services|solutions|presales|vendor|partner)\b/i;
  const isClientFacing = clientFacingKeywords.test(fullText) || [
    "SOLUTIONS_ARCHITECT",
    "TECHNICAL_CONSULTANT",
    "IMPLEMENTATION_CONSULTANT",
    "PROFESSIONAL_SERVICES",
    "SOLUTIONS_ENGINEER",
  ].includes(roleClassification.primary);

  const clientFacingMatch: MatchCriterion = {
    matched: isClientFacing,
    evidence: isClientFacing ? ["Client-facing / consulting elements detected"] : [],
    reason: isClientFacing
      ? "Involves client-facing, advisory, or enterprise stakeholder interaction"
      : "Internal engineering focus",
  };

  // Determine Concrete Reasons ("Why this matches")
  const reasons: string[] = [];
  if (roleMatch.matched) {
    reasons.push(`✓ ${formatRoleFamily(roleClassification.primary)}`);
  }
  if (seniorityMatch.matched && seniorityResult.level !== "UNKNOWN") {
    reasons.push(`✓ ${seniorityResult.level} seniority level requested`);
  }
  if (matchedTargetTechs.length > 0) {
    reasons.push(`✓ ${matchedTargetTechs.slice(0, 3).join(" / ")}`);
  }
  if (normLoc === "HYDERABAD") {
    reasons.push("✓ Hyderabad (Primary Target City)");
  } else if (indiaCheck.isIndiaEligible) {
    reasons.push("✓ India eligible");
  }
  if (tType === "INTERNATIONAL_TRAVEL" && job.travelEvidence) {
    reasons.push(`✓ International travel: ${job.travelEvidence}`);
  } else if (tType === "INTERNATIONAL_TRAVEL") {
    reasons.push(`✓ International travel${job.travelPercentage ? ` up to ${job.travelPercentage}%` : ""}`);
  }

  // Determine Cautions ("Why it may NOT match")
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
  if (!technologyMatch.matched && isTargetFamily) {
    cautions.push("! Tech stack does not explicitly list React / Next.js / CMS");
  }

  // Classification into Deterministic Relevance Buckets
  let relevanceBucket: RelevanceBucket;

  const hasHighSeniority = isSeniorLevel || (seniorityResult.experienceMin && seniorityResult.experienceMin >= 10);
  const hasTargetTech = matchedTargetTechs.length > 0;
  const isIndiaFriendly = indiaCheck.isIndiaEligible;

  if (
    hasHighSeniority &&
    isArchitectOrLead &&
    hasTargetTech &&
    isIndiaFriendly
  ) {
    relevanceBucket = "HIGH_RELEVANCE";
  } else if (
    (hasHighSeniority || isTargetFamily) &&
    (hasTargetTech || isArchitectOrLead) &&
    isIndiaFriendly
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

  // Backward-compatible overallScore calculation for legacy components
  let legacyScore = 40;
  if (relevanceBucket === "HIGH_RELEVANCE") legacyScore = 90;
  else if (relevanceBucket === "RELEVANT") legacyScore = 75;
  else if (relevanceBucket === "POSSIBLE") legacyScore = 55;
  else legacyScore = 25;

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
