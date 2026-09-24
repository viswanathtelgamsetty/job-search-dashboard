import type {
  CareerDomain,
  CareerFitDimensions,
  DimensionFit,
  DomainMatchDetail,
  FitStrength,
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
import { extractDomainMatches, formatDomainName } from "./domainMatcher.ts";

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
  postedAt?: string;
  discoveredAt?: string;
}

/**
 * Phase 3.2 — Career Fit Model for 12+ Year Technical Lead / Architect Profile
 *
 * Core Principles:
 * 1. Evidence-Based Domain Matching: Evaluates domains (FRONTEND, CMS, COMMERCE, SOLUTIONS_ARCHITECTURE, etc.)
 *    based on actual job content.
 * 2. Multi-Dimensional Career Fit: Calculates roleFit, technologyFit, domainFit, seniorityFit,
 *    locationFit, remoteFit, travelFit, clientFacingFit, and freshnessFit independently.
 * 3. Broad Role Fit: Does not require "Architect" in title (e.g. Senior Shopify Developer with Next.js & Contentful
 *    has high fit).
 * 4. Travel as a Positive Signal: International or client-site travel acts as a positive bonus, never a blocker.
 * 5. Freshness Separated: Affects ordering, not career relevance.
 * 6. Transparent & Explainable Scoring: Documented component points instead of opaque probabilities.
 */
