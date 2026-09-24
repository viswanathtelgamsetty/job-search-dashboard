import type { Job, JobSourceReference } from "@/types";

export function normalizeCompanyName(name: string): string {
  if (!name) return "";
  return name
    .toLowerCase()
    .replace(/\b(inc|incorporated|llc|ltd|limited|pvt|private|corp|corporation|technologies|solutions|group|services|systems|software|holdings)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function normalizeJobTitle(title: string): string {
  if (!title) return "";
  return title
    .toLowerCase()
    .replace(/\[.*?\]|\(.*?\)/g, "") // remove parentheticals like "(Remote)", "[Frontend]"
    .replace(/\b(urgent|immediate|opening|hiring|needed|req|role|position|full\s*time|contract)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
}

export function generateJobFingerprint(
  company: string,
  title: string,
  location?: string
): string {
  const normComp = normalizeCompanyName(company);
  const normTitle = normalizeJobTitle(title);
  const normLoc = (location || "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10);
  return `${normComp}:::${normTitle}:::${normLoc}`;
}

export function deduplicateJobs(jobs: Job[]): Job[] {
  const map = new Map<string, Job>();

  for (const job of jobs) {
    const fingerprint = generateJobFingerprint(
      job.company,
      job.title,
      job.remoteType === "REMOTE" ? "remote" : job.location
    );

    const existing = map.get(fingerprint);

    if (!existing) {
      // First time seeing this job
      const initialSources: JobSourceReference[] = job.otherSources || [];
      // Ensure primary source is recorded in sources list
      if (!initialSources.some((s) => s.url === job.url || s.source === job.source)) {
        initialSources.push({
          source: job.source,
          url: job.url,
          discoveredAt: job.discoveredAt,
        });
      }

      map.set(fingerprint, {
        ...job,
        otherSources: initialSources,
      });
    } else {
      // Duplicate detected! Merge secondary sources into existing record
      const combinedSources: JobSourceReference[] = [...(existing.otherSources || [])];

      // Add current job as a secondary source if not already present
      if (!combinedSources.some((s) => s.url === job.url || s.source === job.source)) {
        combinedSources.push({
          source: job.source,
          url: job.url,
          discoveredAt: job.discoveredAt,
        });
      }

      // If existing had no salary disclosed but the duplicate does, enrich it!
      const salaryDisclosed = existing.salaryDisclosed || job.salaryDisclosed;
      const salaryLpaMin = existing.salaryLpaMin || job.salaryLpaMin;
      const salaryLpaMax = existing.salaryLpaMax || job.salaryLpaMax;

      // Retain the higher match score and richer description
      const betterMatch =
        (job.match?.overallScore || 0) > (existing.match?.overallScore || 0)
          ? job.match
          : existing.match;

      map.set(fingerprint, {
        ...existing,
        salaryDisclosed,
        salaryLpaMin,
        salaryLpaMax,
        match: betterMatch,
        otherSources: combinedSources,
        skills: Array.from(new Set([...existing.skills, ...job.skills])),
      });
    }
  }

  return Array.from(map.values());
}
