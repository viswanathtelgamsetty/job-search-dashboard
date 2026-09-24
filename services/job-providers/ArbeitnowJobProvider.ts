import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";
import { extractTravelDetails } from "@/lib/travelExtractor";
import { extractActualJobTechnologies } from "@/lib/technologyMatcher";

interface ArbeitnowItem {
  slug: string;
  company_name: string;
  title: string;
  description: string;
  remote: boolean;
  url: string;
  tags: string[];
  job_types: string[];
  location: string;
  created_at: number;
}

interface ArbeitnowResponse {
  data: ArbeitnowItem[];
  links?: Record<string, string>;
  meta?: Record<string, unknown>;
}

export class ArbeitnowJobProvider implements JobProvider {
  readonly id = "arbeitnow";
  readonly name = "Arbeitnow Public API";
  readonly isConfigured = true;

  async searchJobs(_criteria: SearchCriteria): Promise<DiscoveredJobRaw[]> {
    void _criteria;
    try {
      const response = await fetch("https://www.arbeitnow.com/api/job-board-api", {
        headers: {
          Accept: "application/json",
          "User-Agent": "JobMarketRadar/1.0",
        },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.warn(`Arbeitnow API returned HTTP ${response.status}`);
        return [];
      }

      const payload: ArbeitnowResponse = await response.json();
      if (!payload || !Array.isArray(payload.data)) {
        return [];
      }

      const relevantKeywords = [
        "lead",
        "architect",
        "principal",
        "consultant",
        "solutions",
        "frontend",
        "react",
        "angular",
        "cms",
        "next.js",
        "typescript",
      ];

      const filtered = payload.data.filter((item) => {
        const text = `${item.title} ${item.tags.join(" ")}`.toLowerCase();
        return relevantKeywords.some((kw) => text.includes(kw));
      });

      return filtered.slice(0, 15).map((item) => {
        const cleanDesc = item.description?.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() || "";
        const location = item.location || (item.remote ? "Remote (EU / Global)" : "Europe / Remote");
        const fullText = `${item.title} ${location} ${cleanDesc}`;
        const travel = extractTravelDetails(fullText);
        const actualSkills = extractActualJobTechnologies(item.tags || [], fullText);

        return {
          externalId: `arbeitnow-${item.slug}`,
          title: item.title,
          company: item.company_name,
          location,
          remoteType: item.remote ? "REMOTE" : "HYBRID",
          salaryText: undefined,
          currency: "EUR",
          skills: actualSkills,
          roleFamily: item.title.includes("Architect")
            ? "Frontend Architect"
            : item.title.includes("Lead")
            ? "Senior Technical Lead"
            : "Solutions Engineer",
          travelType: travel.type,
          travelPercentage: travel.percentage,
          travelDestinations: travel.destinations,
          travelNotes: travel.notes,
          description: cleanDesc,
          source: "Arbeitnow",
          url: item.url,
          postedAt: new Date(item.created_at * 1000).toISOString(),
          discoveredAt: new Date().toISOString(),
          isDemo: false,
          sourceTitle: item.title,
          sourceLocation: location,
          sourceDescription: cleanDesc,
          sourceSkills: actualSkills,
        };
      });
    } catch (err) {
      console.error("Failed to query Arbeitnow job provider:", err);
      return [];
    }
  }
}
