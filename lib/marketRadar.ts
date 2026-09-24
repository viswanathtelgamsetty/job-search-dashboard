import type {
  CareerDomain,
  FreshnessStatus,
  Job,
  JobFiltersState,
  MarketRadarMetrics,
  MarketRadarSection,
  OpportunityPriority,
  OpportunityType,
  RelevanceBucket,
} from "@/types";

/**
 * Deterministically determines opportunity priority:
 * - PRIORITY: High/Relevant career fit + Fresh/Recent posting
 * - ACTIVE: High/Relevant career fit + Older posting
 * - WATCH: Possible career fit + Fresh/Recent posting
 * - LOW: Possible or Low career fit + Older posting (or Low career fit overall)
 */
export function calculateOpportunityPriority(
  careerFit: RelevanceBucket,
  freshness: FreshnessStatus
): OpportunityPriority {
  const isHighOrRelevant = careerFit === "HIGH_RELEVANCE" || careerFit === "RELEVANT";
  const isFreshOrRecent = freshness === "FRESH" || freshness === "RECENT";

  if (isHighOrRelevant) {
    return isFreshOrRecent ? "PRIORITY" : "ACTIVE";
  }

  if (careerFit === "POSSIBLE") {
    return isFreshOrRecent ? "WATCH" : "LOW";
  }

  // LOW_RELEVANCE
  return "LOW";
}

/**
 * Deterministic explanation reasons for opportunity priority.
 */
export function getOpportunityPriorityReasons(
  careerFit: RelevanceBucket,
  freshness: FreshnessStatus
): string[] {
  const isHighOrRelevant = careerFit === "HIGH_RELEVANCE" || careerFit === "RELEVANT";
  const isFreshOrRecent = freshness === "FRESH" || freshness === "RECENT";

  if (isHighOrRelevant && isFreshOrRecent) {
    return ["Strong career fit", "Recently posted"];
  }
  if (isHighOrRelevant && !isFreshOrRecent) {
    return ["Strong career fit", freshness === "UNKNOWN" ? "Posting date unknown" : "Older posting"];
  }
  if (careerFit === "POSSIBLE" && isFreshOrRecent) {
    return ["Possible career fit", "Recently posted"];
  }
  if (careerFit === "POSSIBLE" && !isFreshOrRecent) {
    return ["Possible career fit", freshness === "UNKNOWN" ? "Posting date unknown" : "Older posting"];
  }
  return [
    "Lower career fit",
    isFreshOrRecent ? "Recently posted" : freshness === "UNKNOWN" ? "Posting date unknown" : "Older posting",
  ];
}

/**
 * Helper to obtain the derived opportunity priority for a job.
 */
export function getOpportunityPriority(job: Job): OpportunityPriority {
  if (job.opportunityPriority) return job.opportunityPriority;
  const fit = job.careerFit || job.match?.relevanceBucket || "LOW_RELEVANCE";
  const freshness = job.freshness || "UNKNOWN";
  return calculateOpportunityPriority(fit, freshness);
}

export interface CareerLaneConfig {
  key: CareerDomain;
  label: string;
  icon: string;
  description: string;
}

export const CAREER_LANES: CareerLaneConfig[] = [
  { key: "FRONTEND", label: "Frontend", icon: "🎨", description: "React, Next.js, Angular, Design Systems" },
  { key: "DIGITAL_EXPERIENCE", label: "Digital Experience", icon: "🌐", description: "DXP, Headless Web Platforms" },
  { key: "CMS", label: "CMS", icon: "📝", description: "Contentful, Headless CMS, Modern Content" },
  { key: "COMMERCE", label: "Commerce", icon: "🛍️", description: "Shopify, commercetools, Headless Commerce" },
  { key: "ENTERPRISE_INTEGRATION", label: "Enterprise Integration", icon: "🔌", description: "APIs, Microservices, Enterprise Architecture" },
  { key: "SOLUTIONS_ARCHITECTURE", label: "Solutions Architecture", icon: "📐", description: "Client Solutions & System Design" },
  { key: "TECHNICAL_ARCHITECTURE", label: "Technical Architecture", icon: "🏗️", description: "Architecture Governance & Strategy" },
  { key: "CLIENT_CONSULTING", label: "Client Consulting", icon: "💼", description: "Advisory, Customer Engagements" },
  { key: "PROFESSIONAL_SERVICES", label: "Professional Services", icon: "🚀", description: "Implementation, Technical Delivery" },
  { key: "SOFTWARE_ENGINEERING", label: "Software Engineering", icon: "💻", description: "Full-Stack & Core Engineering" },
  { key: "DEVOPS", label: "DevOps", icon: "⚙️", description: "CI/CD, Cloud Infrastructure" },
  { key: "SRE", label: "SRE", icon: "🛡️", description: "Site Reliability, Observability" },
  { key: "DATA_AI", label: "Data/AI", icon: "🤖", description: "Data Platforms, AI/ML Integrations" },
  { key: "SECURITY", label: "Security", icon: "🔒", description: "AppSec, Identity & Access" },
];

