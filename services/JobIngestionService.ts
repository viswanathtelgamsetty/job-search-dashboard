import type {
  Job,
  MarketScanMetrics,
  ProviderStatus,
  SearchProfile,
} from "@/types";
import {
  AdzunaJobProvider,
  ArbeitnowJobProvider,
  GreenhouseCareerProvider,
  JobicyJobProvider,
  RemotiveJobProvider,
  type DiscoveredJobRaw,
  type JobProvider,
} from "./job-providers";
import { parseAndNormalizeSalary } from "@/lib/salaryParser";
import { extractTravelDetails } from "@/lib/travelExtractor";
import { classifyLocation } from "@/lib/locationClassifier";
import { evaluateJobMatch } from "@/lib/matchingEngine";
import { deduplicateJobs, normalizeCompanyName, normalizeJobTitle } from "@/lib/deduplication";
import { defaultSearchProfile } from "@/config/defaultProfile";

export class JobIngestionService {
  private providers: JobProvider[];

  constructor() {
    this.providers = [
      new RemotiveJobProvider(),
      new ArbeitnowJobProvider(),
      new GreenhouseCareerProvider(),
      new JobicyJobProvider(),
      new AdzunaJobProvider(),
    ];
  }

  async runIngestion(
    profile: SearchProfile = defaultSearchProfile,
    existingJobs: Job[] = []
  ): Promise<{
    newJobs: Job[];
    totalIngested: number;
    allJobs: Job[];
    providers: ProviderStatus[];
    metrics: MarketScanMetrics;
  }> {
    const providerStatuses: ProviderStatus[] = [];
    const discoveredJobs: Job[] = [];
    const providersQueried: Record<string, number> = {};

    for (const provider of this.providers) {
      if (!provider.isConfigured) {
        providerStatuses.push({
          id: provider.id,
          name: provider.name,
          enabled: false,
          success: false,
          jobsReturned: 0,
          details:
            provider.id === "adzuna"
              ? "DISABLED — credentials required (ADZUNA_APP_ID and ADZUNA_APP_KEY in .env)"
              : "DISABLED — credentials required",
        });
        providersQueried[provider.name] = 0;
        continue;
      }

      const boardsQueried =
        provider instanceof GreenhouseCareerProvider
          ? provider.getBoardsQueried()
          : undefined;

      try {
        const rawResults: DiscoveredJobRaw[] = await provider.searchJobs({
          keywords: profile.targetSkills,
          roleFamilies: profile.targetRoleFamilies,
          locations: profile.targetLocations,
        });

        providerStatuses.push({
          id: provider.id,
          name: provider.name,
          enabled: true,
          success: true,
          jobsReturned: rawResults.length,
          boardsQueried,
          details: `Successfully fetched ${rawResults.length} live vacancies`,
        });

        providersQueried[provider.name] = rawResults.length;

        for (const raw of rawResults) {
          const parsedSalary = parseAndNormalizeSalary(
            raw.salaryText,
            raw.salaryMin,
            raw.salaryMax,
            raw.currency
          );

          const travel = extractTravelDetails(
            `${raw.title} ${raw.location} ${raw.description || ""}`,
            {
              travelType: raw.travelType,
              percentage: raw.travelPercentage,
              notes: raw.travelNotes,
            }
          );

          const normalizedLocation = classifyLocation(raw.location, raw.remoteType);

          const match = evaluateJobMatch(
            {
              title: raw.title,
              company: raw.company,
              location: raw.location,
              remoteType: raw.remoteType,
              skills: raw.skills,
              roleFamily: raw.roleFamily,
              experienceMin: raw.experienceMin,
              experienceMax: raw.experienceMax,
              salaryLpaMin: parsedSalary.lpaMin,
              salaryDisclosed: parsedSalary.isDisclosed,
              travelType: travel.type,
              travelPercentage: travel.percentage,
              travelDestinations: travel.destinations,
              description: raw.description,
            },
            profile
          );

          const job: Job = {
            id: raw.externalId || `job-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: raw.title,
            normalizedTitle: normalizeJobTitle(raw.title),
            company: raw.company,
            normalizedCompany: normalizeCompanyName(raw.company),
            location: raw.location,
            normalizedLocation,
            remoteType: raw.remoteType,
            salaryMin: parsedSalary.min,
            salaryMax: parsedSalary.max,
            currency: parsedSalary.currency,
            salaryLpaMin: parsedSalary.lpaMin,
            salaryLpaMax: parsedSalary.lpaMax,
            salaryDisclosed: parsedSalary.isDisclosed,
            experienceMin: raw.experienceMin || 10,
            experienceMax: raw.experienceMax || 16,
            skills: raw.skills,
            roleFamily: raw.roleFamily || "Senior Technical Lead",
            travel,
            description: raw.description,
            source: raw.source,
            url: raw.url,
            postedAt: raw.postedAt,
            discoveredAt: raw.discoveredAt || new Date().toISOString(),
            status: "DISCOVERED",
            isDemo: false,
            match,
            updatedAt: new Date().toISOString(),
          };

          discoveredJobs.push(job);
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Provider request failed";
        console.error(`Provider ${provider.name} failed:`, err);
        providerStatuses.push({
          id: provider.id,
          name: provider.name,
          enabled: true,
          success: false,
          jobsReturned: 0,
          error: errorMsg,
          boardsQueried,
          details: `Error encountered: ${errorMsg}`,
        });
        providersQueried[provider.name] = 0;
      }
    }

    const rawJobsCount = discoveredJobs.length;
    const combined = [...discoveredJobs, ...existingJobs];
    const deduplicated = deduplicateJobs(combined);
    const duplicatesCount = Math.max(0, combined.length - deduplicated.length);
    const finalJobsCount = deduplicated.length;

    const existingIds = new Set(existingJobs.map((j) => j.id));
    const newlyAdded = deduplicated.filter((j) => !existingIds.has(j.id) && !j.isDemo);

    // Calculate Market Coverage Metrics across the deduplicated jobs
    const locationBreakdown = {
      hyderabad: 0,
      india: 0,
      remoteIndia: 0,
      remoteGlobal: 0,
      international: 0,
    };

    const travelBreakdown = {
      internationalTravel: 0,
      clientSiteTravel: 0,
      internationalTeamOnly: 0,
      noTravelMentioned: 0,
      relocation: 0,
    };

    for (const j of deduplicated) {
      if (j.normalizedLocation === "HYDERABAD") {
        locationBreakdown.hyderabad++;
        locationBreakdown.india++;
      } else if (
        [
          "BANGALORE",
          "PUNE",
          "CHENNAI",
          "MUMBAI",
          "DELHI_NCR",
          "INDIA_OTHER",
          "REMOTE_INDIA",
        ].includes(j.normalizedLocation)
      ) {
        locationBreakdown.india++;
        if (j.normalizedLocation === "REMOTE_INDIA") {
          locationBreakdown.remoteIndia++;
        }
      } else if (j.normalizedLocation === "REMOTE_GLOBAL") {
        locationBreakdown.remoteGlobal++;
      } else {
        locationBreakdown.international++;
      }

      if (j.travel.type === "INTERNATIONAL_TRAVEL") {
        travelBreakdown.internationalTravel++;
      } else if (j.travel.type === "CLIENT_SITE_TRAVEL") {
        travelBreakdown.clientSiteTravel++;
      } else if (j.travel.type === "INTERNATIONAL_TEAM_ONLY") {
        travelBreakdown.internationalTeamOnly++;
      } else if (j.travel.type === "RELOCATION") {
        travelBreakdown.relocation++;
      } else {
        travelBreakdown.noTravelMentioned++;
      }
    }

    const metrics: MarketScanMetrics = {
      providersQueried,
      rawJobsCount,
      duplicatesCount,
      finalJobsCount,
      locationBreakdown,
      travelBreakdown,
    };

    return {
      newJobs: newlyAdded,
      totalIngested: rawJobsCount,
      allJobs: deduplicated,
      providers: providerStatuses,
      metrics,
    };
  }
}

export const jobIngestionService = new JobIngestionService();
