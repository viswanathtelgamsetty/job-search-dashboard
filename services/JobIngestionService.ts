import type { Job, SearchProfile } from "@/types";
import {
  AdzunaJobProvider,
  ArbeitnowJobProvider,
  GreenhouseCareerProvider,
  RemotiveJobProvider,
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
  ): Promise<{ newJobs: Job[]; totalIngested: number; allJobs: Job[] }> {
    const rawResults = await Promise.allSettled(
      this.providers.map(async (provider) => {
        try {
          return await provider.searchJobs({
            keywords: profile.targetSkills,
            roleFamilies: profile.targetRoleFamilies,
          });
        } catch (err) {
          console.warn(`Provider ${provider.name} failed:`, err);
          return [];
        }
      })
    );

    const discoveredJobs: Job[] = [];

    for (const res of rawResults) {
      if (res.status === "fulfilled" && Array.isArray(res.value)) {
        for (const raw of res.value) {
          // Normalize salary
          const parsedSalary = parseAndNormalizeSalary(
            raw.salaryText,
            raw.salaryMin,
            raw.salaryMax,
            raw.currency
          );

          // Extract travel details
          const travel = extractTravelDetails(
            `${raw.title} ${raw.location} ${raw.description || ""}`,
            {
              travelType: raw.travelType,
              percentage: raw.travelPercentage,
              notes: raw.travelNotes,
            }
          );

          // Transparent rule-based match
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
    };
  }
}

export const jobIngestionService = new JobIngestionService();
