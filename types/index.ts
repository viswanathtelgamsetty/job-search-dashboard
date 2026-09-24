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
  | "INTERNATIONAL_TRAVEL"
  | "CLIENT_SITE_TRAVEL"
  | "INTERNATIONAL_TEAM_ONLY"
  | "REMOTE_GLOBAL"
  | "RELOCATION"
  | "NO_TRAVEL_MENTIONED"
  | "UNKNOWN";

export type NormalizedLocation =
  | "HYDERABAD"
  | "BANGALORE"
  | "PUNE"
  | "CHENNAI"
  | "MUMBAI"
  | "DELHI_NCR"
  | "INDIA_OTHER"
  | "REMOTE_INDIA"
  | "REMOTE_GLOBAL"
  | "USA"
  | "EUROPE"
  | "MIDDLE_EAST"
  | "SINGAPORE"
  | "OTHER";

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
  evidence: string;
  rawMention?: string;
  notes?: string;
}

export interface JobSourceReference {
  source: string;
  url: string;
  discoveredAt: string;
  externalId?: string;
}

export type RoleFamily =
  | "FRONTEND_ARCHITECT"
  | "TECHNICAL_ARCHITECT"
  | "SOLUTIONS_ARCHITECT"
  | "TECHNICAL_LEAD"
  | "SENIOR_FRONTEND_ENGINEER"
  | "SOLUTIONS_ENGINEER"
  | "TECHNICAL_CONSULTANT"
  | "IMPLEMENTATION_CONSULTANT"
  | "PROFESSIONAL_SERVICES"
  | "CMS_DIGITAL_EXPERIENCE"
  | "COMMERCE"
  | "ENTERPRISE_INTEGRATION"
  | "OTHER";

export type SeniorityLevel =
  | "ENTRY"
  | "MID"
  | "SENIOR"
  | "LEAD"
  | "STAFF"
  | "PRINCIPAL"
  | "ARCHITECT"
  | "DIRECTOR"
  | "UNKNOWN";

export type RelevanceBucket =
  | "HIGH_RELEVANCE"
  | "RELEVANT"
  | "POSSIBLE"
  | "LOW_RELEVANCE";

export type SalaryState =
  | "SALARY_CONFIRMED"
  | "SALARY_RANGE"
  | "SALARY_ESTIMATED"
  | "SALARY_NOT_DISCLOSED";

export type FreshnessStatus =
  | "FRESH"
  | "RECENT"
  | "OLDER"
  | "UNKNOWN";

export type CareerDomain =
  | "FRONTEND"
  | "DIGITAL_EXPERIENCE"
  | "CMS"
  | "COMMERCE"
  | "ENTERPRISE_INTEGRATION"
  | "SOLUTIONS_ARCHITECTURE"
  | "TECHNICAL_ARCHITECTURE"
  | "CLIENT_CONSULTING"
  | "PROFESSIONAL_SERVICES"
  | "SOFTWARE_ENGINEERING"
  | "DEVOPS"
  | "SRE"
  | "DATA_AI"
  | "SECURITY"
  | "OTHER";

export interface DomainMatchDetail {
  domain: CareerDomain;
  matched: boolean;
  evidence: string | null;
}

export type FitStrength = "STRONG" | "MODERATE" | "WEAK" | "NONE";

export interface DimensionFit {
  matched: boolean;
  strength: FitStrength;
  evidence: string[];
  reason: string;
}

export interface CareerFitDimensions {
  roleFit: DimensionFit;
  technologyFit: DimensionFit;
  domainFit: DimensionFit;
  seniorityFit: DimensionFit;
  locationFit: DimensionFit;
  remoteFit: DimensionFit;
  travelFit: DimensionFit;
  clientFacingFit: DimensionFit;
  freshnessFit: {
    status: FreshnessStatus;
    daysAgo?: number;
    label: string;
  };
}

export interface TechnologyMatchDetail {
  technology: string;
  matched: boolean;
  evidence: string | null;
}

