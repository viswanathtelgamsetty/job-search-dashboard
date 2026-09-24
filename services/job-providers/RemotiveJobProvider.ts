import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";
import { extractTravelDetails } from "@/lib/travelExtractor";
import { extractActualJobTechnologies } from "@/lib/technologyMatcher";

interface RemotiveJobItem {
  id: number;
  url: string;
  title: string;
  company_name: string;
  category: string;
  tags: string[];
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
}

interface RemotiveResponse {
  jobs: RemotiveJobItem[];
}

export class RemotiveJobProvider implements JobProvider {
  readonly id = "remotive";
  readonly name = "Remotive Remote API";
  readonly isConfigured = true;

  async searchJobs(_criteria: SearchCriteria): Promise<DiscoveredJobRaw[]> {
    void _criteria;
    try {
      const response = await fetch(
        "https://remotive.com/api/remote-jobs?category=software-dev&limit=60",
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "JobMarketRadar/1.0",
          },
          next: { revalidate: 3600 },
        }
      );

      if (!response.ok) {
        console.warn(`Remotive API returned HTTP ${response.status}`);
        return [];
      }

      const data: RemotiveResponse = await response.json();
      if (!data || !Array.isArray(data.jobs)) {
        return [];
      }

      const relevantKeywords = [
        "lead",
        "architect",
        "principal",
        "staff",
        "frontend",
        "react",
        "typescript",
        "solutions",
        "consultant",
        "angular",
        "head",
      ];

      const matchedJobs = data.jobs.filter((item) => {
        const text = `${item.title} ${item.tags.join(" ")}`.toLowerCase();
        return relevantKeywords.some((kw) => text.includes(kw));
      });

      return matchedJobs.slice(0, 20).map((item) => {
        const cleanDesc = item.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
        const location = item.candidate_required_location || "Worldwide Remote / India eligible";
        const fullText = `${item.title} ${location} ${cleanDesc}`;
        const travel = extractTravelDetails(fullText);
        const actualSkills = extractActualJobTechnologies(item.tags || [], fullText);

        let roleFamily = "Senior Technical Lead";
        if (/frontend\s+architect|ui\s+architect/i.test(item.title)) {
          roleFamily = "Frontend Architect";
        } else if (/solutions?\s+architect/i.test(item.title)) {
          roleFamily = "Solutions Architect";
        } else if (/technical\s+architect/i.test(item.title)) {
          roleFamily = "Technical Architect";
        } else if (/consultant/i.test(item.title)) {
          roleFamily = "Technical Consultant";
        }

        return {
          externalId: `remotive-${item.id}`,
          title: item.title,
          company: item.company_name,
          location,
          remoteType: "REMOTE",
          salaryText: item.salary || undefined,
          skills: actualSkills,
          roleFamily,
          travelType: travel.type,
          travelPercentage: travel.percentage,
          travelDestinations: travel.destinations,
          travelNotes: travel.notes,
          description: cleanDesc,
          source: "Remotive",
          url: item.url,
          postedAt: item.publication_date,
          discoveredAt: new Date().toISOString(),
          isDemo: false,
          sourceTitle: item.title,
          sourceLocation: location,
          sourceDescription: cleanDesc,
          sourceSkills: actualSkills,
        };
      });
    } catch (err) {
      console.error("Failed to query Remotive job provider:", err);
      return [];
    }
  }
}
