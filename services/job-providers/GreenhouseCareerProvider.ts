import type { DiscoveredJobRaw, JobProvider } from "./types";
import { extractTravelDetails } from "../../lib/travelExtractor.ts";
import { extractActualJobTechnologies } from "../../lib/technologyMatcher.ts";

export interface GreenhouseBoardConfig {
  token: string;
  name: string;
  category: "india_hub" | "enterprise_saas" | "cms_commerce" | "consulting";
}

export class GreenhouseCareerProvider implements JobProvider {
  readonly id = "greenhouse";
  readonly name = "Company Career Boards (Greenhouse)";
  readonly isConfigured = true;

  private boards: GreenhouseBoardConfig[] = [
    // India Tech Hub Employers (Hyderabad & Bangalore centres)
    { token: "highradius", name: "HighRadius", category: "india_hub" },
    { token: "deliveroo", name: "Deliveroo", category: "india_hub" },
    { token: "groww", name: "Groww", category: "india_hub" },
    // Global Consulting & Digital Experience
    { token: "thoughtworks", name: "Thoughtworks", category: "consulting" },
    { token: "slalom", name: "Slalom", category: "consulting" },
    { token: "vmlenterprisesolutions", name: "VML Enterprise Solutions", category: "consulting" },
    { token: "valtech", name: "Valtech", category: "consulting" },
    // CMS & Composable Commerce
    { token: "contentful", name: "Contentful", category: "cms_commerce" },
    { token: "contentstack", name: "Contentstack", category: "cms_commerce" },
    { token: "storyblok", name: "Storyblok", category: "cms_commerce" },
    { token: "commercetools", name: "commercetools", category: "cms_commerce" },
    { token: "bloomreach", name: "Bloomreach", category: "cms_commerce" },
    { token: "automattic", name: "Automattic", category: "cms_commerce" },
    // Enterprise SaaS, APIs & Cloud Architecture
    { token: "elastic", name: "Elastic", category: "enterprise_saas" },
    { token: "mongodb", name: "MongoDB", category: "enterprise_saas" },
    { token: "okta", name: "Okta", category: "enterprise_saas" },
    { token: "toast", name: "Toast", category: "enterprise_saas" },
    { token: "workato", name: "Workato", category: "enterprise_saas" },
    { token: "twilio", name: "Twilio", category: "enterprise_saas" },
    { token: "datadog", name: "Datadog", category: "enterprise_saas" },
    { token: "stripe", name: "Stripe", category: "enterprise_saas" },
    { token: "gitlab", name: "GitLab", category: "enterprise_saas" },
    { token: "pagerduty", name: "PagerDuty", category: "enterprise_saas" },
    { token: "intercom", name: "Intercom", category: "enterprise_saas" },
    { token: "gusto", name: "Gusto", category: "enterprise_saas" },
    { token: "tailscale", name: "Tailscale", category: "enterprise_saas" },
    { token: "affirm", name: "Affirm", category: "enterprise_saas" },
  ];

  getBoardsQueried(): string[] {
    return this.boards.map((b) => b.token);
  }

  async searchJobs(): Promise<DiscoveredJobRaw[]> {
    const results: DiscoveredJobRaw[] = [];

    for (const board of this.boards) {
      try {
        const url = `https://boards-api.greenhouse.io/v1/boards/${board.token}/jobs?content=true`;
        const res = await fetch(url, {
          headers: { Accept: "application/json" },
          next: { revalidate: 3600 },
        });

        if (!res.ok) {
          console.warn(`Greenhouse board ${board.token} returned HTTP ${res.status}`);
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
        ];

        // Filter relevant engineering / architecture / leadership roles
        const matched = data.jobs.filter((j: { title?: string; location?: { name?: string } }) => {
          const t = (j.title || "").toLowerCase();
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
          const isRemote = /remote/i.test(locationName) || /anywhere/i.test(locationName);

          // Clean HTML description provided by Greenhouse
          const rawHtml = job.content || "";
          const cleanDesc = rawHtml
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&amp;/g, "&")
            .replace(/<[^>]*>/g, " ")
            .replace(/\s+/g, " ")
            .trim();

          const fullJobText = `${job.title} ${locationName} ${cleanDesc}`;
          const travel = extractTravelDetails(fullJobText);

          // Extract ACTUAL technologies from source title & description
          // Never inject hardcoded defaults!
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
            externalId: `gh-${board.token}-${job.id}`,
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
            url: job.absolute_url,
            postedAt: job.updated_at,
            discoveredAt: new Date().toISOString(),
            isDemo: false,
            sourceTitle: job.title,
            sourceLocation: locationName,
            sourceDescription: cleanDesc,
            sourceSkills: actualSkills,
          });
        }
      } catch (err) {
        console.warn(`Failed to fetch Greenhouse board for ${board.token}:`, err);
      }
    }

    return results;
  }
}
