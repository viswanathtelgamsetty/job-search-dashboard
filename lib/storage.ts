import type {
  DashboardStats,
  Job,
  JobStatus,
  SearchProfile,
  TargetCompany,
} from "@/types";
import { defaultSearchProfile } from "@/config/defaultProfile";
import { defaultTargetCompanies } from "@/config/defaultCompanies";
import { deduplicateJobs } from "./deduplication";

const JOBS_STORAGE_KEY = "job-market-radar:jobs:v1";
const COMPANIES_STORAGE_KEY = "job-market-radar:companies:v1";
const PROFILE_STORAGE_KEY = "job-market-radar:profile:v1";
const LAST_SYNC_KEY = "job-market-radar:last-sync:v1";

// In-memory fallback to survive QuotaExceededError and private browsing contexts.
// Never seeded with demo data — starts empty so the sync flow populates real jobs.
let inMemoryJobs: Job[] | null = null;

/**
 * Strip demo jobs from a collection.
 * Guards against demo records persisted by older versions of the app.
 */
function stripDemoJobs(jobs: Job[]): Job[] {
  return jobs.filter(
    (j) =>
      j.isDemo !== true &&
      !j.id.startsWith("demo-") &&
      !j.company.includes("(Demo)")
  );
}

export function getStoredJobs(): Job[] {
  if (inMemoryJobs && inMemoryJobs.length > 0) {
    return inMemoryJobs;
  }

  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return inMemoryJobs || [];
  }

  try {
    const stored = localStorage.getItem(JOBS_STORAGE_KEY);
    if (!stored) {
      inMemoryJobs = [];
      return [];
    }

    const parsed: Job[] = JSON.parse(stored);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      inMemoryJobs = [];
      return [];
    }
    // Filter out any demo records that may have been persisted by older versions
    const real = stripDemoJobs(parsed);
    inMemoryJobs = real;
    // If stripping removed records, rewrite clean data to storage
    if (real.length !== parsed.length) {
      saveJobs(real);
    }
    return real;
  } catch {
    inMemoryJobs = [];
    return [];
  }
}

export function saveJobs(jobs: Job[]) {
  // Strip demo records before persisting — they must NEVER enter production storage
  const realOnly = stripDemoJobs(jobs);
  const deduped = deduplicateJobs(realOnly);
  inMemoryJobs = deduped;

  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  try {
    localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(deduped));
  } catch {
    // QuotaExceededError happens when storing hundreds of jobs with large raw descriptions
    try {
      // Compact jobs: truncate lengthy descriptions to 300 characters for localStorage caching
      const compacted = deduped.map((j) => ({
        ...j,
        description:
          j.description && j.description.length > 300
            ? j.description.slice(0, 300) + "..."
            : j.description,
      }));
      localStorage.setItem(JOBS_STORAGE_KEY, JSON.stringify(compacted));
    } catch (innerErr: unknown) {
      // If quota is exhausted or storage is disabled, retain state in memory
      console.warn("localStorage quota exceeded. Retaining jobs in memory session cache.", innerErr);
    }
  }
}

export function updateJobStatusInStorage(
  jobId: string,
  status: JobStatus,
  notes?: string
): Job[] {
  const currentJobs = getStoredJobs();
  const now = new Date().toISOString();

  const updated = currentJobs.map((job) => {
    if (job.id !== jobId) return job;

    const isApplying = status === "APPLIED" && !job.appliedAt;
    const isSaving = status === "SAVED" && !job.savedAt;
    const isIgnoring = status === "IGNORED" && !job.ignoredAt;

    return {
      ...job,
      status,
      notes: notes !== undefined ? notes : job.notes,
      appliedAt: isApplying ? now : job.appliedAt,
      savedAt: isSaving ? now : job.savedAt,
      ignoredAt: isIgnoring ? now : (status !== "IGNORED" ? undefined : job.ignoredAt),
      ignoreReason: status !== "IGNORED" ? undefined : job.ignoreReason,
      updatedAt: now,
    };
  });

  saveJobs(updated);
  return updated;
}

