import type { FreshnessStatus, Job } from "@/types";

export interface FreshnessResult {
  freshness: FreshnessStatus;
  label: string;
  daysAgo?: number;
}

export function calculateJobFreshness(
  postedAt?: string,
  discoveredAt?: string
): FreshnessResult {
  const dateToUse = postedAt || discoveredAt;
  if (!dateToUse) {
    return {
      freshness: "UNKNOWN",
      label: "Posting date unknown",
    };
  }

  const timestamp = new Date(dateToUse).getTime();
  if (isNaN(timestamp)) {
    return {
      freshness: "UNKNOWN",
      label: "Invalid date format",
    };
  }

  const now = Date.now();
  const diffMs = Math.max(0, now - timestamp);
  const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hoursAgo = Math.floor(diffMs / (1000 * 60 * 60));

  let label: string;
  if (postedAt) {
    if (daysAgo === 0) {
      label = hoursAgo <= 1 ? "Posted just now" : `Posted ${hoursAgo}h ago`;
    } else if (daysAgo === 1) {
      label = "Posted 1 day ago";
    } else {
      label = `Posted ${daysAgo} days ago`;
    }
  } else {
    label = daysAgo === 0 ? "Discovered today" : `Discovered ${daysAgo}d ago`;
  }

  if (daysAgo <= 3) {
    return { freshness: "FRESH", label, daysAgo };
  }
  if (daysAgo <= 14) {
    return { freshness: "RECENT", label, daysAgo };
  }
  return { freshness: "OLDER", label, daysAgo };
}

export function detectDataQualityWarnings(job: Partial<Job>): string[] {
  const warnings: string[] = [];

  // 1. Missing Company
  if (!job.company || job.company.trim().length === 0 || job.company.toLowerCase() === "unknown") {
    warnings.push("Missing company name");
  }

  // 2. Missing Location
  if (!job.location || job.location.trim().length === 0) {
    warnings.push("Missing location specification");
  }

  // 3. Missing URL / Invalid URL
  if (!job.url || job.url === "#" || !job.url.startsWith("http")) {
    warnings.push("Missing or invalid job application URL");
  }

  // 4. Suspicious Salary
  if (job.salaryDisclosed && job.salaryLpaMin !== undefined) {
    if (job.salaryLpaMin < 2) {
      warnings.push(`Suspiciously low salary disclosed (₹${job.salaryLpaMin} LPA)`);
    } else if (job.salaryLpaMin > 400 && job.currency === "INR") {
      warnings.push(`Suspiciously high base salary disclosed (₹${job.salaryLpaMin} LPA)`);
    }
  }

  // 5. Invalid Dates
  if (job.postedAt && isNaN(new Date(job.postedAt).getTime())) {
    warnings.push("Invalid posted date format");
  }

  // 6. Unknown Source
  if (!job.source || job.source.trim().length === 0) {
    warnings.push("Unknown job provider source");
  }

  return warnings;
}