export interface RadarSectionConfig {
  id: MarketRadarSection;
  tag: string;
  title: string;
  subtitle: string;
  badgeColor: string;
}

export const RADAR_SECTIONS: RadarSectionConfig[] = [
  {
    id: "ALL",
    tag: "ALL",
    title: "All Opportunities",
    subtitle: "Complete active market inventory",
    badgeColor: "bg-slate-800 text-slate-300 border-slate-700",
  },
  {
    id: "BEST_MATCHES",
    tag: "A",
    title: "Best Current Matches",
    subtitle: "High Relevance & Relevant profile fits",
    badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  },
  {
    id: "FRESH",
    tag: "B",
    title: "Fresh Opportunities",
    subtitle: "Newly posted in the market (within 3 days)",
    badgeColor: "bg-emerald-400/20 text-emerald-300 border-emerald-400/50",
  },
  {
    id: "TRAVEL",
    tag: "C",
    title: "International / Travel Opportunities",
    subtitle: "Verified travel and global customer exposure",
    badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
  },
  {
    id: "REMOTE_GLOBAL",
    tag: "D",
    title: "Remote Global",
    subtitle: "Worldwide distributed with India eligibility",
    badgeColor: "bg-sky-500/20 text-sky-300 border-sky-500/40",
  },
  {
    id: "HYDERABAD_INDIA",
    tag: "E",
    title: "Hyderabad / India",
    subtitle: "Primary local tech hub & Indian offices",
    badgeColor: "bg-cyan-500/20 text-cyan-300 border-cyan-500/40",
  },
  {
    id: "ADJACENT",
    tag: "F",
    title: "Adjacent Opportunities",
    subtitle: "Possible fits requiring transition or minor domain overlap",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
  },
  {
    id: "EMEA_OPPORTUNITIES",
    tag: "G",
    title: "EMEA Opportunities",
    subtitle: "Verified UK, European & Middle East regional roles",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
  },
  {
    id: "INDIA_TO_EMEA",
    tag: "H",
    title: "India → EMEA Roles",
    subtitle: "India-based positions engaging EMEA clients & international travel",
    badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40",
  },
];

/**
 * Calculates the summary metrics requested for the Market Radar (including Phase 7 additions).
 */
