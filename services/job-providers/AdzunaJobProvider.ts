import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";
import { extractTravelDetails } from "@/lib/travelExtractor";

interface AdzunaJobItem {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  company: { display_name: string };
  location: { display_name: string };
  salary_min?: number;
  salary_max?: number;
  created: string;
}

interface AdzunaResponse {
  results: AdzunaJobItem[];
}

export class AdzunaJobProvider implements JobProvider {
  readonly id = "adzuna";
  readonly name = "Adzuna Search API";

  get isConfigured(): boolean {
    return Boolean(process.env.ADZUNA_APP_ID && process.env.ADZUNA_APP_KEY);
  }

  async searchJobs(_criteria: SearchCriteria): Promise<DiscoveredJobRaw[]> {
    void _criteria;
    if (!this.isConfigured) {
      return [];
    }

    const appId = process.env.ADZUNA_APP_ID;
    const appKey = process.env.ADZUNA_APP_KEY;
    const country = process.env.ADZUNA_COUNTRY || "in"; // default to India

    try {
      const query = encodeURIComponent("Technical Lead OR Frontend Architect OR Solutions Architect");
      const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?app_id=${appId}&app_key=${appKey}&what=${query}&content-type=application/json`;

      const response = await fetch(url, {
        headers: { Accept: "application/json" },
        next: { revalidate: 3600 },
      });

      if (!response.ok) {
        console.warn(`Adzuna API returned HTTP ${response.status}`);
        return [];
      }

      const data: AdzunaResponse = await response.json();
      if (!data || !Array.isArray(data.results)) {
        return [];
      }

      return data.results.map((item) => {
        const travel = extractTravelDetails(`${item.title} ${item.description || ""}`);

        return {
          externalId: `adzuna-${item.id}`,
          title: item.title.replace(/<\/?[^>]+(>|$)/g, ""),
          company: item.company?.display_name || "Enterprise Employer",
          location: item.location?.display_name || "India",
          remoteType: /remote/i.test(item.description) ? "REMOTE" : "HYBRID",
          salaryMin: item.salary_min,
          salaryMax: item.salary_max,
          currency: country === "in" ? "INR" : "USD",
          skills: ["React", "TypeScript", "Frontend Architecture"],
          roleFamily: "Senior Technical Lead",
          travelType: travel.type,
          travelPercentage: travel.percentage,
          travelDestinations: travel.destinations,
          travelNotes: travel.notes,
          description: item.description?.replace(/<\/?[^>]+(>|$)/g, "").slice(0, 500),
          source: "Adzuna",
          url: item.redirect_url,
          postedAt: item.created,
          discoveredAt: new Date().toISOString(),
          isDemo: false,
        };
      });
    } catch (err) {
      console.error("Failed to query Adzuna job provider:", err);
      return [];
    }
  }
}
