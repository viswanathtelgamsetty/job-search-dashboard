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
import { extractTravelDetails } from "./travelExtractor.ts";
import {
  matchWeightedTechnologies,
  PRIMARY_TARGET_TECHNOLOGIES,
} from "./technologyMatcher.ts";
import {
  classifyRoleFamily,
  classifyRoleTier,
  formatRoleFamily,
  formatRoleTier,
} from "./roleClassifier.ts";
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
 * Phase 3.2 / 7.1 — Career Fit Model for 12+ Year Technical Lead / Architect Profile
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

  // Primary domain evidence (STRONG or MODERATE) - WEAK domains are separated
  const matchedDomainKeys: CareerDomain[] = domainMatches
    .filter((d) => d.matched && d.domain !== "OTHER" && d.strength !== "WEAK")
    .map((d) => d.domain);

  const secondaryEvidenceDomains: CareerDomain[] = domainMatches
    .filter((d) => d.matched && d.domain !== "OTHER" && d.strength === "WEAK")
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
      .filter((d) => d.matched && d.domain !== "OTHER" && d.strength !== "WEAK")
      .map((d) => `${formatDomainName(d.domain)}: "${d.evidence}"`),
    reason:
      matchedPrimaryDomains.length > 0
        ? `Matches target career domains: ${matchedPrimaryDomains.map(formatDomainName).join(", ")}`
        : isAdjacentDomainOnly
        ? `Matches adjacent technical domains (${matchedDomainKeys.map(formatDomainName).join(", ")})`
        : "No explicit target technical domains identified",
  };

  // =========================================================================
  // 2. Evidence-Based Weighted Technology Matching (Requirement 9 & 12)
  // =========================================================================
  const weightedTechResult = matchWeightedTechnologies(fullText, job.skills || []);
  const primaryMatched = weightedTechResult.primaryMatched;
  const secondaryMatched = weightedTechResult.secondaryMatched;
  const primaryTechNames = primaryMatched.map((m) => m.technology);
  const secondaryTechNames = secondaryMatched.map((m) => m.technology);

  const hasCoreTech = primaryTechNames.some((t) =>
    ["React", "Next.js", "Angular", "Contentful", "Commerce", "Shopify", "Headless CMS"].includes(t)
  );

  let techFitStrength: FitStrength = "NONE";
  if (primaryMatched.length >= 2 || (hasCoreTech && primaryMatched.length >= 1)) {
    techFitStrength = "STRONG";
  } else if (primaryMatched.length >= 1) {
    techFitStrength = "MODERATE";
  } else if (secondaryMatched.length >= 1) {
    techFitStrength = "WEAK";
  }

  const technologyFit: DimensionFit = {
    matched: primaryMatched.length > 0,
    strength: techFitStrength,
    evidence: primaryMatched.map((m) => `${m.technology}: "${m.evidence}"`),
    reason:
      primaryMatched.length > 0
        ? `Found ${primaryMatched.length} primary target technologies: ${primaryTechNames.join(", ")}`
        : secondaryMatched.length > 0
        ? `Secondary infrastructure technologies only (${secondaryTechNames.join(", ")})`
        : "Target technologies (React, Next.js, Angular, Contentful, Commerce) not found in posting",
  };

  // =========================================================================
  // 3. Role Family & Role Tier Fit (Requirement 10)
  // =========================================================================
  const roleClassification = job.roleFamily
    ? { primary: job.roleFamily, secondary: [], evidence: [`Title: "${job.title}"`] }
    : classifyRoleFamily(job.title, job.description);

  const roleTierResult = classifyRoleTier(
    job.title,
    job.description || "",
    roleClassification.primary
  );
  const roleTier = roleTierResult.tier;

  let roleFitStrength: FitStrength = "NONE";
  if (roleTier === "TIER_1") {
    roleFitStrength = "STRONG";
  } else if (roleTier === "TIER_2") {
    roleFitStrength = "MODERATE";
  } else if (roleTier === "TIER_3") {
    roleFitStrength = "WEAK";
  }

  const roleFit: DimensionFit = {
    matched: roleTier === "TIER_1" || roleTier === "TIER_2",
    strength: roleFitStrength,
    evidence: [
      `Job title: "${job.title}"`,
      `Classified role: ${formatRoleFamily(roleClassification.primary)} (${formatRoleTier(roleTier)})`,
    ],
    reason: roleTierResult.reason,
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
  const extractedTravel = (!job.travelType || job.travelType === "UNKNOWN") && job.description
    ? extractTravelDetails(job.description)
    : null;
  const tType = job.travelType || extractedTravel?.type || "UNKNOWN";
  const tEvidence = job.travelEvidence || extractedTravel?.evidence;
  const tPercentage = job.travelPercentage ?? extractedTravel?.percentage;
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
    evidence: tEvidence ? [tEvidence] : [tType],
    reason:
      tType === "INTERNATIONAL_TRAVEL"
        ? `Explicit international travel requirement (${tPercentage ? `${tPercentage}%` : "customer site"}) (Positive Signal)`
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
    /\b(?:client|customer|stakeholder|consulting|professional\s+services|presales|vendor|partner|advisory)\b/i;
  const isClientFacing =
    clientFacingKeywords.test(fullTextLower) ||
    [
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
  // 9. Career Fit Classification (Strict Phase 7.1 Rules)
  // =========================================================================
  const isIndiaFriendly = locationFit.strength === "STRONG" || locationFit.strength === "MODERATE";
  const hasSeniority = seniorityFit.strength === "STRONG" || seniorityFit.strength === "MODERATE";
  const hasPrimaryTech = primaryMatched.length > 0;
  const hasStrongTech = techFitStrength === "STRONG";
  const hasStrongPrimaryDomain = domainFit.strength === "STRONG";

  // Low Priority / Excluded roles check
  const isLowPriorityOrExcluded =
    /\b(qa\b|quality\s+assurance|tester|testing|sdet|test\s+automation|hr\b|human\s+resources|recruiter|recruitment|talent\s+acquisition|product\s+manager|project\s+manager|scrum\s+master|sales\s+only|account\s+executive|business\s+development|administrative|office\s+assistant|admin\s+assistant|customer\s+support|helpdesk|intern\b|graduate\b|trainee\b|apprentice\b|junior\b|entry\s+level)\b/i.test(
      job.title
    );

  // Section 6: Real Frontend Evidence
  const hasRealFrontendEvidence =
    matchedDomainKeys.includes("FRONTEND") ||
    primaryTechNames.some((t) =>
      ["React", "Next.js", "Angular", "TypeScript", "JavaScript", "Design Systems"].includes(t)
    ) ||
    /\b(react|angular|next\.?js|frontend|front[- ]end|ui\s+(?:architect|engineer|developer|lead)|web\s+application|design\s+systems?)\b/i.test(
      `${job.title} ${job.description || ""}`
    );

  // Section 7: Real Architecture Evidence
  const hasRealArchitectureEvidence =
    /\b(architecture\s+ownership|solution\s+design|technical\s+architecture|system\s+design|enterprise\s+architecture|integration\s+architecture|technical\s+strategy|customer\s+architecture|architecture\s+decisions|technical\s+discovery|implementation\s+architecture|architectural\s+governance|architectural\s+decisions|system\s+architecture|lead\s+architect)\b/i.test(
      `${job.title} ${job.description || ""}`
    ) ||
    matchedPrimaryDomains.some((d) =>
      ["TECHNICAL_ARCHITECTURE", "SOLUTIONS_ARCHITECTURE", "ENTERPRISE_INTEGRATION"].includes(d)
    );

  // Client-Facing Architecture / Consulting Evidence (Section 4 & 5)
  // Must require explicit customer/client engagement, not just the word "Solutions" in title
  const hasClientConsultingEvidence =
    /\b(?:client[- ]facing|customer[- ]facing|client\s+consulting|customer\s+architecture|technical\s+consulting|professional\s+services|solution\s+consulting|external\s+stakeholder|presales\s+architecture)\b/i.test(
      `${job.title} ${job.description || ""}`
    ) ||
    (clientFacingFit.strength === "STRONG" &&
      /\b(?:client|customer|consulting|advisory)\b/i.test(`${job.title} ${job.description || ""}`) &&
      (roleClassification.primary === "SOLUTIONS_ARCHITECT" ||
        roleClassification.primary === "TECHNICAL_CONSULTANT" ||
        roleClassification.primary === "PROFESSIONAL_SERVICES" ||
        roleClassification.primary === "SOLUTIONS_ENGINEER" ||
        matchedPrimaryDomains.includes("CLIENT_CONSULTING") ||
        matchedPrimaryDomains.includes("PROFESSIONAL_SERVICES")));

  let relevanceBucket: RelevanceBucket;

  if (roleTier === "TIER_5" || isLowPriorityOrExcluded) {
    relevanceBucket = "LOW_RELEVANCE";
  } else if (
    // Section 11: Data/AI roles (Data Scientist, ML, AI Engineer) are LOW_RELEVANCE unless Tier 1 architect
    (roleClassification.primary === "DATA_AI" ||
      /\b(data\s+scientist|machine\s+learning|ai\s+engineer|nlp)\b/i.test(job.title)) &&
    roleTier !== "TIER_1"
  ) {
    relevanceBucket = "LOW_RELEVANCE";
  } else if (
    isIndiaFriendly &&
    hasSeniority &&
    seniorityResult.level !== "ENTRY" &&
    seniorityResult.level !== "MID" &&
    roleTier === "TIER_1" &&
    (
      // A. Real Frontend Architect or Senior Frontend Engineer with real frontend evidence & primary tech
      ((roleClassification.primary === "FRONTEND_ARCHITECT" || roleClassification.primary === "SENIOR_FRONTEND_ENGINEER") &&
        hasRealFrontendEvidence &&
        hasPrimaryTech) ||
      // B. Solutions Architect with customer consulting evidence + architecture or primary tech
      (roleClassification.primary === "SOLUTIONS_ARCHITECT" &&
        hasClientConsultingEvidence &&
        (hasRealArchitectureEvidence || hasPrimaryTech)) ||
      // C. Commerce or CMS Architect with primary tech or strong primary domain
      ((roleClassification.primary === "COMMERCE" || roleClassification.primary === "CMS_DIGITAL_EXPERIENCE") &&
        (hasPrimaryTech || hasStrongPrimaryDomain)) ||
      // D. Technical Architect with architecture evidence and target tech or integration
      (roleClassification.primary === "TECHNICAL_ARCHITECT" &&
        hasRealArchitectureEvidence &&
        (hasPrimaryTech || matchedPrimaryDomains.length >= 1)) ||
      // E. Deep primary domain specialist with strong primary tech (e.g. Next.js + Contentful + Commerce)
      (hasStrongPrimaryDomain && hasStrongTech && hasRealFrontendEvidence)
    )
  ) {
    relevanceBucket = "HIGH_RELEVANCE";
  } else if (
    isIndiaFriendly &&
    hasSeniority &&
    seniorityResult.level !== "ENTRY" &&
    seniorityResult.level !== "MID" &&
    // Role alignment check:
    (
      // Tier 1 roles that didn't qualify for HIGH
      roleTier === "TIER_1" ||
      // Tier 2 roles with primary tech, domain match, or client consulting
      (roleTier === "TIER_2" && (hasPrimaryTech || matchedPrimaryDomains.length >= 1 || hasClientConsultingEvidence)) ||
      // Tier 3 roles ONLY if they have real frontend evidence or real architecture evidence
      (roleTier === "TIER_3" && (hasRealFrontendEvidence || hasRealArchitectureEvidence)) ||
      // Tier 4 roles ONLY if strong architecture + frontend evidence exists (otherwise Tier 4 is POSSIBLE/LOW)
      (roleTier === "TIER_4" && hasRealFrontendEvidence && hasRealArchitectureEvidence)
    )
  ) {
    relevanceBucket = "RELEVANT";
  } else if (
    roleTier === "TIER_4"
  ) {
    // Section 11: Tier 4 roles (DevOps, SRE, Cloud Ops, Rust, Backend)
    // Only POSSIBLE if architecture or client consulting overlap exists; otherwise LOW_RELEVANCE
    if (
      hasRealArchitectureEvidence ||
      hasClientConsultingEvidence ||
      (hasPrimaryTech && hasRealFrontendEvidence)
    ) {
      relevanceBucket = "POSSIBLE";
    } else {
      relevanceBucket = "LOW_RELEVANCE";
    }
  } else if (
    hasPrimaryTech ||
    matchedPrimaryDomains.length >= 1 ||
    (hasSeniority && isIndiaFriendly && seniorityResult.level !== "ENTRY") ||
    matchedDomainKeys.length >= 1
  ) {
    relevanceBucket = "POSSIBLE";
  } else {
    relevanceBucket = "LOW_RELEVANCE";
  }

  // =========================================================================
  // 10. Transparent, Deterministic Priority Scoring (Section 16)
  // Deterministic Ranking Order:
  // 1. Career Fit
  // 2. Target Role Tier
  // 3. Seniority
  // 4. Primary Technology Match
  // 5. Primary Domain Match
  // 6. Client Facing
  // 7. India Eligibility
  // 8. International Customer Exposure
  // 9. International Travel
  // 10. Freshness
  // =========================================================================
  let score = 20;
  if (relevanceBucket === "HIGH_RELEVANCE") score = 85;
  else if (relevanceBucket === "RELEVANT") score = 65;
  else if (relevanceBucket === "POSSIBLE") score = 42;
  else score = 15;

  // 2. Role Tier Modifier:
  if (roleTier === "TIER_1") score += 8;
  else if (roleTier === "TIER_2") score += 4;
  else if (roleTier === "TIER_3") score += 1;
  else if (roleTier === "TIER_4") score -= 5;
  else if (roleTier === "TIER_5") score -= 15;

  // 3. Seniority Modifier:
  if (seniorityResult.level === "ARCHITECT" || seniorityResult.level === "PRINCIPAL") score += 3;
  else if (seniorityResult.level === "STAFF" || seniorityResult.level === "LEAD") score += 2;
  else if (seniorityResult.level === "SENIOR") score += 1;

  // 4. Primary Technology Match Modifier:
  if (primaryMatched.length >= 3) score += 5;
  else if (primaryMatched.length >= 1) score += 3;

  // Secondary Tech Modifier: capped at +1 (must NOT dominate ranking!)
  if (secondaryMatched.length >= 1 && primaryMatched.length > 0) score += 1;

  // 5. Primary Domain Modifier:
  if (matchedPrimaryDomains.length >= 2) score += 4;
  else if (matchedPrimaryDomains.length >= 1) score += 2;

  // 6. Client-Facing Modifier:
  if (clientFacingFit.strength === "STRONG") score += 2;

  // 7. Location & India Eligibility:
  if (normLoc === "HYDERABAD") score += 4;
  else if (normLoc === "REMOTE_INDIA" || (normLoc === "REMOTE_GLOBAL" && indiaCheck.isIndiaEligible)) score += 3;
  else if (["BANGALORE", "PUNE", "CHENNAI", "MUMBAI", "DELHI_NCR"].includes(normLoc)) score += 2;
  else if (!indiaCheck.isIndiaEligible) score -= 8;

  // 8. International / Travel (Bonus, never beats career fit):
  if (travelFit.strength === "STRONG") score += 2;

  // 9. Freshness:
  if (freshnessStatus === "FRESH") score += 2;
  else if (freshnessStatus === "RECENT") score += 1;

  score = Math.min(100, Math.max(10, score));

  // =========================================================================
  // 11. Concrete "WHY THIS FITS" & "POTENTIAL GAPS" (Section 13 & 14)
  // =========================================================================
  const whyThisFits: string[] = [];

  // Role alignment
  if (roleTier === "TIER_1") {
    whyThisFits.push(`✓ ${formatRoleFamily(roleClassification.primary)} role (Core Target Architecture)`);
  } else if (roleTier === "TIER_2") {
    whyThisFits.push(`✓ ${formatRoleFamily(roleClassification.primary)} role (Consulting / Solutions Engineering)`);
  } else if (roleFit.strength === "STRONG") {
    whyThisFits.push(`✓ Technical Leadership role: "${job.title}"`);
  }

  // Client-facing architecture
  if (hasClientConsultingEvidence && hasRealArchitectureEvidence) {
    whyThisFits.push(`✓ Customer-facing architecture & technical consulting`);
  } else if (clientFacingFit.strength === "STRONG") {
    whyThisFits.push(`✓ Client-facing stakeholder engagement`);
  }

  // Primary technologies matched
  if (primaryMatched.length > 0) {
    const techNames = primaryMatched.slice(0, 3).map((m) => m.technology).join(" + ");
    whyThisFits.push(`✓ Target technology: ${techNames}`);
  }

  // Primary domains
  if (matchedPrimaryDomains.length > 0) {
    whyThisFits.push(`✓ Domain: ${matchedPrimaryDomains.slice(0, 2).map(formatDomainName).join(", ")}`);
  }

  // Seniority
  if (seniorityStrength === "STRONG" && (roleTier === "TIER_1" || roleTier === "TIER_2")) {
    whyThisFits.push(`✓ 12+ years senior architect/lead depth (${seniorityResult.level})`);
  }

  // Location (supporting dimension)
  if (normLoc === "HYDERABAD") {
    whyThisFits.push(`✓ India based (Hyderabad Hub)`);
  } else if (normLoc === "REMOTE_INDIA") {
    whyThisFits.push(`✓ India based (Remote India)`);
  } else if (indiaCheck.isIndiaEligible) {
    whyThisFits.push(`✓ India based (${job.location})`);
  }

  // Travel
  if (travelFit.strength === "STRONG" && job.travelEvidence) {
    whyThisFits.push(`✓ Travel: ${job.travelEvidence}`);
  } else if (travelFit.strength === "STRONG") {
    whyThisFits.push(`✓ Travel: International / client-site travel`);
  }

  // Meaningful Gaps (Section 14)
  const potentialGaps: string[] = [];

  if (/\b(devops|sre|infrastructure)\b/i.test(job.title)) {
    potentialGaps.push("! Primary focus is DevOps rather than frontend architecture");
  } else if (/\b(cloud\s+operations|cloud\s+ops)\b/i.test(job.title)) {
    potentialGaps.push("! Primary focus is Cloud Operations rather than architecture");
  } else if (/\b(data\s+scientist|data\s+engineer|machine\s+learning|ai\s+engineer)\b/i.test(job.title) || roleClassification.primary === "DATA_AI") {
    potentialGaps.push("! Role is primarily Data/AI rather than frontend or technical architecture");
  } else if (/\b(rust|c\+\+|golang|backend\s+engineer|java\s+engineer)\b/i.test(job.title) && !hasRealFrontendEvidence) {
    potentialGaps.push("! Role is primarily backend systems engineering rather than frontend/digital experience");
  } else if (roleTier === "TIER_4") {
    potentialGaps.push(`! Primary focus on adjacent domain (${matchedDomainKeys.map(formatDomainName).join(", ")}) rather than frontend/CMS`);
  }

  if (primaryMatched.length === 0) {
    potentialGaps.push("! Target technologies (React, Next.js, Angular, Contentful, Commerce) not found in posting");
  }

  if (!indiaCheck.isIndiaEligible) {
    potentialGaps.push(`! Location does not confirm India eligibility (${job.location})`);
  }

  if (tType === "RELOCATION") {
    potentialGaps.push(`! Requires physical relocation: ${job.travelEvidence || "International relocation"}`);
  }

  if (seniorityResult.level === "ENTRY" || seniorityResult.level === "MID") {
    potentialGaps.push(`! Listed as ${seniorityResult.level}-level opportunity (below 12+ years target)`);
  }

  if (roleTier === "TIER_3" && !hasRealFrontendEvidence && !hasRealArchitectureEvidence) {
    potentialGaps.push("! General software engineering role without explicit frontend or architecture leadership scope");
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

  // Build full technology details array covering all profile technologies for backward compatibility
  const techSourceList: string[] =
    (profile as { technologies?: string[] })?.technologies ||
    profile?.targetSkills ||
    PRIMARY_TARGET_TECHNOLOGIES;
  const allProfileTechDetails: TechnologyMatchDetail[] = techSourceList.map((t: string) => {
    const p = primaryMatched.find((m) => m.technology.toLowerCase() === t.toLowerCase());
    if (p) return p;
    const s = secondaryMatched.find((m) => m.technology.toLowerCase() === t.toLowerCase());
    if (s) return s;
    return {
      technology: t,
      matched: false,
      evidence: null,
    };
  });

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
    details: allProfileTechDetails,
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
    roleTier,
    primaryTechnologiesMatched: primaryTechNames,
    secondaryTechnologiesMatched: secondaryTechNames,
    domainMatches,
    secondaryEvidenceDomains,
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
