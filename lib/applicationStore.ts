import type { Application, ApplicationFunnelMetrics, ApplicationStatus, Job } from "@/types";

export const APPLICATIONS_STORAGE_KEY = "job-market-radar:applications:v1";

// In-memory fallback for SSR and unit testing environments
let inMemoryApplications: Application[] = [];

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function notifyApplicationsChanged() {
  if (isBrowser()) {
    try {
      window.dispatchEvent(new CustomEvent("job-market-radar:applications-updated"));
    } catch {
      // Ignore if event dispatch fails in restricted environments
    }
  }
}

/**
 * Retrieve all applications.
 */
export function getApplications(): Application[] {
  if (!isBrowser()) {
    return [...inMemoryApplications];
  }

  try {
    const raw = localStorage.getItem(APPLICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Persist applications list to storage.
 */
export function saveApplications(applications: Application[]): void {
  if (!isBrowser()) {
    inMemoryApplications = [...applications];
    return;
  }

  try {
    localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(applications));
    notifyApplicationsChanged();
  } catch (err) {
    console.error("Failed to save applications to localStorage:", err);
  }
}

/**
 * Retrieve application by its unique ID.
 */
export function getApplicationById(id: string): Application | undefined {
  const apps = getApplications();
  return apps.find((a) => a.id === id);
}

/**
 * Retrieve application associated with a canonical Job ID.
 * Guarantees duplicate protection lookup.
 */
export function getApplicationForJob(jobId: string): Application | undefined {
  const apps = getApplications();
  return apps.find((a) => a.jobId === jobId);
}

/**
 * Create a new application linked to a Job.
 * If an application already exists for the jobId, returns the existing record (duplicate protection).
 */
export function createApplication(
  input: Partial<Application> & { jobId: string }
): Application {
  const existing = getApplicationForJob(input.jobId);
  if (existing) {
    return existing;
  }

  const now = new Date().toISOString();
  const status: ApplicationStatus = input.status || "SAVED";

  const newApp: Application = {
    id: input.id || `app-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    jobId: input.jobId,
    status,
    createdAt: input.createdAt || now,
    updatedAt: now,
    savedAt: input.savedAt || (status === "SAVED" || status === "APPLIED" ? now : undefined),
    appliedAt: input.appliedAt || (status === "APPLIED" ? now : undefined),
    lastActivityAt: input.lastActivityAt || now,
    nextFollowUpAt: input.nextFollowUpAt,
    resumeVersion: input.resumeVersion,
    coverLetterUsed: input.coverLetterUsed,
    referral: input.referral || false,
    referralName: input.referralName,
    recruiterName: input.recruiterName,
    recruiterEmail: input.recruiterEmail,
    recruiterLinkedIn: input.recruiterLinkedIn,
    salaryOffered: input.salaryOffered,
    salaryExpected: input.salaryExpected,
    salaryCurrency: input.salaryCurrency || "INR",
    noticePeriodDiscussed: input.noticePeriodDiscussed,
    interviewDates: input.interviewDates || [],
    notes: input.notes,
    rejectionReason: input.rejectionReason,
    withdrawalReason: input.withdrawalReason,
    source: input.source,
    applicationUrl: input.applicationUrl,
  };

  const allApps = getApplications();
  allApps.unshift(newApp);
  saveApplications(allApps);

  return newApp;
}

/**
 * Save a job into the Application Pipeline.
 * If no Application exists: creates Application with status = SAVED.
 * If Application already exists: returns existing without duplicating.
 */
export function saveJobAsApplication(job: Job): Application {
  const existing = getApplicationForJob(job.id);
  if (existing) {
    return existing;
  }

  const app = createApplication({
    jobId: job.id,
    status: "SAVED",
    source: job.source,
    applicationUrl: job.url,
  });

  return app;
}

/**
 * Apply to a job.
 * If Application exists: transitions to APPLIED and updates appliedAt.
 * If no Application exists: creates Application with status = APPLIED.
 */
export function applyToJobAsApplication(job: Job): Application {
  const existing = getApplicationForJob(job.id);
  const now = new Date().toISOString();

  if (existing) {
    const updated = updateApplication(existing.id, {
      status: "APPLIED",
      appliedAt: existing.appliedAt || now,
      lastActivityAt: now,
    });

    return updated || existing;
  }

  const app = createApplication({
    jobId: job.id,
    status: "APPLIED",
    appliedAt: now,
    savedAt: now,
    lastActivityAt: now,
    source: job.source,
    applicationUrl: job.url,
  });

  return app;
}

/**
 * Update an existing application's details.
 */
export function updateApplication(
  id: string,
  updates: Partial<Application>
): Application | undefined {
  const allApps = getApplications();
  const index = allApps.findIndex((a) => a.id === id);
  if (index === -1) return undefined;

  const current = allApps[index];
  const now = new Date().toISOString();

  const updated: Application = {
    ...current,
    ...updates,
    id: current.id, // Immutable
    jobId: current.jobId, // Immutable
    createdAt: current.createdAt, // Immutable
    updatedAt: now,
    lastActivityAt: updates.lastActivityAt || now,
  };

  allApps[index] = updated;
  saveApplications(allApps);

  return updated;
}

/**
 * Delete an application by ID.
 */
export function deleteApplication(id: string): boolean {
  const allApps = getApplications();
  const filtered = allApps.filter((a) => a.id !== id);
  if (filtered.length === allApps.length) return false;

  saveApplications(filtered);
  return true;
}

/**
 * Deterministic status transitions.
 *
 * Rules:
 * SAVED → APPLIED
 * APPLIED → SCREENING | REJECTED
 * SCREENING → TECHNICAL | REJECTED
 * TECHNICAL → FINAL | REJECTED
 * FINAL → OFFER | REJECTED
 * Any active state → WITHDRAWN | IGNORED
 * Terminal/alternate states (REJECTED, IGNORED, WITHDRAWN) can be reopened.
 * Also supports direct movement between active stages per requirements.
 */
export function updateApplicationStatus(
  id: string,
  newStatus: ApplicationStatus,
  options?: {
    rejectionReason?: string;
    withdrawalReason?: string;
  }
): { success: boolean; application?: Application; error?: string } {
  const app = getApplicationById(id);
  if (!app) {
    return { success: false, error: "Application not found" };
  }

  const now = new Date().toISOString();
  const updates: Partial<Application> = {
    status: newStatus,
    updatedAt: now,
    lastActivityAt: now,
  };

  // Stage-specific timestamp updates
  if (newStatus === "APPLIED" && !app.appliedAt) {
    updates.appliedAt = now;
  }

  if (newStatus === "SAVED" && !app.savedAt) {
    updates.savedAt = now;
  }

  if (newStatus === "REJECTED") {
    if (options?.rejectionReason) {
      updates.rejectionReason = options.rejectionReason;
    }
  } else if (newStatus === "WITHDRAWN") {
    if (options?.withdrawalReason) {
      updates.withdrawalReason = options.withdrawalReason;
    }
  }

  const updated = updateApplication(id, updates);
  if (!updated) {
    return { success: false, error: "Failed to update application" };
  }

  return { success: true, application: updated };
}

/**
 * Mark a follow-up as done:
 * Updates lastActivityAt and clears nextFollowUpAt.
 */
export function markFollowUpDone(id: string): Application | undefined {
  const now = new Date().toISOString();
  return updateApplication(id, {
    nextFollowUpAt: undefined,
    lastActivityAt: now,
  });
}

/**
 * Check if a follow-up is due for an application.
 * A follow-up is due when:
 * nextFollowUpAt <= now
 * and status is NOT one of: OFFER, REJECTED, WITHDRAWN, IGNORED.
 */
export function isFollowUpDue(app: Application, nowIso?: string): boolean {
  if (!app.nextFollowUpAt) return false;

  const terminalStatuses: ApplicationStatus[] = ["OFFER", "REJECTED", "WITHDRAWN", "IGNORED"];
  if (terminalStatuses.includes(app.status)) {
    return false;
  }

  const checkTime = nowIso ? new Date(nowIso).getTime() : Date.now();
  const dueTime = new Date(app.nextFollowUpAt).getTime();

  return !isNaN(dueTime) && dueTime <= checkTime;
}

/**
 * Calculate funnel metrics across applications:
 * Counts: Saved, Applied, Screening, Technical, Final, Offers, Rejected, Withdrawn, Ignored, Follow-ups Due
 * Conversions:
 * Applied → Screening
 * Screening → Technical
 * Technical → Final
 * Final → Offer
 */
export function calculateApplicationFunnelMetrics(
  applications: Application[],
  nowIso?: string
): ApplicationFunnelMetrics {
  const counts: Record<ApplicationStatus, number> = {
    DISCOVERED: 0,
    SAVED: 0,
    APPLIED: 0,
    SCREENING: 0,
    TECHNICAL: 0,
    FINAL: 0,
    OFFER: 0,
    REJECTED: 0,
    IGNORED: 0,
    WITHDRAWN: 0,
  };

  let followUpsDue = 0;

  applications.forEach((app) => {
    if (counts[app.status] !== undefined) {
      counts[app.status] += 1;
    }
    if (isFollowUpDue(app, nowIso)) {
      followUpsDue += 1;
    }
  });

  // Funnel stage reach calculation:
  // An application reached or passed a stage if it has reached that stage or beyond.
  const activePipelineStages: ApplicationStatus[] = [
    "APPLIED",
    "SCREENING",
    "TECHNICAL",
    "FINAL",
    "OFFER",
  ];

  const totalAppliedReach = applications.filter(
    (a) => a.appliedAt !== undefined || activePipelineStages.includes(a.status)
  ).length;

  const totalScreeningReach = applications.filter((a) =>
    ["SCREENING", "TECHNICAL", "FINAL", "OFFER"].includes(a.status)
  ).length;

  const totalTechnicalReach = applications.filter((a) =>
    ["TECHNICAL", "FINAL", "OFFER"].includes(a.status)
  ).length;

  const totalFinalReach = applications.filter((a) =>
    ["FINAL", "OFFER"].includes(a.status)
  ).length;

  const totalOffers = counts.OFFER;

  const appliedToScreeningConversion =
    totalAppliedReach > 0
      ? Math.round((totalScreeningReach / totalAppliedReach) * 100)
      : null;

  const screeningToTechnicalConversion =
    totalScreeningReach > 0
      ? Math.round((totalTechnicalReach / totalScreeningReach) * 100)
      : null;

  const technicalToFinalConversion =
    totalTechnicalReach > 0
      ? Math.round((totalFinalReach / totalTechnicalReach) * 100)
      : null;

  const finalToOfferConversion =
    totalFinalReach > 0
      ? Math.round((totalOffers / totalFinalReach) * 100)
      : null;

  return {
    totalApplications: applications.length,
    saved: counts.SAVED,
    applied: counts.APPLIED,
    screening: counts.SCREENING,
    technical: counts.TECHNICAL,
    final: counts.FINAL,
    offers: counts.OFFER,
    rejected: counts.REJECTED,
    withdrawn: counts.WITHDRAWN,
    ignored: counts.IGNORED,
    followUpsDue,
    appliedToScreeningConversion,
    screeningToTechnicalConversion,
    technicalToFinalConversion,
    finalToOfferConversion,
  };
}

/**
 * Testing helpers
 */
export function _clearApplicationsForTest(): void {
  inMemoryApplications = [];
  if (isBrowser()) {
    try {
      localStorage.removeItem(APPLICATIONS_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
}

export function _seedApplicationsForTest(apps: Application[]): void {
  inMemoryApplications = [...apps];
  if (isBrowser()) {
    try {
      localStorage.setItem(APPLICATIONS_STORAGE_KEY, JSON.stringify(apps));
    } catch {
      // Ignore
    }
  }
}