export function calculateMarketRadarMetrics(jobs: Job[]): MarketRadarMetrics {
  const liveJobs = jobs.filter((j) => !j.isDemo);

  const totalJobs = liveJobs.length;
  const highRelevance = liveJobs.filter(
    (j) => (j.careerFit || j.match?.relevanceBucket) === "HIGH_RELEVANCE"
  ).length;
  const relevant = liveJobs.filter(
    (j) => (j.careerFit || j.match?.relevanceBucket) === "RELEVANT"
  ).length;
  const possible = liveJobs.filter(
    (j) => (j.careerFit || j.match?.relevanceBucket) === "POSSIBLE"
  ).length;
  const lowRelevance = liveJobs.filter(
    (j) => (j.careerFit || j.match?.relevanceBucket) === "LOW_RELEVANCE"
  ).length;

  const india = liveJobs.filter((j) => j.isIndiaEligible || j.market === "INDIA").length;
  const hyderabad = liveJobs.filter((j) => j.normalizedLocation === "HYDERABAD").length;
  const remoteIndia = liveJobs.filter((j) => j.normalizedLocation === "REMOTE_INDIA").length;
  const globalRemote = liveJobs.filter(
    (j) =>
      j.travel?.type === "REMOTE_GLOBAL" ||
      j.normalizedLocation === "REMOTE_GLOBAL" ||
      j.market === "GLOBAL_REMOTE"
  ).length;
  const internationalOnsite = liveJobs.filter(
    (j) => !j.isIndiaEligible && (j.remoteType === "ONSITE" || j.remoteType === "HYBRID")
  ).length;

  const internationalTravel = liveJobs.filter(
    (j) =>
      j.travel?.type === "INTERNATIONAL_TRAVEL" ||
      j.internationalExposure?.exposure === "INTERNATIONAL_TRAVEL"
  ).length;
  const clientSiteTravel = liveJobs.filter(
    (j) =>
      j.travel?.type === "CLIENT_SITE_TRAVEL" ||
      j.internationalExposure?.exposure === "CLIENT_SITE_TRAVEL"
  ).length;
  const relocation = liveJobs.filter(
    (j) =>
      j.travel?.type === "RELOCATION" ||
      j.internationalExposure?.exposure === "RELOCATION"
  ).length;

  const freshJobs = liveJobs.filter((j) => j.freshness === "FRESH").length;
  const recentJobs = liveJobs.filter((j) => j.freshness === "RECENT").length;

  const priorityOpportunities = liveJobs.filter(
    (j) => getOpportunityPriority(j) === "PRIORITY"
  ).length;
  const activeOpportunities = liveJobs.filter(
    (j) => getOpportunityPriority(j) === "ACTIVE"
  ).length;
  const watchOpportunities = liveJobs.filter(
    (j) => getOpportunityPriority(j) === "WATCH"
  ).length;
  const lowOpportunities = liveJobs.filter(
    (j) => getOpportunityPriority(j) === "LOW"
  ).length;

  // Phase 7 Global & EMEA metrics
  const emeaOpportunities = liveJobs.filter((j) => j.market === "EMEA").length;
  const indiaToEmeaOpportunities = liveJobs.filter((j) => j.isIndiaToEmea).length;
  const northAmerica = liveJobs.filter((j) => j.market === "NORTH_AMERICA").length;
  const apac = liveJobs.filter((j) => j.market === "APAC").length;
  const clientFacingCount = liveJobs.filter((j) => j.clientFacing === "YES").length;
  const internationalPriorityCount = liveJobs.filter(
    (j) => j.internationalOpportunity?.bucket === "INTERNATIONAL_PRIORITY"
  ).length;
  const internationalActiveCount = liveJobs.filter(
    (j) => j.internationalOpportunity?.bucket === "INTERNATIONAL_ACTIVE"
  ).length;
  const internationalWatchCount = liveJobs.filter(
    (j) => j.internationalOpportunity?.bucket === "INTERNATIONAL_WATCH"
  ).length;

  const emeaCountryCounts: Record<string, number> = {};
  for (const j of liveJobs) {
    if (j.market === "EMEA" && j.emeaCountry) {
      emeaCountryCounts[j.emeaCountry] = (emeaCountryCounts[j.emeaCountry] || 0) + 1;
    }
  }

  return {
    totalJobs,
    highRelevance,
    relevant,
    possible,
    lowRelevance,
    india,
    hyderabad,
    remoteIndia,
    globalRemote,
    internationalOnsite,
    internationalTravel,
    clientSiteTravel,
    relocation,
    freshJobs,
    recentJobs,
    priorityOpportunities,
    activeOpportunities,
    watchOpportunities,
    lowOpportunities,
    emeaOpportunities,
    indiaToEmeaOpportunities,
    northAmerica,
    apac,
    clientFacingCount,
    internationalPriorityCount,
    internationalActiveCount,
    internationalWatchCount,
    emeaCountryCounts,
  };
}

/**
 * Checks whether a job matches a Market Radar section grouping.
 */
