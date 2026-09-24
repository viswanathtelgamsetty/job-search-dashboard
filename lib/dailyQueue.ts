import type { FitStrength, Job } from "@/types";

/**
 * Returns numeric priority rank for primary grouping:
 * 1. APPLY_NOW
 * 2. REVIEW
 * 3. Saved jobs (status === 'SAVED')
 * 4. Fresh HIGH_RELEVANCE
 * 5. Fresh RELEVANT
 * 6. WATCH
 * 7. Other active jobs
 */
export function getDailyQueueGroupRank(job: Job): number {
  if (job.status === "IGNORED") return -1; // Excluded

  const rec = job.applicationRecommendation || job.match?.applicationRecommendation;
  const fit = job.careerFit || job.match?.careerFit;
  const isFresh = job.freshness === "FRESH";

  if (rec === "APPLY_NOW") return 100;
  if (rec === "REVIEW") return 90;
  if (job.status === "SAVED") return 80;
  if (isFresh && fit === "HIGH_RELEVANCE") return 70;
  if (isFresh && fit === "RELEVANT") return 60;
  if (rec === "WATCH") return 50;
  return 10;
}

const STRENGTH_ORDER: Record<FitStrength, number> = {
  STRONG: 4,
  MODERATE: 3,
  WEAK: 2,
  NONE: 1,
};

function getStrengthScore(fit?: { strength?: FitStrength } | FitStrength): number {
  if (!fit) return 1;
  if (typeof fit === "string" && STRENGTH_ORDER[fit]) return STRENGTH_ORDER[fit];
  if (typeof fit === "object" && fit.strength && STRENGTH_ORDER[fit.strength]) {
    return STRENGTH_ORDER[fit.strength];
  }
  return 1;
}

/**
 * Deterministically sorts jobs for the daily queue.
 */
export function sortDailyJobQueue(jobs: Job[]): Job[] {
  return [...jobs]
    .filter((j) => j.status !== "IGNORED")
    .sort((a, b) => {
      // 1. Primary queue group rank
      const rankA = getDailyQueueGroupRank(a);
      const rankB = getDailyQueueGroupRank(b);
      if (rankB !== rankA) return rankB - rankA;

      // 2. Freshness: FRESH > RECENT > OLDER > UNKNOWN
      const freshOrder: Record<string, number> = { FRESH: 4, RECENT: 3, OLDER: 2, UNKNOWN: 1 };
      const fA = freshOrder[a.freshness || "UNKNOWN"] || 1;
      const fB = freshOrder[b.freshness || "UNKNOWN"] || 1;
      if (fB !== fA) return fB - fA;

      // 3. India eligibility: true > false
      const indA = a.isIndiaEligible ? 1 : 0;
      const indB = b.isIndiaEligible ? 1 : 0;
      if (indB !== indA) return indB - indA;

      // 4. Target role tier: TIER_1 > TIER_2 > TIER_3 > TIER_4 > TIER_5
      const tierOrder: Record<string, number> = {
        TIER_1: 5,
        TIER_2: 4,
        TIER_3: 3,
        TIER_4: 2,
        TIER_5: 1,
      };
      const tA = tierOrder[a.roleTier || a.match?.roleTier || "TIER_3"] || 1;
      const tB = tierOrder[b.roleTier || b.match?.roleTier || "TIER_3"] || 1;
      if (tB !== tA) return tB - tA;

      // 5. Technology fit: STRONG > MODERATE > WEAK > NONE
      const techA = getStrengthScore(a.technologyFit || a.match?.technologyFit);
      const techB = getStrengthScore(b.technologyFit || b.match?.technologyFit);
      if (techB !== techA) return techB - techA;

      // 6. Domain fit: STRONG > MODERATE > WEAK > NONE
      const domA = getStrengthScore(a.domainFit || a.match?.domainFit);
      const domB = getStrengthScore(b.domainFit || b.match?.domainFit);
      if (domB !== domA) return domB - domA;

      // 7. Architecture fit: STRONG > MODERATE > WEAK > NONE
      const archA = getStrengthScore(a.architectureFit || a.match?.architectureFit);
      const archB = getStrengthScore(b.architectureFit || b.match?.architectureFit);
      if (archB !== archA) return archB - archA;

      // 8. International & Client Opportunity
      const travelOrder: Record<string, number> = {
        CLIENT_SITE_TRAVEL: 4,
        INTERNATIONAL_TRAVEL: 3,
        INTERNATIONAL_TEAM_ONLY: 2,
        REMOTE_GLOBAL: 2,
        NO_TRAVEL_MENTIONED: 1,
        UNKNOWN: 0,
      };
      const trA = travelOrder[a.travel?.type || a.travelType || "UNKNOWN"] || 0;
      const trB = travelOrder[b.travel?.type || b.travelType || "UNKNOWN"] || 0;
      if (trB !== trA) return trB - trA;

      // 9. Overall Score
      const scoreA = a.match?.overallScore || 0;
      const scoreB = b.match?.overallScore || 0;
      return scoreB - scoreA;
    });
}

export const buildDailyQueue = sortDailyJobQueue;
export const getPriorityTier = getDailyQueueGroupRank;