export function evaluateJobMatch(
  job: JobForEvaluation,
  profile: SearchProfile
): JobMatchDetails {
  const fullText = `${job.title} ${job.company} ${job.location} ${job.description || ""}`;
  const fullTextLower = fullText.toLowerCase();

  // =========================================================================
  // 1. Evidence-Based Domain Matching
  // =========================================================================
  const domainMatches: DomainMatchDetail[] = extractDomainMatches(
    job.title,
    job.description || "",
    job.skills || []
  );

  const matchedDomainKeys: CareerDomain[] = domainMatches
    .filter((d) => d.matched && d.domain !== "OTHER")
    .map((d) => d.domain);

  const primaryTargetDomains: CareerDomain[] = [
    "FRONTEND",
    "DIGITAL_EXPERIENCE",
    "CMS",
    "COMMERCE",
    "ENTERPRISE_INTEGRATION",
    "SOLUTIONS_ARCHITECTURE",
    "TECHNICAL_ARCHITECTURE",
    "CLIENT_CONSULTING",
    "PROFESSIONAL_SERVICES",
  ];

  const matchedPrimaryDomains = matchedDomainKeys.filter((d) =>
    primaryTargetDomains.includes(d)
  );

  const isAdjacentDomainOnly =
    matchedPrimaryDomains.length === 0 &&
    matchedDomainKeys.some((d) => ["SRE", "DEVOPS", "DATA_AI", "SECURITY"].includes(d));

  let domainFitStrength: FitStrength = "NONE";
  if (matchedPrimaryDomains.length >= 2) {
    domainFitStrength = "STRONG";
  } else if (matchedPrimaryDomains.length === 1) {
    domainFitStrength = "MODERATE";
  } else if (isAdjacentDomainOnly) {
    domainFitStrength = "WEAK";
  }

  const domainFit: DimensionFit = {
    matched: matchedPrimaryDomains.length > 0,
    strength: domainFitStrength,
    evidence: domainMatches
      .filter((d) => d.matched && d.domain !== "OTHER")
      .map((d) => `${formatDomainName(d.domain)}: "${d.evidence}"`),
    reason:
      matchedPrimaryDomains.length > 0
        ? `Matches target career domains: ${matchedPrimaryDomains.map(formatDomainName).join(", ")}`
        : isAdjacentDomainOnly
        ? `Matches adjacent technical domains (${matchedDomainKeys.map(formatDomainName).join(", ")})`
        : "No explicit target technical domains identified",
  };

  // =========================================================================
  // 2. Evidence-Based Technology Matching
  // =========================================================================
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

  const techMatchResult = matchTargetTechnologies(
    targetTechnologies,
    fullText,
    job.skills || []
  );

  const matchedTechs = techMatchResult.matched;
  const matchedTechNames = matchedTechs.map((m) => m.technology);

  const hasCoreTech = matchedTechNames.some((t) =>
    ["React", "Next.js", "Angular", "Contentful", "Commerce", "Headless CMS"].includes(t)
  );

  let techFitStrength: FitStrength = "NONE";
  if (matchedTechs.length >= 3 || (hasCoreTech && matchedTechs.length >= 2)) {
    techFitStrength = "STRONG";
  } else if (matchedTechs.length >= 1) {
    techFitStrength = "MODERATE";
  }

  const technologyFit: DimensionFit = {
    matched: matchedTechs.length > 0,
    strength: techFitStrength,
    evidence: matchedTechs.map((m) => `${m.technology}: "${m.evidence}"`),
    reason:
      matchedTechs.length > 0
        ? `Found ${matchedTechs.length} verified target technologies: ${matchedTechNames.join(", ")}`
        : "Target technologies (React, Next.js, Angular, Contentful, Commerce) not found in posting",
  };

  // =========================================================================
  // 3. Role Family & Role Fit (Broader than just "Architect" title)
  // =========================================================================
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
  const isArchitectureOrLeadRole = [
    "FRONTEND_ARCHITECT",
    "TECHNICAL_ARCHITECT",
    "SOLUTIONS_ARCHITECT",
    "TECHNICAL_LEAD",
    "CMS_DIGITAL_EXPERIENCE",
    "COMMERCE",
  ].includes(roleClassification.primary);

  // Broad role fit: A senior title in Commerce/CMS/Frontend also qualifies as strong role fit
  const isTargetSeniorSpecialist =
    (matchedDomainKeys.includes("COMMERCE") ||
      matchedDomainKeys.includes("CMS") ||
      matchedDomainKeys.includes("FRONTEND")) &&
    /senior|lead|specialist/i.test(job.title);

  let roleFitStrength: FitStrength = "NONE";
  if (isArchitectureOrLeadRole || isTargetSeniorSpecialist) {
    roleFitStrength = "STRONG";
  } else if (isTargetFamily) {
    roleFitStrength = "MODERATE";
  } else if (!isAdjacentDomainOnly && /engineer|developer|architect|lead/i.test(job.title)) {
    roleFitStrength = "WEAK";
  }

  const roleFit: DimensionFit = {
    matched: isTargetFamily || isTargetSeniorSpecialist,
    strength: roleFitStrength,
    evidence: [`Job title: "${job.title}"`, `Classified role: ${formatRoleFamily(roleClassification.primary)}`],
    reason:
      isArchitectureOrLeadRole || isTargetSeniorSpecialist
        ? `Role (${formatRoleFamily(roleClassification.primary)}) aligns directly with technical leadership / domain direction`
        : isTargetFamily
        ? `Role (${formatRoleFamily(roleClassification.primary)}) is within target engineering families`
        : `Role (${formatRoleFamily(roleClassification.primary)}) is outside core target leadership domains`,
  };

  // =========================================================================
  // 4. Seniority & Experience Fit (12+ Years Expectation)
  // =========================================================================
  const seniorityResult = job.seniority
    ? {
        level: job.seniority,
        evidence: `Title/experience indicates ${job.seniority}`,
        experienceMin: job.experienceMin,
        experienceMax: job.experienceMax,
      }
    : detectSeniority(job.title, job.description, job.experienceMin, job.experienceMax);

  const isHighSeniority = [
    "ARCHITECT",
    "PRINCIPAL",
    "STAFF",
    "LEAD",
    "DIRECTOR",
  ].includes(seniorityResult.level);

  let seniorityStrength: FitStrength = "NONE";
  if (isHighSeniority || (seniorityResult.experienceMin && seniorityResult.experienceMin >= 10)) {
    seniorityStrength = "STRONG";
  } else if (seniorityResult.level === "SENIOR") {
    seniorityStrength = "MODERATE";
  } else if (seniorityResult.level === "MID") {
    seniorityStrength = "WEAK";
  }

  const expMatchesYears =
    seniorityResult.experienceMin !== undefined
      ? seniorityResult.experienceMin <= profile.experienceYears + 4
      : true;

  const seniorityFit: DimensionFit = {
    matched: seniorityStrength === "STRONG" || seniorityStrength === "MODERATE",
    strength: seniorityStrength,
    evidence: [seniorityResult.evidence],
    reason:
      seniorityStrength === "STRONG"
        ? `Seniority (${seniorityResult.level}) matches 12+ years Architect/Lead profile`
        : seniorityStrength === "MODERATE"
        ? `Senior engineering level with relevant domain depth`
        : `Seniority level is ${seniorityResult.level}`,
  };

  // =========================================================================
  // 5. Location & Remote Fit (Ranked Priorities)
  // Priority: 1. Hyderabad, 2. Remote India, 3. Bangalore, 4. Pune, 5. Chennai,
  //           6. Mumbai, 7. Delhi NCR, 8. Other India, 9. Worldwide Remote (confirmed)
  // =========================================================================
  const normLoc = classifyLocation(job.location, job.remoteType);
  const indiaCheck = checkIndiaEligibility(job.location, job.remoteType, job.description);

  let locationStrength: FitStrength = "NONE";
  let locationReason = "";

  if (normLoc === "HYDERABAD") {
    locationStrength = "STRONG";
    locationReason = "Hyderabad (Top Priority Location)";
  } else if (normLoc === "REMOTE_INDIA") {
    locationStrength = "STRONG";
    locationReason = "Remote India (Priority 2 Location)";
  } else if (["BANGALORE", "PUNE", "CHENNAI", "MUMBAI", "DELHI_NCR"].includes(normLoc)) {
    locationStrength = "STRONG";
    locationReason = `${normLoc} (Target Indian Metro Hub)`;
  } else if (normLoc === "REMOTE_GLOBAL" && indiaCheck.isIndiaEligible) {
    locationStrength = "STRONG";
    locationReason = "Worldwide remote with verified India hiring eligibility";
  } else if (indiaCheck.isIndiaEligible) {
    locationStrength = "MODERATE";
    locationReason = "India hiring eligible";
  } else {
    locationStrength = "NONE";
    locationReason = indiaCheck.reason;
  }

  const locationFit: DimensionFit = {
    matched: indiaCheck.isIndiaEligible,
    strength: locationStrength,
    evidence: [`Location: "${job.location}" (${normLoc})`],
    reason: locationReason,
  };

  const isRemote = job.remoteType === "REMOTE" || normLoc === "REMOTE_INDIA" || normLoc === "REMOTE_GLOBAL";
  const remoteFit: DimensionFit = {
    matched: isRemote || indiaCheck.isIndiaEligible,
    strength: isRemote ? "STRONG" : indiaCheck.isIndiaEligible ? "MODERATE" : "NONE",
    evidence: [`Remote Type: ${job.remoteType || "HYBRID/ONSITE"}`, `Location: ${normLoc}`],
    reason: isRemote
      ? "Remote flexibility compatible with India"
      : `Hybrid / Onsite arrangement in ${normLoc}`,
  };

  // =========================================================================
  // 6. Travel Fit (Positive Signal, Never a Blocker)
  // =========================================================================
  const tType = job.travelType || "UNKNOWN";
  const isIntlTravel = tType === "INTERNATIONAL_TRAVEL" || tType === "CLIENT_SITE_TRAVEL";

  let travelStrength: FitStrength = "NONE";
  if (tType === "INTERNATIONAL_TRAVEL") {
    travelStrength = "STRONG";
  } else if (tType === "CLIENT_SITE_TRAVEL") {
    travelStrength = "STRONG";
  } else if (tType === "INTERNATIONAL_TEAM_ONLY" || tType === "REMOTE_GLOBAL") {
    travelStrength = "MODERATE";
  } else if (tType === "RELOCATION") {
    travelStrength = "WEAK";
  }

  const travelFit: DimensionFit = {
    matched: isIntlTravel || travelStrength === "MODERATE",
    strength: travelStrength,
    evidence: job.travelEvidence ? [job.travelEvidence] : [tType],
    reason:
      tType === "INTERNATIONAL_TRAVEL"
        ? `Explicit international travel requirement (${job.travelPercentage ? `${job.travelPercentage}%` : "customer site"}) (Positive Signal)`
        : tType === "CLIENT_SITE_TRAVEL"
        ? "Client-site travel opportunities (Positive Signal)"
        : tType === "INTERNATIONAL_TEAM_ONLY"
        ? "Global team collaboration exposure"
        : tType === "REMOTE_GLOBAL"
        ? "Global remote collaboration exposure"
        : "No travel requirement specified",
  };

  // =========================================================================
  // 7. Client-Facing / Consulting Fit
  // =========================================================================
  const clientFacingKeywords =
    /\b(?:client|customer|stakeholder|consulting|professional services|solutions|presales|vendor|partner|advisory)\b/i;
  const isClientFacing =
    clientFacingKeywords.test(fullTextLower) ||
    [
      "SOLUTIONS_ARCHITECT",
      "TECHNICAL_CONSULTANT",
      "IMPLEMENTATION_CONSULTANT",
      "PROFESSIONAL_SERVICES",
      "SOLUTIONS_ENGINEER",
    ].includes(roleClassification.primary) ||
    matchedDomainKeys.includes("CLIENT_CONSULTING") ||
    matchedDomainKeys.includes("PROFESSIONAL_SERVICES");

  const clientFacingFit: DimensionFit = {
    matched: isClientFacing,
    strength: isClientFacing ? "STRONG" : "NONE",
    evidence: isClientFacing ? ["Client-facing / consulting elements detected in posting"] : [],
    reason: isClientFacing
      ? "Involves client-facing, advisory, or enterprise customer interaction"
      : "Internal engineering / platform focus",
  };

  // =========================================================================
  // 8. Freshness (Separate Dimension — Does NOT Decide Job Match)
  // =========================================================================
  const daysAgo = job.postedAt
    ? Math.max(0, Math.floor((Date.now() - new Date(job.postedAt).getTime()) / (1000 * 60 * 60 * 24)))
    : undefined;

  let freshnessStatus: "FRESH" | "RECENT" | "OLDER" | "UNKNOWN" = "UNKNOWN";
  let freshnessLabel = "Discovered recently";

  if (daysAgo !== undefined) {
    if (daysAgo <= 3) {
      freshnessStatus = "FRESH";
      freshnessLabel = daysAgo === 0 ? "Posted today" : `Posted ${daysAgo}d ago`;
    } else if (daysAgo <= 14) {
      freshnessStatus = "RECENT";
      freshnessLabel = `Posted ${daysAgo}d ago`;
    } else {
      freshnessStatus = "OLDER";
      freshnessLabel = `Posted ${daysAgo}d ago`;
    }
  }

  const freshnessFit = {
    status: freshnessStatus,
    daysAgo,
    label: freshnessLabel,
  };

  // =========================================================================
  // 9. Career Fit Classification (HIGH_RELEVANCE, RELEVANT, POSSIBLE, LOW_RELEVANCE)
  // =========================================================================
  const isIndiaFriendly = locationFit.strength === "STRONG" || locationFit.strength === "MODERATE";
  const hasSeniority = seniorityFit.strength === "STRONG" || seniorityFit.strength === "MODERATE";
  const hasTargetTech = technologyFit.strength === "STRONG" || technologyFit.strength === "MODERATE";
  const hasStrongTech = technologyFit.strength === "STRONG";
  const hasPrimaryDomain = domainFit.strength === "STRONG" || domainFit.strength === "MODERATE";
  const hasStrongPrimaryDomain = domainFit.strength === "STRONG";
  const isTargetRole = roleFit.strength === "STRONG";

  let relevanceBucket: RelevanceBucket;

  // HIGH_RELEVANCE:
  // Requires:
  // 1. India / remote compatibility
  // 2. Appropriate seniority (Architect/Lead or Senior in target domain)
  // 3. Not purely an adjacent domain without target tech
  // 4. Strong role/domain alignment + verified target technology/domain evidence
  if (
    isIndiaFriendly &&
    hasSeniority &&
    !isAdjacentDomainOnly &&
    (
      // Case A: Technical / Frontend / CMS Architect with verified target tech in India
      (isArchitectureOrLeadRole && hasTargetTech) ||
      // Case B: Deep domain specialist (e.g. Senior Shopify Developer with Next.js, Contentful, Commerce)
      (hasStrongPrimaryDomain && hasStrongTech) ||
      // Case C: Solutions Architect with Node/tech + client-facing + travel boost in India
      (roleClassification.primary === "SOLUTIONS_ARCHITECT" &&
        clientFacingFit.strength === "STRONG" &&
        hasTargetTech &&
        travelFit.strength === "STRONG")
    )
  ) {
    relevanceBucket = "HIGH_RELEVANCE";
  } else if (
    isIndiaFriendly &&
    hasSeniority &&
    (
      // Case 1: Architecture or Lead role in India, even if stack is adjacent (e.g. Solutions Architect with AWS/Java, SRE Architect in Hyderabad)
      isTargetRole ||
      hasPrimaryDomain ||
      clientFacingFit.strength === "STRONG" ||
      hasTargetTech
    )
  ) {
    relevanceBucket = "RELEVANT";
  } else if (
    hasTargetTech ||
    hasPrimaryDomain ||
    (hasSeniority && isIndiaFriendly) ||
    isTargetRole
  ) {
    relevanceBucket = "POSSIBLE";
  } else {
    relevanceBucket = "LOW_RELEVANCE";
  }

  // =========================================================================
  // 10. Transparent, Documented Sorting Score (Never opaque AI probability)
  // =========================================================================
  // Base tier points:
  let score = 20;
  if (relevanceBucket === "HIGH_RELEVANCE") score = 85;
  else if (relevanceBucket === "RELEVANT") score = 65;
  else if (relevanceBucket === "POSSIBLE") score = 45;
  else score = 20;

  // Documented Component Modifiers:
  // Location: Hyderabad (+6 pts), Remote India / Confirmed Worldwide (+5 pts), Target Metros (+4 pts)
  if (normLoc === "HYDERABAD") score += 6;
  else if (normLoc === "REMOTE_INDIA" || (normLoc === "REMOTE_GLOBAL" && indiaCheck.isIndiaEligible)) score += 5;
  else if (["BANGALORE", "PUNE", "CHENNAI", "MUMBAI", "DELHI_NCR"].includes(normLoc)) score += 4;
  else if (!indiaCheck.isIndiaEligible) score -= 10;

  // Technology Strength Modifier:
  if (technologyFit.strength === "STRONG") score += 5;
  else if (technologyFit.strength === "MODERATE") score += 3;

  // Domain Strength Modifier:
  if (domainFit.strength === "STRONG") score += 5;
  else if (domainFit.strength === "MODERATE") score += 3;

  // Positive Travel Signal:
  if (travelFit.strength === "STRONG") score += 4;

  // Client-Facing Signal:
  if (clientFacingFit.strength === "STRONG") score += 3;

  // Freshness Ordering Boost (separate from relevance bucket):
  if (freshnessStatus === "FRESH") score += 2;
  else if (freshnessStatus === "RECENT") score += 1;

  score = Math.min(100, Math.max(10, score));

  // =========================================================================
  // 11. Concrete "WHY THIS FITS" & "POTENTIAL GAPS"
  // =========================================================================
  const whyThisFits: string[] = [];
  if (roleFit.strength === "STRONG") {
    whyThisFits.push(`✓ Role: ${formatRoleFamily(roleClassification.primary)} (Evidence: "${job.title}")`);
  }
  if (matchedPrimaryDomains.length > 0) {
    whyThisFits.push(`✓ Domain: ${matchedPrimaryDomains.slice(0, 3).map(formatDomainName).join(", ")}`);
  }
  if (matchedTechs.length > 0) {
    matchedTechs.slice(0, 3).forEach((m) => {
      whyThisFits.push(`✓ ${m.technology} (Evidence: "${m.evidence}")`);
    });
  }
  if (seniorityStrength === "STRONG" && seniorityResult.level !== "UNKNOWN") {
    whyThisFits.push(`✓ ${seniorityResult.level} seniority (Evidence: ${seniorityResult.evidence})`);
  }
  if (locationFit.strength === "STRONG") {
    whyThisFits.push(`✓ ${locationReason}`);
  } else if (indiaCheck.isIndiaEligible) {
    whyThisFits.push(`✓ India eligible (${job.location})`);
  }
  if (travelFit.strength === "STRONG" && job.travelEvidence) {
    whyThisFits.push(`✓ Travel: ${job.travelEvidence}`);
  } else if (travelFit.strength === "STRONG") {
    whyThisFits.push(`✓ Travel: International / client-site travel${job.travelPercentage ? ` up to ${job.travelPercentage}%` : ""}`);
  }
  if (clientFacingFit.strength === "STRONG") {
    whyThisFits.push(`✓ Client-facing / stakeholder consulting exposure`);
  }

  const potentialGaps: string[] = [];
  if (!indiaCheck.isIndiaEligible) {
    potentialGaps.push(`! Location (${job.location}) does not confirm India hiring eligibility`);
  }
  if (tType === "RELOCATION") {
    potentialGaps.push(`! Requires relocation: ${job.travelEvidence || "International relocation"}`);
  }
  if (seniorityResult.experienceMin && seniorityResult.experienceMin > 15) {
    potentialGaps.push(`! Requires ${seniorityResult.experienceMin}+ years experience`);
  }
  if (seniorityResult.level === "ENTRY" || seniorityResult.level === "MID") {
    potentialGaps.push(`! Listed as ${seniorityResult.level}-level opportunity`);
  }
  if (matchedTechs.length === 0) {
    potentialGaps.push("! Target technologies (React, Next.js, Angular, Contentful, Commerce) not found in posting");
  }
  if (isAdjacentDomainOnly) {
    potentialGaps.push(`! Primary focus on adjacent domain (${matchedDomainKeys.map(formatDomainName).join(", ")}) rather than frontend/CMS`);
  }
  if (roleFit.strength === "NONE" || roleFit.strength === "WEAK") {
    potentialGaps.push(`! Role title does not explicitly state architecture or technical lead responsibilities`);
  }

  // =========================================================================
  // 12. Return JobMatchDetails with all Career Fit Dimensions
  // =========================================================================
  const dimensions: CareerFitDimensions = {
    roleFit,
    technologyFit,
    domainFit,
    seniorityFit,
    locationFit,
    remoteFit,
    travelFit,
    clientFacingFit,
    freshnessFit,
  };

  // Backwards compatibility for legacy breakdown
  const legacyRoleMatch: MatchCriterion = {
    matched: roleFit.matched,
    evidence: roleFit.evidence,
    reason: roleFit.reason,
  };
  const legacyTechMatch: MatchCriterion & { details?: TechnologyMatchDetail[] } = {
    matched: technologyFit.matched,
    evidence: technologyFit.evidence,
    reason: technologyFit.reason,
    details: [...techMatchResult.matched, ...techMatchResult.unmatched],
  };
  const legacyExpMatch: MatchCriterion = {
    matched: expMatchesYears,
    evidence: seniorityResult.experienceMin ? [`${seniorityResult.experienceMin}+ years`] : [seniorityResult.evidence],
    reason: seniorityFit.reason,
  };
  const legacyLocMatch: MatchCriterion = {
    matched: locationFit.matched,
    evidence: locationFit.evidence,
    reason: locationFit.reason,
  };
  const legacyRemoteMatch: MatchCriterion = {
    matched: remoteFit.matched,
    evidence: remoteFit.evidence,
    reason: remoteFit.reason,
  };
  const legacyTravelMatch: MatchCriterion = {
    matched: travelFit.matched,
    evidence: travelFit.evidence,
    reason: travelFit.reason,
  };
  const legacySeniorityMatch: MatchCriterion = {
    matched: seniorityFit.matched,
    evidence: seniorityFit.evidence,
    reason: seniorityFit.reason,
  };
  const legacySalaryCheck = matchesSalaryRequirement(job.salaryLpaMin, job.salaryDisclosed, profile.minSalaryLpa);
  const legacySalaryMatch: MatchCriterion = {
    matched: legacySalaryCheck.matches,
    evidence: job.salaryDisclosed && job.salaryLpaMin ? [`₹${job.salaryLpaMin}L PA`] : ["Undisclosed"],
    reason: legacySalaryCheck.reason,
  };
  const legacyClientFacingMatch: MatchCriterion = {
    matched: clientFacingFit.matched,
    evidence: clientFacingFit.evidence,
    reason: clientFacingFit.reason,
  };

  return {
    relevanceBucket,
    careerFit: relevanceBucket,
    reasons: whyThisFits.slice(0, 7),
    whyThisFits: whyThisFits.slice(0, 7),
    cautions: potentialGaps.slice(0, 4),
    potentialGaps: potentialGaps.slice(0, 4),
    domainMatches,
    dimensions,
    breakdown: {
      roleMatch: legacyRoleMatch,
      technologyMatch: legacyTechMatch,
      experienceMatch: legacyExpMatch,
      locationMatch: legacyLocMatch,
      remoteMatch: legacyRemoteMatch,
      travelMatch: legacyTravelMatch,
      seniorityMatch: legacySeniorityMatch,
      salaryMatch: legacySalaryMatch,
      clientFacingMatch: legacyClientFacingMatch,
    },
    overallScore: score,
  };
}
