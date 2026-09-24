import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";
import { extractTravelDetails } from "../../lib/travelExtractor.ts";
import { extractActualJobTechnologies } from "../../lib/technologyMatcher.ts";

interface HimalayasJob {
  title: string;
  companyName: string;
  applicationLink?: string;
  guid?: string;
  description?: string;
  excerpt?: string;
  pubDate?: number;
  employmentType?: string;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  salaryPeriod?: string;
  locationRestrictions?: string[];
  seniority?: string[];
  categories?: string[];
}

interface HimalayasApiResponse {
  jobs?: HimalayasJob[];
}

export class HimalayasJobProvider implements JobProvider {
  readonly id = "himalayas";
  readonly name = "Himalayas Remote";
  readonly isConfigured = true;

  private apiUrl = "https://himalayas.app/jobs/api?limit=50";

  async searchJobs(_criteria: SearchCriteria): Promise<DiscoveredJobRaw[]> {
    void _criteria;
    try {
      const response = await fetch(this.apiUrl, {
        headers: {
          Accept: "application/json",
          "User-Agent": "JobSearchDashboard/1.0",
        },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.warn(`[HimalayasJobProvider] HTTP ${response.status}: ${response.statusText}`);
        return [];
      }

      const data: HimalayasApiResponse = await response.json();
      const jobs = data.jobs || [];

      const relevantKeywords = [
        "architect",
        "lead",
        "principal",
        "staff",
        "frontend",
        "front-end",
        "react",
        "angular",
        "solutions",
        "consultant",
        "typescript",
        "javascript",
        "next.js",
        "cms",
        "commerce",
        "integration",
        "full stack",
        "fullstack",
        "software engineer",
        "senior",
      ];

      const matchedJobs = jobs.filter((job) => {
        const text = `${job.title} ${job.excerpt || ""}`.toLowerCase();
        return relevantKeywords.some((kw) => text.includes(kw));
      });

      return matchedJobs.map((job) => this.normalizeJob(job));
    } catch (err) {
      console.warn("[HimalayasJobProvider] Fetch error:", (err as Error).message);
      return [];
    }
  }

  private normalizeJob(job: HimalayasJob): DiscoveredJobRaw {
    const locRestrictions =
      Array.isArray(job.locationRestrictions) && job.locationRestrictions.length > 0
        ? job.locationRestrictions.join(", ")
        : "Worldwide Remote";

    const postedAt = job.pubDate
      ? new Date(job.pubDate * 1000).toISOString()
      : new Date().toISOString();

    const url = job.applicationLink || job.guid || "https://himalayas.app";
    const externalId = job.guid || job.applicationLink || `${job.companyName}-${job.title}-${job.pubDate}`;

    const desc = (job.excerpt || job.description || "").replace(/<[^>]*>/g, " ");
    const fullText = `${job.title} ${locRestrictions} ${desc}`;
    const travel = extractTravelDetails(fullText);
    const actualSkills = extractActualJobTechnologies(job.categories || [], fullText);

    let roleFamily = "Senior Technical Lead";
    if (/frontend.*architect|architect.*frontend/i.test(job.title)) {
      roleFamily = "Frontend Architect";
    } else if (/solutions.*architect/i.test(job.title)) {
      roleFamily = "Solutions Architect";
    } else if (/technical.*architect/i.test(job.title)) {
      roleFamily = "Technical Architect";
    } else if (/consultant/i.test(job.title)) {
      roleFamily = "Technical Consultant";
    } else if (/frontend|front-end/i.test(job.title)) {
      roleFamily = "Senior Frontend Engineer";
    }

    // Build a collision-free deterministic ID from the full externalId string.
    // The old approach truncated a base64-encoded URL to 24 chars — since every
    // Himalayas job URL starts with "https://himalayas.", they all produced the
    // identical prefix "aHR0cHM6Ly9oaW1hbGF5YXMu", causing React key collisions.
    // djb2 hash over the full string produces a unique 8-char hex fingerprint per job.
    let h = 5381;
    for (let i = 0; i < externalId.length; i++) {
      h = ((h << 5) + h + externalId.charCodeAt(i)) >>> 0;
    }
    const jobHashId = h.toString(16).padStart(8, "0");

    return {
      externalId: `himalayas-${jobHashId}`,
      title: job.title,
      company: job.companyName || "Unknown",
      location: locRestrictions,
      remoteType: "REMOTE",
      salaryMin: job.minSalary,
      salaryMax: job.maxSalary,
      currency: job.currency || "USD",
      skills: actualSkills,
      roleFamily,
      travelType: travel.type,
      travelPercentage: travel.percentage,
      travelDestinations: travel.destinations,
      travelNotes: travel.notes,
      description: desc,
      source: "Himalayas",
      url,
      postedAt,
      discoveredAt: new Date().toISOString(),
      isDemo: false,
      sourceTitle: job.title,
      sourceLocation: locRestrictions,
      sourceDescription: desc,
      sourceSkills: actualSkills,
    };
  }
}