export function matchesRadarSection(job: Job, section: MarketRadarSection): boolean {
  if (section === "ALL") return true;

  const fit = job.careerFit || job.match?.relevanceBucket;

  switch (section) {
    case "BEST_MATCHES":
      // A. Best Current Matches: High Relevance or Relevant
      return fit === "HIGH_RELEVANCE" || fit === "RELEVANT";

    case "FRESH":
      // B. Fresh Opportunities: Fresh jobs
      return job.freshness === "FRESH";

    case "TRAVEL":
      // C. International / Travel Opportunities: International, Client-Site or Relocation
      return (
        job.travel.type === "INTERNATIONAL_TRAVEL" ||
        job.travel.type === "CLIENT_SITE_TRAVEL" ||
        job.travel.type === "RELOCATION"
      );

    case "REMOTE_GLOBAL":
      // D. Remote Global: Global remote, multi-region remote, or worldwide remote
      return (
        job.market === "MULTI_REGION_REMOTE" ||
        job.market === "GLOBAL_REMOTE" ||
        job.travel.type === "REMOTE_GLOBAL" ||
        job.normalizedLocation === "REMOTE_GLOBAL" ||
        job.normalizedLocation === "MULTI_REGION" ||
        (job.remoteType === "REMOTE" && job.isIndiaEligible)
      );

    case "HYDERABAD_INDIA":
      // E. Hyderabad / India
      return job.normalizedLocation === "HYDERABAD" || job.isIndiaEligible;

    case "ADJACENT":
      // F. Adjacent Opportunities: Possible fits
      return fit === "POSSIBLE";

    case "EMEA_OPPORTUNITIES":
      // G. EMEA Opportunities: Verified EMEA regional roles
      return job.market === "EMEA";

    case "INDIA_TO_EMEA":
      // H. India -> EMEA Roles: India based engaging EMEA clients / travel
      return job.isIndiaToEmea === true;

    default:
      return true;
  }
}

/**
 * Extracts data quality notices based on factual gaps in the job posting.
 * Does not manufacture missing data.
 */
export function getDataQualityNotices(job: Job): string[] {
  const notices: string[] = [];

  // Salary notice
  if (!job.salaryDisclosed || job.salaryState === "SALARY_NOT_DISCLOSED") {
    notices.push("Salary not disclosed");
  }

  // Travel notice
  if (job.travel.type === "NO_TRAVEL_MENTIONED" || job.travel.type === "UNKNOWN") {
    notices.push("Travel not mentioned");
  }

  // Location eligibility notice
  if (!job.isIndiaEligible && !job.indiaEligibilityReason && job.remoteType !== "ONSITE") {
    notices.push("Location eligibility unclear");
  }

  // Freshness notice
  if (job.freshness === "UNKNOWN" || (!job.postedAt && job.postedDaysAgo === undefined)) {
    notices.push("Freshness unavailable");
  }

  // Include any pre-existing provider-specific dataQualityWarnings
  if (job.dataQualityWarnings && job.dataQualityWarnings.length > 0) {
    for (const w of job.dataQualityWarnings) {
      if (!notices.includes(w)) {
        notices.push(w);
      }
    }
  }

  return notices;
}

/**
 * Deterministic explainable sorting for Market Radar.
 * Never creates an opaque numeric score.
 */
