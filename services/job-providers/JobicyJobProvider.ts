import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";
import { extractTravelDetails } from "@/lib/travelExtractor";

interface JobicyItem {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  jobIndustry: string[];
  jobType: string[];
  jobGeo: string;
  jobLevel: string;
  jobExcerpt: string;
  jobDescription: string;
  pubDate: string;
  annualSalaryMin?: string;
  annualSalaryMax?: string;
  salaryCurrency?: string;
}

interface JobicyResponse {
  jobs: JobicyItem[];
}

export class JobicyJobProvider implements JobProvider {
  readonly id = "jobicy";
  readonly name = "Jobicy Remote API";
  readonly isConfigured = true;

  async searchJobs(_criteria: SearchCriteria): Promise<DiscoveredJobRaw[]> {
    void _criteria;
    try {
      const response = await fetch(
        "https://jobicy.com/api/v2/remote-jobs?count=40&industry=engineering",
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "JobMarketRadar/1.0",
          },
          next: { revalidate: 3600 },
        }
      );

      if (!response.ok) {
        console.warn(`Jobicy API returned HTTP ${response.status}`);
        return [];
      }

      const data: JobicyResponse = await response.json();
      if (!data || !Array.isArray(data.jobs)) {
        return [];
      }

      const relevantKeywords = [
        "lead",
        "architect",
        "principal",
        "frontend",
        "react",
        "angular",
        "solutions",
        "consultant",
        "staff",
        "typescript",
        "next.js",
        "manager",
        "director",
        "senior",
      ];

      const matchedJobs = data.jobs.filter((item) => {
        const text = `${item.jobTitle} ${item.jobExcerpt || ""}`.toLowerCase();
        return relevantKeywords.some((kw) => text.includes(kw));
      });

      return matchedJobs.slice(0, 15).map((item) => {
        const travel = extractTravelDetails(
          `${item.jobTitle} ${item.jobGeo} ${item.jobDescription || ""}`
        );

        let roleFamily = "Senior Technical Lead";
        if (/architect/i.test(item.jobTitle)) {
          roleFamily = "Frontend Architect";
        } else if (/solutions/i.test(item.jobTitle)) {
          roleFamily = "Solutions Architect";
        } else if (/consultant/i.test(item.jobTitle)) {
          roleFamily = "Technical Consultant";
        }

        const isAnywhere =
          /anywhere|worldwide|global/i.test(item.jobGeo || "") ||
          /india/i.test(item.jobGeo || "");

        const location = isAnywhere
          ? "Worldwide Remote (India eligible)"
          : item.jobGeo || "Remote";

        const salaryMin = item.annualSalaryMin
          ? parseInt(item.annualSalaryMin, 10)
          : undefined;
        const salaryMax = item.annualSalaryMax
          ? parseInt(item.annualSalaryMax, 10)
          : undefined;

        return {
          externalId: `jobicy-${item.id}`,
          title: item.jobTitle,
          company: item.companyName,
          location,
          remoteType: "REMOTE",
          salaryMin,
          salaryMax,
          currency: item.salaryCurrency || "USD",
          skills: ["React", "TypeScript", "Frontend Architecture"],
          roleFamily,
          travelType: travel.type,
          travelPercentage: travel.percentage,
          travelDestinations: travel.destinations,
          travelNotes: travel.notes,
          description: item.jobExcerpt || item.jobDescription?.slice(0, 500),
          source: "Jobicy",
          url: item.url,
          postedAt: item.pubDate,
          discoveredAt: new Date().toISOString(),
          isDemo: false,
        };
      });
    } catch (err) {
      console.error("Failed to query Jobicy job provider:", err);
      return [];
    }
  }
}
