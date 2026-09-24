export type JobStatus =
  | "DISCOVERED"
  | "SAVED"
  | "APPLIED"
  | "SCREENING"
  | "TECHNICAL"
  | "FINAL"
  | "OFFER"
  | "REJECTED"
  | "IGNORED";

export type RemoteType = "REMOTE" | "HYBRID" | "ONSITE";

export type TravelType =
  | "INTERNATIONAL"
  | "CLIENT_SITE"
  | "OCCASIONAL"
  | "RELOCATION"
  | "NONE"
  | "UNKNOWN";

export type TravelPercentageRange =
  | "10-20%"
  | "20-30%"
  | "30%+"
  | "<10%"
  | "unspecified";

export interface TravelDetails {
  type: TravelType;
  percentage?: number;
  percentageRange?: TravelPercentageRange;
  destinations: string[];
  rawMention?: string;
  notes?: string;
}

export interface JobSourceReference {
  source: string;
  url: string;
  discoveredAt: string;
  externalId?: string;
}

export interface JobMatchDetails {
  overallScore: number; // 0 - 100
  reasons: string[]; // e.g. ["✓ React", "✓ 12+ years", "✓ Hyderabad / Remote"]
  missingOrNeutral: string[];
  breakdown: {
    roleMatch: boolean;
    techStackMatch: boolean;
    experienceMatch: boolean;
    locationMatch: boolean;
    salaryMatch: boolean;
    travelMatch: boolean;
  };
}

export interface Job {
  id: string;
  title: string;
  normalizedTitle: string;
  company: string;
  normalizedCompany: string;
  location: string;
  remoteType: RemoteType;

  // Compensation
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryLpaMin?: number; // In INR Lakhs Per Annum
  salaryLpaMax?: number;
  salaryDisclosed: boolean;

  // Experience requirement
  experienceMin?: number;
  experienceMax?: number;

  skills: string[];
  roleFamily: string;
  travel: TravelDetails;
  description?: string;

  // Sourcing & Discovery
  source: string;
  url: string;
  otherSources?: JobSourceReference[];
  postedAt?: string;
  discoveredAt: string;

  // Lifecycle
  status: JobStatus;
  isDemo?: boolean; // True only for mock/seed data

  // Profile matching
  match: JobMatchDetails;

  // Application tracker details
  notes?: string;
  appliedAt?: string;
  lastContactedAt?: string;
  nextStep?: string;
  updatedAt: string;
}

export interface SearchProfile {
  experienceYears: number; // e.g. 12
  minSalaryLpa: number; // e.g. 35
  targetLocations: string[];
  targetRoleFamilies: string[];
  targetSkills: string[];
  preferredTravelTypes: TravelType[];
  preferredTravelDestinations: string[];
  preferredRemoteTypes: RemoteType[];
  enabledProviders: string[];
}

export interface TargetCompany {
  id: string;
  name: string;
  website: string;
  careersUrl: string;
  industry: string;
  targetRoleFamilies: string[];
  internationalPresence: string[];
  travelPossibility: string;
  notes: string;
  createdAt: string;
}

export interface DashboardStats {
  discovered: number;
  saved: number;
  applied: number;
  screening: number;
  technical: number;
  finalStage: number;
  offers: number;
  rejected: number;
  ignored: number;
  totalActive: number;
  addedToday: number;
  addedThisWeek: number;
  internationalTravelCount: number;
  highMatchCount: number; // >= 75%
  conversionRate: number; // (offers / (applied + screening + technical + final + offers)) * 100
}

export interface ProviderStatus {
  id: string;
  name: string;
  enabled: boolean;
  success: boolean;
  jobsReturned: number;
  error?: string;
  details?: string;
  boardsQueried?: string[];
}

export interface JobFiltersState {
  search: string;
  location: string;
  remoteType: string;
  minSalaryLpa: number | null;
  experienceLevel: string;
  roleFamily: string;
  travelType: string;
  source: string;
  postedWithinDays: number | null;
  sortBy: "newest" | "relevance" | "salary" | "travel" | "location";
}