export function sortMarketRadarJobs(
  jobs: Job[],
  sortBy: JobFiltersState["sortBy"]
): Job[] {
  return [...jobs].sort((a, b) => {
    if (sortBy === "international") {
      // 1. Career fit FIRST (Section 15: International must not override career fit)
      const getFitRank = (j: Job) => {
        const bkt = j.careerFit || j.match?.relevanceBucket;
        if (bkt === "HIGH_RELEVANCE") return 4;
        if (bkt === "RELEVANT") return 3;
        if (bkt === "POSSIBLE") return 2;
        return 1;
      };
      const fitDiff = getFitRank(b) - getFitRank(a);
      if (fitDiff !== 0) return fitDiff;

      // 2. Role Tier
      const getTierRank = (j: Job) => {
        const tier = j.roleTier || j.match?.roleTier;
        if (tier === "TIER_1") return 5;
        if (tier === "TIER_2") return 4;
        if (tier === "TIER_3") return 3;
        if (tier === "TIER_4") return 2;
        if (tier === "TIER_5") return 1;
        return 2;
      };
      const tierDiff = getTierRank(b) - getTierRank(a);
      if (tierDiff !== 0) return tierDiff;

      // 3. Bucket: PRIORITY (4) > ACTIVE (3) > WATCH (2) > NOT_INTERNATIONAL (1)
      const getBucketWeight = (j: Job) => {
        const bkt = j.internationalOpportunity?.bucket;
        if (bkt === "INTERNATIONAL_PRIORITY") return 4;
        if (bkt === "INTERNATIONAL_ACTIVE") return 3;
        if (bkt === "INTERNATIONAL_WATCH") return 2;
        return 1;
      };
      const bktDiff = getBucketWeight(b) - getBucketWeight(a);
      if (bktDiff !== 0) return bktDiff;

      // 4. International opportunity score
      const scoreDiff = (b.internationalOpportunity?.score || 0) - (a.internationalOpportunity?.score || 0);
      if (scoreDiff !== 0) return scoreDiff;

      // 5. Freshness
      const bTime = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.discoveredAt).getTime();
      const aTime = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.discoveredAt).getTime();
      return bTime - aTime;
    }

    if (sortBy === "clientFacing") {
      const aCF = a.clientFacing === "YES" ? 1 : 0;
      const bCF = b.clientFacing === "YES" ? 1 : 0;
      if (bCF !== aCF) return bCF - aCF;

      const getFitRank = (j: Job) => {
        const bkt = j.careerFit || j.match?.relevanceBucket;
        if (bkt === "HIGH_RELEVANCE") return 4;
        if (bkt === "RELEVANT") return 3;
        if (bkt === "POSSIBLE") return 2;
        return 1;
      };
      return getFitRank(b) - getFitRank(a);
    }

    if (sortBy === "market") {
      const getMarketRank = (j: Job) => {
        if (j.market === "INDIA") return 6;
        if (j.market === "EMEA") return 5;
        if (j.market === "MULTI_REGION_REMOTE") return 4;
        if (j.market === "GLOBAL_REMOTE") return 3;
        if (j.market === "NORTH_AMERICA") return 2;
        if (j.market === "APAC") return 1;
        return 0;
      };
      const mDiff = getMarketRank(b) - getMarketRank(a);
      if (mDiff !== 0) return mDiff;
      return (a.market || "").localeCompare(b.market || "");
    }

    if (sortBy === "relevance") {
      // 1. Opportunity Priority Bucket (PRIORITY > ACTIVE > WATCH > LOW)
      const getPriorityWeight = (j: Job) => {
        const p = getOpportunityPriority(j);
        if (p === "PRIORITY") return 4;
        if (p === "ACTIVE") return 3;
        if (p === "WATCH") return 2;
        return 1;
      };
      const prioDiff = getPriorityWeight(b) - getPriorityWeight(a);
      if (prioDiff !== 0) return prioDiff;

      // 2. Freshness within priority bucket (FRESH > RECENT > OLDER > UNKNOWN)
      const getFreshRank = (j: Job) => {
        if (j.freshness === "FRESH") return 3;
        if (j.freshness === "RECENT") return 2;
        if (j.freshness === "OLDER") return 1;
        return 0;
      };
      const freshDiff = getFreshRank(b) - getFreshRank(a);
      if (freshDiff !== 0) return freshDiff;

      // 3. Career Fit (HIGH_RELEVANCE > RELEVANT > POSSIBLE > LOW_RELEVANCE)
      const getFitRank = (j: Job) => {
        const bkt = j.careerFit || j.match?.relevanceBucket;
        if (bkt === "HIGH_RELEVANCE") return 4;
        if (bkt === "RELEVANT") return 3;
        if (bkt === "POSSIBLE") return 2;
        return 1;
      };
      const fitDiff = getFitRank(b) - getFitRank(a);
      if (fitDiff !== 0) return fitDiff;

      // 4. Target Role Tier (TIER 1 > TIER 2 > TIER 3 > TIER 4 > TIER 5)
      const getTierRank = (j: Job) => {
        const tier = j.roleTier || j.match?.roleTier;
        if (tier === "TIER_1") return 5;
        if (tier === "TIER_2") return 4;
        if (tier === "TIER_3") return 3;
        if (tier === "TIER_4") return 2;
        if (tier === "TIER_5") return 1;
        return 2;
      };
      const tierDiff = getTierRank(b) - getTierRank(a);
      if (tierDiff !== 0) return tierDiff;

      // 5. Seniority
      const getSeniorityRank = (j: Job) => {
        const s = j.seniority;
        if (s === "ARCHITECT") return 7;
        if (s === "PRINCIPAL") return 6;
        if (s === "STAFF") return 5;
        if (s === "LEAD") return 4;
        if (s === "SENIOR") return 3;
        if (s === "MID") return 2;
        if (s === "ENTRY") return 1;
        return 0;
      };
      const senDiff = getSeniorityRank(b) - getSeniorityRank(a);
      if (senDiff !== 0) return senDiff;

      // 6. Primary Technology Match count
      const getPrimaryTechCount = (j: Job) =>
        j.primaryTechnologiesMatched?.length ??
        (j.match?.primaryTechnologiesMatched?.length || 0);
      const techDiff = getPrimaryTechCount(b) - getPrimaryTechCount(a);
      if (techDiff !== 0) return techDiff;

      // 7. Primary Domain Match count
      const getDomainCount = (j: Job) => j.domains?.length || 0;
      const domainDiff = getDomainCount(b) - getDomainCount(a);
      if (domainDiff !== 0) return domainDiff;

      // 8. Client Facing
      const aCF = a.clientFacing === "YES" ? 1 : 0;
      const bCF = b.clientFacing === "YES" ? 1 : 0;
      if (bCF !== aCF) return bCF - aCF;

      // 9. India Location / Eligibility
      const getIndiaRank = (j: Job) => {
        if (j.normalizedLocation === "HYDERABAD") return 4;
        if (j.normalizedLocation === "REMOTE_INDIA") return 3;
        if (j.isIndiaEligible) return 2;
        if (j.normalizedLocation === "REMOTE_GLOBAL" || j.market === "GLOBAL_REMOTE" || j.market === "MULTI_REGION_REMOTE") return 1;
        return 0;
      };
      const indiaDiff = getIndiaRank(b) - getIndiaRank(a);
      if (indiaDiff !== 0) return indiaDiff;

      // 10. International Customer Exposure
      const getIntlExposureRank = (j: Job) => {
        const exp = j.internationalExposure?.exposure;
        if (exp === "INTERNATIONAL_CUSTOMERS" || exp === "CLIENT_SITE_TRAVEL" || exp === "INTERNATIONAL_TRAVEL") return 2;
        if (exp === "INTERNATIONAL_TEAM") return 1;
        return 0;
      };
      const expDiff = getIntlExposureRank(b) - getIntlExposureRank(a);
      if (expDiff !== 0) return expDiff;

      // 11. International Travel
      const getTravelRank = (j: Job) => {
        if (j.travel?.type === "INTERNATIONAL_TRAVEL" || j.travel?.type === "CLIENT_SITE_TRAVEL") return 2;
        if (j.travel?.type === "REMOTE_GLOBAL") return 1;
        return 0;
      };
      const travelDiff = getTravelRank(b) - getTravelRank(a);
      if (travelDiff !== 0) return travelDiff;

      // 12. Fallback: timestamp
      const bTime = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.discoveredAt).getTime();
      const aTime = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.discoveredAt).getTime();
      return bTime - aTime;
    }

    if (sortBy === "freshest") {
      // Freshness: FRESH (4) > RECENT (3) > OLDER (2) > UNKNOWN (1)
      const getFreshRank = (j: Job) => {
        if (j.freshness === "FRESH") return 4;
        if (j.freshness === "RECENT") return 3;
        if (j.freshness === "OLDER") return 2;
        return 1;
      };
      const freshDiff = getFreshRank(b) - getFreshRank(a);
      if (freshDiff !== 0) return freshDiff;

      // Tie break by posted timestamp
      const bTime = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.discoveredAt).getTime();
      const aTime = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.discoveredAt).getTime();
      return bTime - aTime;
    }

    if (sortBy === "newest") {
      const bTime = b.postedAt ? new Date(b.postedAt).getTime() : new Date(b.discoveredAt).getTime();
      const aTime = a.postedAt ? new Date(a.postedAt).getTime() : new Date(a.discoveredAt).getTime();
      return bTime - aTime;
    }

    if (sortBy === "travel") {
      const getTravelWeight = (j: Job) => {
        if (j.travel.type === "INTERNATIONAL_TRAVEL") return 4;
        if (j.travel.type === "CLIENT_SITE_TRAVEL") return 3;
        if (j.travel.type === "REMOTE_GLOBAL") return 2;
        if (j.travel.type === "RELOCATION") return 1;
        return 0;
      };
      const travelDiff = getTravelWeight(b) - getTravelWeight(a);
      if (travelDiff !== 0) return travelDiff;

      // Tie break by percentage if available
      return (b.travel.percentage || 0) - (a.travel.percentage || 0);
    }

    if (sortBy === "location") {
      // Hyderabad first, then Bangalore, then other Indian metros, then alphabetical
      const getLocationRank = (j: Job) => {
        if (j.normalizedLocation === "HYDERABAD") return 10;
        if (j.normalizedLocation === "BANGALORE") return 9;
        if (j.normalizedLocation === "PUNE") return 8;
        if (j.normalizedLocation === "REMOTE_INDIA") return 7;
        if (j.isIndiaEligible) return 6;
        if (j.normalizedLocation === "REMOTE_GLOBAL") return 5;
        return 1;
      };
      const locDiff = getLocationRank(b) - getLocationRank(a);
      if (locDiff !== 0) return locDiff;
      return a.location.localeCompare(b.location);
    }

    if (sortBy === "salary") {
      return (b.salaryLpaMin || 0) - (a.salaryLpaMin || 0);
    }

    return 0;
  });
}

