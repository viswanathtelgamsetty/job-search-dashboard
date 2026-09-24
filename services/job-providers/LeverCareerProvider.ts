import type { DiscoveredJobRaw, JobProvider } from "./types";
import { extractTravelDetails } from "../../lib/travelExtractor.ts";
import { extractActualJobTechnologies } from "../../lib/technologyMatcher.ts";

export interface LeverBoardConfig {
  token: string;
  name: string;
  category: "india_hub" | "enterprise_saas" | "consulting";
}

interface LeverPosting {
  id: string;
  text: string;
  createdAt?: number;
  categories?: {
    commitment?: string;
    department?: string;
    location?: string;
    team?: string;
    allLocations?: string[];
  };
  description?: string;
  descriptionPlain?: string;
  descriptionBody?: string;
  descriptionBodyPlain?: string;
  additional?: string;
  additionalPlain?: string;
  hostedUrl?: string;
  applyUrl?: string;
  workplaceType?: string;
}

export class LeverCareerProvider implements JobProvider {
  readonly id = "lever";
  readonly name = "Company Career Boards (Lever)";
  readonly isConfigured = true;

  private boards: LeverBoardConfig[] = [
    { token: "palantir", name: "Palantir Technologies", category: "consulting" },
    { token: "spotify", name: "Spotify", category: "enterprise_saas" },
    { token: "coupa", name: "Coupa Software", category: "enterprise_saas" },
    { token: "cred", name: "CRED", category: "india_hub" },
    { token: "meesho", name: "Meesho", category: "india_hub" },
  ];

  getBoardsQueried(): string[] {
    return this.boards.map((b) => b.token);
  }

  async searchJobs(): Promise<DiscoveredJobRaw[]> {
    const results: DiscoveredJobRaw[] = [];

    for (const board of this.boards) {
      try {
        const url = `https://api.lever.co/v0/postings/${board.token}?mode=json`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        });

        if (!res.ok) {
          console.warn(`Lever board ${board.token} returned HTTP ${res.status}`);
          continue;
        }

        const data = await res.json();
        if (!data || !Array.isArray(data)) continue;

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
        const matched = (data as LeverPosting[]).filter((j) => {
          const t = (j.text || "").toLowerCase();
          const loc = (j.categories?.location || "").toLowerCase();
          const allLocs = (j.categories?.allLocations || []).map((l) => l.toLowerCase()).join(" ");
          const combinedLoc = `${loc} ${allLocs}`;

          const hasKeyword = targetKeywords.some((kw) => t.includes(kw));
          const isIndiaOrHyd = /india|hyderabad|bengaluru|bangalore|pune|mumbai|chennai|delhi|gurgaon|noida/i.test(combinedLoc);

          if (isIndiaOrHyd && hasKeyword) return true;
          if (hasKeyword && (j.workplaceType === "remote" || combinedLoc.includes("remote") || combinedLoc.includes("worldwide") || !loc)) return true;
          if (hasKeyword && /europe|uk|london|germany|stockholm|sweden|ireland|dublin|emea/i.test(combinedLoc)) return true;
          return false;
        });

        for (const job of matched.slice(0, 15)) {
          const locationName =
            job.categories?.location ||
            (job.categories?.allLocations && job.categories.allLocations.length > 0
              ? job.categories.allLocations.join(", ")
              : job.workplaceType === "remote"
              ? "Remote / Global"
              : "Unspecified Location");

          const isRemote =
            job.workplaceType === "remote" ||
            /remote/i.test(locationName) ||
            /anywhere/i.test(locationName);

          const descParts = [
            job.descriptionPlain || job.description || "",
            job.additionalPlain || job.additional || "",
          ].filter(Boolean);

          const cleanDesc = descParts
            .join("\n\n")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          const fullJobText = `${job.text} ${locationName} ${cleanDesc}`;
          const travel = extractTravelDetails(fullJobText);
          const actualSkills = extractActualJobTechnologies([], fullJobText);

          let roleFamily = "Senior Technical Lead";
          if (/frontend\s+architect|ui\s+architect/i.test(job.text)) {
            roleFamily = "Frontend Architect";
          } else if (/solutions?\s+architect/i.test(job.text)) {
            roleFamily = "Solutions Architect";
          } else if (/technical\s+architect|software\s+architect|system\s+architect/i.test(job.text)) {
            roleFamily = "Technical Architect";
          } else if (/consultant|advisor|partner/i.test(job.text)) {
            roleFamily = "Technical Consultant";
          } else if (/frontend|ui|web/i.test(job.text)) {
            roleFamily = "Frontend Architect";
          }

          const postedDate = job.createdAt ? new Date(job.createdAt).toISOString() : undefined;

          results.push({
            externalId: `lever-${board.token}-${job.id}`,
            title: job.text,
            company: board.name,
            location: locationName,
            remoteType: isRemote ? "REMOTE" : "HYBRID",
            skills: actualSkills,
            roleFamily,
            travelType: travel.type,
            travelPercentage: travel.percentage,
            travelDestinations: travel.destinations,
            travelNotes: travel.notes,
            description: cleanDesc || `${job.text} opportunity discovered on ${board.name} Careers board (${locationName}).`,
            source: `${board.name} Careers`,
            url: job.hostedUrl || job.applyUrl || `https://jobs.lever.co/${board.token}/${job.id}`,
            postedAt: postedDate,
            discoveredAt: new Date().toISOString(),
            isDemo: false,
            sourceTitle: job.text,
            sourceLocation: locationName,
            sourceDescription: cleanDesc,
            sourceSkills: actualSkills,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch Lever board for ${board.token}:`, err);
      }
    }

    return results;
  }
}
