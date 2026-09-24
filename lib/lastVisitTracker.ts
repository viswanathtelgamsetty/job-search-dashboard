import type { Job } from "@/types";

export const LAST_VISIT_STORAGE_KEY = "job-market-radar:last-visit:v1";

let inMemoryLastVisit: string | null = null;

export function getLastVisitTimestamp(): string {
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    if (!inMemoryLastVisit) {
      // Default to 24 hours ago for initial visit session
      inMemoryLastVisit = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }
    return inMemoryLastVisit;
  }

  try {
    const stored = localStorage.getItem(LAST_VISIT_STORAGE_KEY);
    if (!stored) {
      const fallback = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem(LAST_VISIT_STORAGE_KEY, fallback);
      return fallback;
    }
    return stored;
  } catch {
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  }
}

export function updateLastVisitTimestamp(timestampIso?: string): void {
  const ts = timestampIso || new Date().toISOString();
  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    inMemoryLastVisit = ts;
    return;
  }
  try {
    localStorage.setItem(LAST_VISIT_STORAGE_KEY, ts);
  } catch {
    // Ignore quota issues
  }
}

export interface NewSinceLastVisitSummary {
  lastVisitDate: string;
  totalNewJobs: number;
  newApplyNow: Job[];
  newReview: Job[];
  newHighRelevance: Job[];
  newInternational: Job[];
  newHyderabad: Job[];
  newRemoteIndia: Job[];
}

export function getNewJobsSinceLastVisit(
  jobs: Job[],
  lastVisitIso?: string
): NewSinceLastVisitSummary {
  const cutoffIso = lastVisitIso || getLastVisitTimestamp();
  const cutoffTime = new Date(cutoffIso).getTime();

  const newJobs = jobs.filter((j) => {
    if (!j.discoveredAt) return false;
    const discTime = new Date(j.discoveredAt).getTime();
    return !isNaN(discTime) && discTime > cutoffTime;
  });

  const newApplyNow = newJobs.filter(
    (j) => (j.applicationRecommendation || j.match?.applicationRecommendation) === "APPLY_NOW"
  );
  const newReview = newJobs.filter(
    (j) => (j.applicationRecommendation || j.match?.applicationRecommendation) === "REVIEW"
  );
  const newHighRelevance = newJobs.filter(
    (j) => (j.careerFit || j.match?.careerFit) === "HIGH_RELEVANCE"
  );
  const newInternational = newJobs.filter(
    (j) =>
      j.travel?.type === "INTERNATIONAL_TRAVEL" ||
      j.travel?.type === "CLIENT_SITE_TRAVEL" ||
      j.market === "EMEA" ||
      j.market === "NORTH_AMERICA" ||
      j.market === "GLOBAL_REMOTE"
  );
  const newHyderabad = newJobs.filter(
    (j) =>
      j.normalizedLocation === "HYDERABAD" ||
      (j.location && /hyderabad/i.test(j.location))
  );
  const newRemoteIndia = newJobs.filter(
    (j) =>
      j.isIndiaEligible &&
      (j.remoteType === "REMOTE" || (j.location && /remote/i.test(j.location)))
  );

  return {
    lastVisitDate: cutoffIso,
    totalNewJobs: newJobs.length,
    newApplyNow,
    newReview,
    newHighRelevance,
    newInternational,
    newHyderabad,
    newRemoteIndia,
  };
}
