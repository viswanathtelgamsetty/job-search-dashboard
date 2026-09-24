import type { RemoteType, TravelType } from "@/types";

export interface SearchCriteria {
  keywords?: string[];
  roleFamilies?: string[];
  skills?: string[];
  locations?: string[];
  remoteOnly?: boolean;
}

export interface DiscoveredJobRaw {
  externalId: string;
  title: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  salaryMin?: number;
  salaryMax?: number;
  salaryText?: string;
  currency?: string;
  skills: string[];
  experienceMin?: number;
  experienceMax?: number;
  roleFamily?: string;
  travelType?: TravelType;
  travelPercentage?: number;
  travelDestinations?: string[];
  travelNotes?: string;
  description?: string;
  source: string;
  url: string;
  postedAt?: string;
  discoveredAt: string;
  isDemo?: boolean;
  sourceTitle?: string;
  sourceLocation?: string;
  sourceDescription?: string;
  sourceSkills?: string[];
  sourceSalary?: string;
}

export interface JobProvider {
  readonly id: string;
  readonly name: string;
  readonly isConfigured: boolean;
  searchJobs(criteria: SearchCriteria): Promise<DiscoveredJobRaw[]>;
}
