import type { DiscoveredJobRaw, JobProvider, SearchCriteria } from "./types";
import { extractTravelDetails } from "@/lib/travelExtractor";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  location: { name: string };
  updated_at: string;
  metadata?: Array<{ name: string; value: string }>;
}

interface GreenhouseBoardResponse {
  jobs: GreenhouseJob[];
}

export class GreenhouseCareerProvider implements JobProvider {
  readonly id = "greenhouse";
  readonly name = "Company Career Boards (Greenhouse)";
  readonly isConfigured = true;

  // Premier tech employers with official Greenhouse public boards that have major Hyderabad & India hubs
  private readonly defaultBoards = [
    { token: "highradius", name: "HighRadius", industry: "Enterprise SaaS & AI (Hyderabad Hub)" },
    { token: "deliveroo", name: "Deliveroo", industry: "Global Platform Engineering (Hyderabad Hub)" },
    { token: "thoughtworks", name: "Thoughtworks", industry: "Global Technology Consultancy (India)" },
    { token: "elastic", name: "Elastic", industry: "Search & Observability Architecture (India)" },
    { token: "mongodb", name: "MongoDB", industry: "Modern Data Platform & Solutions Architecture" },
    { token: "okta", name: "Okta", industry: "Cloud Security & Identity (India & Remote)" },
    { token: "toast", name: "Toast", industry: "Restaurant Tech & Commerce (India Hub)" },
    { token: "contentful", name: "Contentful", industry: "Headless CMS Platform" },
    { token: "slalom", name: "Slalom Build", industry: "Modern Tech Consulting" },
    { token: "automattic", name: "Automattic", industry: "Digital Publishing & Experience" },
  ];

  getBoardsQueried(): string[] {
    return process.env.GREENHOUSE_BOARD_TOKENS
      ? process.env.GREENHOUSE_BOARD_TOKENS.split(",").map((t) => t.trim())
      : this.defaultBoards.map((b) => b.token);
  }

  async searchJobs(_criteria: SearchCriteria): Promise<DiscoveredJobRaw[]> {
    void _criteria;
    const results: DiscoveredJobRaw[] = [];

    const envTokens = process.env.GREENHOUSE_BOARD_TOKENS
      ? process.env.GREENHOUSE_BOARD_TOKENS.split(",").map((t) => ({
          token: t.trim(),
          name: t.trim().charAt(0).toUpperCase() + t.trim().slice(1),
          industry: "Technology",
        }))
      : this.defaultBoards;

    for (const board of envTokens) {
      try {
        const response = await fetch(
          `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs`,
          {
            headers: { Accept: "application/json" },
            next: { revalidate: 3600 },
          }
        );

        if (!response.ok) {
          continue;
        }

        const data: GreenhouseBoardResponse = await response.json();
        if (!data || !Array.isArray(data.jobs)) {
          continue;
        }

        const targetKeywords = [
          "architect",
          "lead",
          "principal",
          "solutions",
          "frontend",
          "consultant",
          "experience",
          "react",
          "partner",
          "staff",
          "director",
          "advisor",
        ];

        // Match jobs that either:
        // 1. Have target seniority/architect/lead keywords in title
        // 2. Are in Hyderabad or India with tech/software/builder roles
        const matched = data.jobs.filter((j) => {
          const t = j.title.toLowerCase();
          const loc = (j.location?.name || "").toLowerCase();
          const hasKeyword = targetKeywords.some((kw) => t.includes(kw));
          const isIndiaOrHyd = /india|hyderabad|bengaluru|bangalore|pune|mumbai|chennai|delhi|gurgaon|noida/i.test(loc);

          if (isIndiaOrHyd && hasKeyword) return true;
          if (hasKeyword && (loc.includes("remote") || loc.includes("worldwide") || !loc)) return true;
          if (isIndiaOrHyd && /builder|developer|engineer|manager/i.test(t)) return true;
          return false;
        });

        for (const job of matched.slice(0, 15)) {
          const locationName = job.location?.name || "Global / Remote";
          const isRemote =
            /remote/i.test(locationName) || /anywhere/i.test(locationName);
          const travel = extractTravelDetails(`${job.title} ${locationName} ${board.name}`);

          let roleFamily = "Senior Technical Lead";
          if (/architect/i.test(job.title)) {
            roleFamily = "Solutions Architect";
          } else if (/consultant|advisor|partner/i.test(job.title)) {
            roleFamily = "Technical Consultant";
          } else if (/frontend|ui|web/i.test(job.title)) {
            roleFamily = "Frontend Architect";
          }

          results.push({
            externalId: `gh-${board.token}-${job.id}`,
            title: job.title,
            company: board.name,
            location: locationName,
            remoteType: isRemote ? "REMOTE" : "HYBRID",
            skills: [
              "React",
              "TypeScript",
              board.name.includes("Contentful") ? "Contentful" : "Architecture",
              "Enterprise Solutions",
            ],
            roleFamily,
            travelType: travel.type,
            travelPercentage: travel.percentage,
            travelDestinations: travel.destinations,
            travelNotes: travel.notes,
            description: `${job.title} opportunity directly discovered on official ${board.name} Careers board (${locationName}).`,
            source: `${board.name} Careers`,
            url: job.absolute_url,
            postedAt: job.updated_at,
            discoveredAt: new Date().toISOString(),
            isDemo: false,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch Greenhouse board for ${board.token}:`, err);
      }
    }

    return results;
  }
}
