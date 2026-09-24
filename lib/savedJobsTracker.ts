import type { Application, Job } from "@/types";

export interface SavedJobAgingInfo {
  job: Job;
  application?: Application;
  savedDate: string;
  daysSinceSaved: number;
  agingStatus: "RECENT" | "ACTION_RECOMMENDED" | "CRITICAL";
  isActionRecommended: boolean;
  isAgingAlert: boolean;
  agingBadgeText: string;
  recommendation: string;
  careerFit: string;
  potentialGaps: string[];
}

export function calculateSavedJobAging(
  job: Job,
  application?: Application,
  nowIso?: string
): SavedJobAgingInfo {
  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  const savedIso =
    application?.savedAt ||
    job.savedAt ||
    application?.createdAt ||
    job.discoveredAt ||
    new Date().toISOString();

  const savedTime = new Date(savedIso).getTime();
  const diffDays = Math.max(0, Math.floor((now - savedTime) / (1000 * 60 * 60 * 24)));

  let agingStatus: "RECENT" | "ACTION_RECOMMENDED" | "CRITICAL" = "RECENT";
  let agingBadgeText = `Saved ${diffDays === 0 ? "today" : `${diffDays}d ago`}`;

  if (diffDays > 5) {
    agingStatus = "CRITICAL";
    agingBadgeText = `Saved ${diffDays}d ago — Aging in pipeline!`;
  } else if (diffDays > 2) {
    agingStatus = "ACTION_RECOMMENDED";
    agingBadgeText = `Saved ${diffDays}d ago — Action recommended`;
  }

  const rec = job.applicationRecommendation || job.match?.applicationRecommendation || "WATCH";
  const careerFit = job.careerFit || job.match?.careerFit || "POSSIBLE";
  const potentialGaps = job.match?.potentialGaps || [];

  return {
    job,
    application,
    savedDate: savedIso,
    daysSinceSaved: diffDays,
    agingStatus,
    isActionRecommended: agingStatus === "ACTION_RECOMMENDED" || agingStatus === "CRITICAL",
    isAgingAlert: agingStatus === "CRITICAL",
    agingBadgeText,
    recommendation: rec,
    careerFit,
    potentialGaps,
  };
}

export const getSavedJobAgingInfo = calculateSavedJobAging;

