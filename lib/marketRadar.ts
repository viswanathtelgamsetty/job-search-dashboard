import type { CareerDomain, Job, JobFiltersState, MarketRadarMetrics, MarketRadarSection } from "@/types";

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
];

/**
 * Calculates the exact 15 summary metrics requested for the Market Radar.
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

  const india = liveJobs.filter((j) => j.isIndiaEligible).length;
  const hyderabad = liveJobs.filter((j) => j.normalizedLocation === "HYDERABAD").length;
  const remoteIndia = liveJobs.filter((j) => j.normalizedLocation === "REMOTE_INDIA").length;
  const globalRemote = liveJobs.filter(
    (j) => j.travel?.type === "REMOTE_GLOBAL" || j.normalizedLocation === "REMOTE_GLOBAL"
  ).length;
  const internationalOnsite = liveJobs.filter(
    (j) => !j.isIndiaEligible && (j.remoteType === "ONSITE" || j.remoteType === "HYBRID")
  ).length;

  const internationalTravel = liveJobs.filter(
    (j) => j.travel?.type === "INTERNATIONAL_TRAVEL"
  ).length;
  const clientSiteTravel = liveJobs.filter(
    (j) => j.travel?.type === "CLIENT_SITE_TRAVEL"
  ).length;
  const relocation = liveJobs.filter(
    (j) => j.travel?.type === "RELOCATION"
  ).length;

  const freshJobs = liveJobs.filter((j) => j.freshness === "FRESH").length;
  const recentJobs = liveJobs.filter((j) => j.freshness === "RECENT").length;

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
      // D. Remote Global: Global remote or worldwide remote
      return (
        job.travel.type === "REMOTE_GLOBAL" ||
        job.normalizedLocation === "REMOTE_GLOBAL" ||
        (job.remoteType === "REMOTE" && job.isIndiaEligible)
      );

    case "HYDERABAD_INDIA":
      // E. Hyderabad / India
      return job.normalizedLocation === "HYDERABAD" || job.isIndiaEligible;

    case "ADJACENT":
      // F. Adjacent Opportunities: Possible fits
      return fit === "POSSIBLE";

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
    if (sortBy === "relevance") {
      // 1. Career Fit bucket rank: HIGH_RELEVANCE (4) > RELEVANT (3) > POSSIBLE (2) > LOW_RELEVANCE (1)
      const getRank = (j: Job) => {
        const bkt = j.careerFit || j.match?.relevanceBucket;
        if (bkt === "HIGH_RELEVANCE") return 4;
        if (bkt === "RELEVANT") return 3;
        if (bkt === "POSSIBLE") return 2;
        return 1;
      };
      const rankDiff = getRank(b) - getRank(a);
      if (rankDiff !== 0) return rankDiff;

      // 2. Primary target location (Hyderabad first)
      const aHyd = a.normalizedLocation === "HYDERABAD" ? 1 : 0;
      const bHyd = b.normalizedLocation === "HYDERABAD" ? 1 : 0;
      if (bHyd !== aHyd) return bHyd - aHyd;

      // 3. India eligibility
      const aInd = a.isIndiaEligible ? 1 : 0;
      const bInd = b.isIndiaEligible ? 1 : 0;
      if (bInd !== aInd) return bInd - aInd;

      // 4. Number of matched target technologies
      const aTech = a.matchedTargetTechnologies?.length || 0;
      const bTech = b.matchedTargetTechnologies?.length || 0;
      if (bTech !== aTech) return bTech - aTech;

      // 5. Freshness
      const freshRank = (j: Job) => (j.freshness === "FRESH" ? 3 : j.freshness === "RECENT" ? 2 : 1);
      return freshRank(b) - freshRank(a);
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