export function ignoreJobInStorage(jobId: string, reason: string): Job[] {
  const currentJobs = getStoredJobs();
  const now = new Date().toISOString();

  const updated = currentJobs.map((job) => {
    if (job.id !== jobId) return job;
    return {
      ...job,
      status: "IGNORED" as JobStatus,
      ignoredAt: now,
      ignoreReason: reason,
      updatedAt: now,
    };
  });

  saveJobs(updated);
  return updated;
}

export function updateJobUserNotesInStorage(jobId: string, userNotes: string): Job[] {
  const currentJobs = getStoredJobs();
  const now = new Date().toISOString();

  const updated = currentJobs.map((job) => {
    if (job.id !== jobId) return job;
    return {
      ...job,
      userNotes,
      notes: userNotes,
      updatedAt: now,
    };
  });

  saveJobs(updated);
  return updated;
}

export function getStoredCompanies(): TargetCompany[] {
  if (typeof window === "undefined") {
    return defaultTargetCompanies;
  }

  const stored = localStorage.getItem(COMPANIES_STORAGE_KEY);
  if (!stored) {
    saveCompanies(defaultTargetCompanies);
    return defaultTargetCompanies;
  }

  try {
    const parsed: TargetCompany[] = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultTargetCompanies;
  } catch {
    return defaultTargetCompanies;
  }
}

export function saveCompanies(companies: TargetCompany[]) {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(companies));
    } catch (e) {
      console.warn("Failed to persist companies to localStorage:", e);
    }
  }
}

export function getStoredProfile(): SearchProfile {
  if (typeof window === "undefined") {
    return defaultSearchProfile;
  }

  const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!stored) {
    saveProfile(defaultSearchProfile);
    return defaultSearchProfile;
  }

  try {
    const parsed: SearchProfile = JSON.parse(stored);
    return parsed?.minSalaryLpa ? parsed : defaultSearchProfile;
  } catch {
    return defaultSearchProfile;
  }
}

export function saveProfile(profile: SearchProfile) {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch (e) {
      console.warn("Failed to persist profile to localStorage:", e);
    }
  }
}

export function getLastSyncTime(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LAST_SYNC_KEY);
}

export function setLastSyncTime(timestamp: string) {
  if (typeof window !== "undefined" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LAST_SYNC_KEY, timestamp);
    } catch (e) {
      console.warn("Failed to persist lastSyncTime to localStorage:", e);
    }
  }
}

export function calculateDashboardStats(jobs: Job[]): DashboardStats {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  let discovered = 0;
  let saved = 0;
  let applied = 0;
  let screening = 0;
  let technical = 0;
  let finalStage = 0;
  let offers = 0;
  let rejected = 0;
  let ignored = 0;
  let addedToday = 0;
  let addedThisWeek = 0;
  let internationalTravelCount = 0;
  let highMatchCount = 0;

  for (const job of jobs) {
    switch (job.status) {
      case "DISCOVERED":
        discovered++;
        break;
      case "SAVED":
        saved++;
        break;
      case "APPLIED":
        applied++;
        break;
      case "SCREENING":
        screening++;
        break;
      case "TECHNICAL":
        technical++;
        break;
      case "FINAL":
        finalStage++;
        break;
      case "OFFER":
        offers++;
        break;
      case "REJECTED":
        rejected++;
        break;
      case "IGNORED":
        ignored++;
        break;
    }

    if (job.discoveredAt && job.discoveredAt.startsWith(todayStr)) {
      addedToday++;
    }

    if (job.discoveredAt && new Date(job.discoveredAt) >= sevenDaysAgo) {
      addedThisWeek++;
    }

    if (job.travel.type === "INTERNATIONAL_TRAVEL") {
      internationalTravelCount++;
    }

    if ((job.match?.overallScore ?? 0) >= 75 || job.match?.relevanceBucket === "HIGH_RELEVANCE") {
      highMatchCount++;
    }
  }

  const activeApplications = applied + screening + technical + finalStage + offers;
  const conversionRate =
    activeApplications > 0
      ? Math.round((offers / activeApplications) * 100)
      : 0;

  return {
    discovered,
    saved,
    applied,
    screening,
    technical,
    finalStage,
    offers,
    rejected,
    ignored,
    totalActive: jobs.filter((j) => j.status !== "IGNORED" && j.status !== "REJECTED").length,
    addedToday,
    addedThisWeek,
    internationalTravelCount,
    highMatchCount,
    conversionRate,
  };
}
