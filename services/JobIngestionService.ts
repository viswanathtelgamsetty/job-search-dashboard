import type { Job, ProviderStatus, SearchProfile } from "@/types";
import {
  AdzunaJobProvider,
  ArbeitnowJobProvider,
  GreenhouseCareerProvider,
  RemotiveJobProvider,
  type DiscoveredJobRaw,
  type JobProvider,
} from "./job-providers";
import { parseAndNormalizeSalary } from "@/lib/salaryParser";
import { extractTravelDetails } from "@/lib/travelExtractor";
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
  }> {
    const providerStatuses: ProviderStatus[] = [];
    const discoveredJobs: Job[] = [];

    // Query each provider individually so errors are explicitly captured
    for (const provider of this.providers) {
      const isEnabled = profile.enabledProviders
        ? profile.enabledProviders.includes(provider.id)
        : true;

      if (!isEnabled) {
        providerStatuses.push({
          id: provider.id,
          name: provider.name,
          enabled: false,
          success: false,
          jobsReturned: 0,
          details: "Disabled by user search configuration",
        });
        continue;
      }

      if (!provider.isConfigured) {
        providerStatuses.push({
          id: provider.id,
          name: provider.name,
          enabled: false,
          success: false,
          jobsReturned: 0,
          details:
            provider.id === "adzuna"
              ? "Disabled: ADZUNA_APP_ID and ADZUNA_APP_KEY credentials required in .env"
              : "Provider credentials not configured",
        });
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
      }
    }

    // Merge discovered jobs with existing jobs, and run deduplication
    const combined = [...discoveredJobs, ...existingJobs];
    const deduplicated = deduplicateJobs(combined);

    const existingIds = new Set(existingJobs.map((j) => j.id));
    const newlyAdded = deduplicated.filter((j) => !existingIds.has(j.id) && !j.isDemo);

    return {
      newJobs: newlyAdded,
      totalIngested: discoveredJobs.length,
      allJobs: deduplicated,
      providers: providerStatuses,
    };
  }
}

export const jobIngestionService = new JobIngestionService();