/**
 * Filters jobs using Phase 7 multi-dimensional parameters.
 */
export function filterJobsWithPhase7(jobs: Job[], filters: JobFiltersState): Job[] {
  return jobs.filter((job) => {
    // 1. Market Filter
    if (filters.market && filters.market !== "ALL") {
      if (job.market !== filters.market) return false;
    }

    // 2. EMEA Country Filter
    if (filters.emeaCountry && filters.emeaCountry !== "ALL") {
      if (job.emeaCountry !== filters.emeaCountry) return false;
    }

    // 3. Opportunity Type Filter
    if (filters.opportunityType && filters.opportunityType !== "ALL") {
      if (filters.opportunityType === "INDIA_TO_EMEA") {
        if (!job.isIndiaToEmea) return false;
      } else if (filters.opportunityType === "CLIENT_FACING") {
        if (job.clientFacing !== "YES") return false;
      } else if (filters.opportunityType === "INTERNATIONAL_TRAVEL") {
        const hasIntlTravel =
          job.travel?.type === "INTERNATIONAL_TRAVEL" ||
          job.internationalExposure?.exposure === "INTERNATIONAL_TRAVEL";
        if (!hasIntlTravel) return false;
      } else if (filters.opportunityType === "RELOCATION") {
        const isReloc =
          job.travel?.type === "RELOCATION" ||
          job.internationalExposure?.exposure === "RELOCATION" ||
          job.opportunityType === "RELOCATION";
        if (!isReloc) return false;
      } else if (filters.opportunityType === "GLOBAL_REMOTE") {
        const isGlobRem =
          job.market === "GLOBAL_REMOTE" ||
          job.opportunityType === "GLOBAL_REMOTE" ||
          job.travel?.type === "REMOTE_GLOBAL";
        if (!isGlobRem) return false;
      } else {
        const matchesPrimary = job.opportunityType === filters.opportunityType;
        const matchesMulti = job.opportunityTypes?.includes(filters.opportunityType as OpportunityType);
        if (!matchesPrimary && !matchesMulti) return false;
      }
    }

    // 4. International Exposure Filter
    if (filters.internationalExposure && filters.internationalExposure !== "ALL") {
      if (job.internationalExposure?.exposure !== filters.internationalExposure) {
        return false;
      }
    }

    // 5. Work Authorization Filter
    if (filters.workAuthorization && filters.workAuthorization !== "ALL") {
      if (job.workAuthorization?.authorization !== filters.workAuthorization) {
        return false;
      }
    }

    // 6. International Opportunity Bucket Filter
    if (filters.internationalBucket && filters.internationalBucket !== "ALL") {
      if (job.internationalOpportunity?.bucket !== filters.internationalBucket) {
        return false;
      }
    }

    return true;
  });
}