export interface MatchCriterion {
  matched: boolean;
  evidence: string[];
  reason: string;
}

export interface JobMatchDetails {
  relevanceBucket: RelevanceBucket;
  careerFit: RelevanceBucket; // Career Fit classification
  reasons: string[]; // 2-5 concrete reasons ("✓ ...")
  whyThisFits: string[]; // "WHY THIS FITS"
  cautions: string[]; // Reasons why it may not match ("! ...")
  potentialGaps: string[]; // "POTENTIAL GAPS"
  domainMatches: DomainMatchDetail[];
  dimensions: CareerFitDimensions;
  missingOrNeutral?: string[];
  breakdown: {
    roleMatch: MatchCriterion;
    technologyMatch: MatchCriterion & {
      details?: TechnologyMatchDetail[];
    };
    experienceMatch: MatchCriterion;
    locationMatch: MatchCriterion;
    remoteMatch: MatchCriterion;
    travelMatch: MatchCriterion;
    seniorityMatch: MatchCriterion;
    salaryMatch: MatchCriterion;
    clientFacingMatch: MatchCriterion;
  };
  overallScore?: number; // Deterministic explainable sorting score
}

export interface Job {
  id: string;
  title: string;
  normalizedTitle: string;
  company: string;
  normalizedCompany: string;
  location: string;
  rawLocation?: string;
  normalizedLocation: NormalizedLocation;
  remoteType: RemoteType;
  isIndiaEligible: boolean;
  indiaEligibilityReason?: string;

  // Compensation Quality
  salaryState: SalaryState;
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  salaryLpaMin?: number; // In INR Lakhs Per Annum
  salaryLpaMax?: number;
  salaryDisclosed: boolean;
  originalSalary?: string;
  originalCurrency?: string;
  convertedSalary?: string;
  conversionDate?: string;
  isSalaryEstimated?: boolean;

  // Seniority & Experience
  seniority: SeniorityLevel;
  seniorityEvidence?: string;
  experienceMin?: number;
  experienceMax?: number;

  // Skills & Role Families & Domains (Strictly separated)
  skills: string[]; // actualJobTechnologies
  actualJobTechnologies: string[];
  matchedTargetTechnologies: string[];
  technologyMatchDetails: TechnologyMatchDetail[];
  roleFamily: RoleFamily;
  secondaryRoleFamilies?: RoleFamily[];
  domains: CareerDomain[];
  domainMatches: DomainMatchDetail[];
  careerFit: RelevanceBucket;
  travel: TravelDetails;
  description?: string;

  // Raw source auditing (Requirement 7)
  sourceTitle?: string;
  sourceLocation?: string;
  sourceDescription?: string;
  sourceSkills?: string[];
  sourceSalary?: string;

  // Sourcing & Discovery & Quality
  source: string;
  url: string;
  otherSources?: JobSourceReference[];
  postedAt?: string;
  discoveredAt: string;
  lastVerifiedAt?: string;
  freshness: FreshnessStatus;
  postedDaysAgo?: number;
  dataQualityWarnings?: string[];

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

export interface MarketScanMetrics {
  providersQueried: Record<string, number>;
  rawJobsCount: number;
  duplicatesCount: number;
  finalJobsCount: number;
  locationBreakdown: {
    hyderabad: number;
    india: number;
    remoteIndia: number;
    remoteGlobal: number;
    international: number;
  };
  travelBreakdown: {
    internationalTravel: number;
    clientSiteTravel: number;
    internationalTeamOnly: number;
    noTravelMentioned: number;
    relocation: number;
  };
  relevanceBreakdown?: {
    highRelevance: number;
    relevant: number;
    possible: number;
    lowRelevance: number;
  };
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
  technology: string;
  domain: string;
  clientFacing: string;
  relevance: string;
  company: string;
  salaryState?: string;
  freshness?: string;
  postedWithinDays: number | null;
  sortBy: "newest" | "relevance" | "salary" | "travel" | "location";
}
