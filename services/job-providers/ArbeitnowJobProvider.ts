import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";
import { extractTravelDetails } from "@/lib/travelExtractor";

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
        const travel = extractTravelDetails(
          `${item.title} ${item.location} ${item.description || ""}`
        );

        return {
          externalId: `arbeitnow-${item.slug}`,
          title: item.title,
          company: item.company_name,
          location: item.location || (item.remote ? "Remote (EU / Global)" : "Europe / Remote"),
          remoteType: item.remote ? "REMOTE" : "HYBRID",
          salaryText: undefined,
          currency: "EUR",
          skills: item.tags || ["TypeScript", "Frontend"],
          roleFamily: item.title.includes("Architect")
            ? "Frontend Architect"
            : item.title.includes("Lead")
            ? "Senior Technical Lead"
            : "Solutions Engineer",
          travelType: travel.type,
          travelPercentage: travel.percentage,
          travelDestinations: travel.destinations,
          travelNotes: travel.notes,
          description: item.description?.replace(/<[^>]*>/g, "").slice(0, 500),
          source: "Arbeitnow",
          url: item.url,
          postedAt: new Date(item.created_at * 1000).toISOString(),
          discoveredAt: new Date().toISOString(),
          isDemo: false,
        };
      });
    } catch (err) {
      console.error("Failed to query Arbeitnow job provider:", err);
      return [];
    }
  }
}
