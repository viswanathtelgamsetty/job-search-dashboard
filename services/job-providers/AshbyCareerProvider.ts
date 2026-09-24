import type { DiscoveredJobRaw, JobProvider } from "./types";
import { extractTravelDetails } from "../../lib/travelExtractor.ts";
import { extractActualJobTechnologies } from "../../lib/technologyMatcher.ts";

export interface AshbyBoardConfig {
  token: string;
  name: string;
  category: "cms_commerce" | "enterprise_saas" | "developer_tools";
}

interface AshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  secondaryLocations?: string[];
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  jobUrl?: string;
  applyUrl?: string;
  descriptionHtml?: string;
  descriptionPlain?: string;
}

export class AshbyCareerProvider implements JobProvider {
  readonly id = "ashby";
  readonly name = "Company Career Boards (Ashby)";
  readonly isConfigured = true;

  private boards: AshbyBoardConfig[] = [
    { token: "sanity", name: "Sanity.io", category: "cms_commerce" },
    { token: "sentry", name: "Sentry", category: "developer_tools" },
    { token: "linear", name: "Linear", category: "developer_tools" },
    { token: "supabase", name: "Supabase", category: "developer_tools" },
    { token: "ramp", name: "Ramp", category: "enterprise_saas" },
    { token: "deepl", name: "DeepL", category: "enterprise_saas" },
    { token: "synthesia", name: "Synthesia", category: "enterprise_saas" },
    { token: "airbyte", name: "Airbyte", category: "developer_tools" },
    { token: "modal", name: "Modal", category: "developer_tools" },
    { token: "cohere", name: "Cohere", category: "enterprise_saas" },
    { token: "resend", name: "Resend", category: "developer_tools" },
  ];

  getBoardsQueried(): string[] {
    return this.boards.map((b) => b.token);
  }

  async searchJobs(): Promise<DiscoveredJobRaw[]> {
    const results: DiscoveredJobRaw[] = [];

    for (const board of this.boards) {
      try {
        const url = `https://api.ashbyhq.com/posting-api/job-board/${board.token}`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        });

        if (!res.ok) {
          console.warn(`Ashby board ${board.token} returned HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        if (!data || !Array.isArray(data.jobs)) continue;

        const targetKeywords = [
          "architect",
          "lead",
          "principal",
          "consultant",
          "solutions",
          "frontend",
          "experience",
          "react",
          "partner",
          "staff",
          "director",
          "advisor",
          "engineer",
          "developer",
        ];

        // Filter relevant engineering / architecture / solutions roles
        const matched = (data.jobs as AshbyJob[]).filter((j) => {
          const t = (j.title || "").toLowerCase();
          const loc = (j.location || "").toLowerCase();
          const hasKeyword = targetKeywords.some((kw) => t.includes(kw));
          const isIndiaOrHyd = /india|hyderabad|bengaluru|bangalore|pune|mumbai|chennai|delhi|gurgaon|noida/i.test(loc);

          if (isIndiaOrHyd && hasKeyword) return true;
          if (hasKeyword && (j.isRemote || loc.includes("remote") || loc.includes("worldwide") || loc.includes("anywhere") || !loc)) return true;
          if (hasKeyword && /europe|uk|london|germany|netherlands|dublin|ireland|emea/i.test(loc)) return true;
          return false;
        });

        for (const job of matched.slice(0, 15)) {
          const locationName = job.location || (job.isRemote ? "Remote / Global" : "Unspecified Location");
          const isRemote = job.isRemote || /remote/i.test(locationName) || /anywhere/i.test(locationName);

          const cleanDesc = (job.descriptionPlain || job.descriptionHtml || "")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          const fullJobText = `${job.title} ${locationName} ${cleanDesc}`;
          const travel = extractTravelDetails(fullJobText);
          const actualSkills = extractActualJobTechnologies([], fullJobText);

          let roleFamily = "Senior Technical Lead";
          if (/frontend\s+architect|ui\s+architect/i.test(job.title)) {
            roleFamily = "Frontend Architect";
          } else if (/solutions?\s+architect/i.test(job.title)) {
            roleFamily = "Solutions Architect";
          } else if (/technical\s+architect|software\s+architect|system\s+architect/i.test(job.title)) {
            roleFamily = "Technical Architect";
          } else if (/consultant|advisor|partner/i.test(job.title)) {
            roleFamily = "Technical Consultant";
          } else if (/frontend|ui|web/i.test(job.title)) {
            roleFamily = "Frontend Architect";
          }

          results.push({
            externalId: `ashby-${board.token}-${job.id}`,
            title: job.title,
            company: board.name,
            location: locationName,
            remoteType: isRemote ? "REMOTE" : "HYBRID",
            skills: actualSkills,
            roleFamily,
            travelType: travel.type,
            travelPercentage: travel.percentage,
            travelDestinations: travel.destinations,
            travelNotes: travel.notes,
            description: cleanDesc || `${job.title} opportunity discovered on ${board.name} Careers board (${locationName}).`,
            source: `${board.name} Careers`,
            url: job.jobUrl || job.applyUrl || `https://jobs.ashbyhq.com/${board.token}/${job.id}`,
            postedAt: job.publishedAt,
            discoveredAt: new Date().toISOString(),
            isDemo: false,
            sourceTitle: job.title,
            sourceLocation: locationName,
            sourceDescription: cleanDesc,
            sourceSkills: actualSkills,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch Ashby board for ${board.token}:`, err);
      }
    }

    return results;
  }
}
