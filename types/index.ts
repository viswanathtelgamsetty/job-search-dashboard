export type ApplicationStatus =
  | "DISCOVERED"
  | "SAVED"
  | "APPLIED"
  | "SCREENING"
  | "TECHNICAL"
  | "FINAL"
  | "OFFER"
  | "REJECTED"
  | "IGNORED"
  | "WITHDRAWN";

export type JobStatus = ApplicationStatus;

export type RemoteType = "REMOTE" | "HYBRID" | "ONSITE";

// ==========================================
// Phase 7: Global / EMEA Market & International Opportunity Models
// ==========================================

export type MarketRegion =
  | "INDIA"
  | "EMEA"
  | "NORTH_AMERICA"
  | "LATAM"
  | "APAC"
  | "GLOBAL_REMOTE"
  | "MULTI_REGION_REMOTE"
  | "UNKNOWN";

export type EmeaCountry =
  | "UK"
  | "IRELAND"
  | "GERMANY"
  | "NETHERLANDS"
  | "FRANCE"
  | "SPAIN"
  | "SWITZERLAND"
  | "SWEDEN"
  | "NORWAY"
  | "DENMARK"
  | "FINLAND"
  | "UAE"
  | "SAUDI_ARABIA"
  | "QATAR"
  | "ISRAEL"
  | "SOUTH_AFRICA"
  | "OTHER_EMEA";

export type OpportunityType =
  | "INDIA_LOCAL"
  | "INDIA_REMOTE"
  | "INDIA_INTERNATIONAL"
  | "INDIA_CLIENT_FACING"
  | "INDIA_INTERNATIONAL_CUSTOMERS"
  | "INDIA_INTERNATIONAL_TRAVEL"
  | "INDIA_CLIENT_SITE_TRAVEL"
  | "EMEA_LOCAL"
  | "EMEA_REMOTE"
  | "GLOBAL_REMOTE"
  | "MULTI_REGION_REMOTE"
  | "RELOCATION"
  | "UNKNOWN";

export type InternationalExposure =
  | "NONE_MENTIONED"
  | "INTERNATIONAL_TEAM"
  | "INTERNATIONAL_CUSTOMERS"
  | "CLIENT_SITE_TRAVEL"
  | "INTERNATIONAL_TRAVEL"
  | "RELOCATION"
  | "UNKNOWN";

export interface InternationalExposureDetail {
  exposure: InternationalExposure;
  evidence: string;
}

export type WorkAuthorization =
  | "INDIA_ELIGIBLE"
  | "REMOTE_LOCATION_RESTRICTED"
  | "LOCAL_WORK_AUTH_REQUIRED"
  | "SPONSORSHIP_AVAILABLE"
  | "SPONSORSHIP_NOT_AVAILABLE"
  | "UNKNOWN";

export interface WorkAuthorizationDetail {
  authorization: WorkAuthorization;
  evidence: string;
}

export type ClientFacingStatus = "YES" | "NO" | "UNKNOWN";

export interface ClientFacingDetail {
  status: ClientFacingStatus;
  evidence: string;
}

export type TravelType =
  | "INTERNATIONAL_TRAVEL"
  | "CLIENT_SITE_TRAVEL"
  | "INTERNATIONAL_TEAM_ONLY"
  | "REMOTE_GLOBAL"
  | "RELOCATION"
  | "NO_TRAVEL_MENTIONED"
  | "TRAVEL_UNKNOWN"
  | "OCCASIONAL_TRAVEL"
  | "TRAVEL_10_20"
  | "TRAVEL_20_30"
  | "TRAVEL_30_PLUS"
  | "UNKNOWN";

export type InternationalOpportunityBucket =
  | "INTERNATIONAL_PRIORITY"
  | "INTERNATIONAL_ACTIVE"
  | "INTERNATIONAL_WATCH"
  | "NOT_INTERNATIONAL";

export interface InternationalOpportunityDimensions {
  marketFit: { score: number; evidence: string };
  customerExposure: { score: number; evidence: string };
  travelOpportunity: { score: number; evidence: string };
  clientFacing: { score: number; evidence: string };
  indiaEligibility: { score: number; evidence: string };
  workAuthorization: { score: number; evidence: string };
  freshness: { score: number; evidence: string };
}

export interface InternationalOpportunity {
  bucket: InternationalOpportunityBucket;
  score: number; // 0-100 deterministic
  reasons: string[];
  dimensions: InternationalOpportunityDimensions;
}

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
  | "MULTI_REGION"
  | "USA"
  | "EUROPE"
  | "MIDDLE_EAST"
  | "SINGAPORE"
  | "OTHER"
  | "UNKNOWN";

export type TravelPercentageRange =
  | "10-20%"
  | "20-30%"
  | "30%+"
  | "<10%"
  | "unspecified";

export interface TravelDetails {
  type: TravelType;
  travelCategory?: TravelType;
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
  | "DATA_AI"
  | "SOFTWARE_ENGINEERING"
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

export type RoleTier =
  | "TIER_1"
  | "TIER_2"
  | "TIER_3"
  | "TIER_4"
  | "TIER_5";

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

export type OpportunityPriority = "PRIORITY" | "ACTIVE" | "WATCH" | "LOW";

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

export type DomainEvidenceSource = "title" | "description" | "skills" | "metadata";
export type DomainEvidenceStrength = "STRONG" | "MODERATE" | "WEAK";

export interface DomainMatchDetail {
  domain: CareerDomain;
  matched: boolean;
  evidence: string | null;
  source?: DomainEvidenceSource;
  strength?: DomainEvidenceStrength;
}

export type FitStrength = "STRONG" | "MODERATE" | "WEAK" | "NONE";

export type ApplicationRecommendation = "APPLY_NOW" | "REVIEW" | "WATCH" | "SKIP";

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
  architectureFit: DimensionFit;
  clientConsultingFit: DimensionFit;
  seniorityFit: DimensionFit;
  locationFit: DimensionFit;
  internationalFit: DimensionFit;
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
  roleTier?: RoleTier;
  primaryTechnologiesMatched?: string[];
  secondaryTechnologiesMatched?: string[];
  domainMatches: DomainMatchDetail[];
  secondaryEvidenceDomains?: CareerDomain[];
  dimensions: CareerFitDimensions;
  applicationRecommendation?: ApplicationRecommendation;
  technologyFit?: DimensionFit;
  domainFit?: DimensionFit;
  architectureFit?: DimensionFit;
  clientConsultingFit?: DimensionFit;
  seniorityFit?: DimensionFit;
  locationFit?: DimensionFit;
  internationalFit?: DimensionFit;
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
  primaryTechnologiesMatched?: string[];
  secondaryTechnologiesMatched?: string[];
  roleFamily: RoleFamily;
  secondaryRoleFamilies?: RoleFamily[];
  roleTier?: RoleTier;
  domains: CareerDomain[];
  secondaryEvidenceDomains?: CareerDomain[];
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

  // Profile matching & Opportunity Priority
  opportunityPriority?: OpportunityPriority;
  opportunityPriorityReasons?: string[];
  match: JobMatchDetails;

  // Phase 7: Global / EMEA Market & Opportunity classification
  market?: MarketRegion;
  regions?: string[];
  emeaCountry?: EmeaCountry;
  customerRegion?: string;
  opportunityType?: OpportunityType;
  opportunityTypes?: OpportunityType[];
  internationalExposure?: InternationalExposureDetail;
  workAuthorization?: WorkAuthorizationDetail;
  clientFacingDetail?: ClientFacingDetail;
  clientFacing?: ClientFacingStatus;
  internationalOpportunity?: InternationalOpportunity;
  isIndiaToEmea?: boolean;
  isIndiaToEmeaReason?: string;
  travelType?: TravelType;
  travelEvidence?: string;

  // Phase 7.2: Discovery Quality & Recommendations
  applicationRecommendation?: ApplicationRecommendation;
  technologyFit?: DimensionFit;
  domainFit?: DimensionFit;
  architectureFit?: DimensionFit;
  clientConsultingFit?: DimensionFit;
  seniorityFit?: DimensionFit;
  locationFit?: DimensionFit;
  internationalFit?: DimensionFit;

  // Application tracker details
  notes?: string;
  userNotes?: string;
  savedAt?: string;
  appliedAt?: string;
  ignoredAt?: string;
  ignoreReason?: string;
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

export type MarketRadarSection =
  | "ALL"
  | "BEST_MATCHES"
  | "FRESH"
  | "TRAVEL"
  | "REMOTE_GLOBAL"
  | "HYDERABAD_INDIA"
  | "ADJACENT"
  | "EMEA_OPPORTUNITIES"
  | "INDIA_TO_EMEA";

export interface MarketRadarMetrics {
  totalJobs: number;
  highRelevance: number;
  relevant: number;
  possible: number;
  lowRelevance: number;
  india: number;
  hyderabad: number;
  remoteIndia: number;
  globalRemote: number;
  internationalOnsite: number;
  internationalTravel: number;
  clientSiteTravel: number;
  relocation: number;
  freshJobs: number;
  recentJobs: number;
  priorityOpportunities: number;
  activeOpportunities: number;
  watchOpportunities: number;
  lowOpportunities: number;
  // Phase 7 additions:
  emeaOpportunities: number;
  indiaToEmeaOpportunities: number;
  northAmerica: number;
  apac: number;
  clientFacingCount: number;
  internationalPriorityCount: number;
  internationalActiveCount: number;
  internationalWatchCount: number;
  emeaCountryCounts: Record<string, number>;
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
  sortBy:
    | "relevance"
    | "freshest"
    | "newest"
    | "travel"
    | "location"
    | "salary"
    | "international"
    | "clientFacing"
    | "market"
    | "action_required"
    | "deadline"
    | "saved_date"
    | "followup_date";
  section?: MarketRadarSection;
  opportunityPriority?: string;
  applicationTrackingFilter?: "ALL" | "SAVED" | "APPLIED" | "NEEDS_FOLLOW_UP";
  // Phase 7 & 9 Filters:
  market?: string;
  emeaCountry?: string;
  opportunityType?: string;
  internationalExposure?: string;
  workAuthorization?: string;
  internationalBucket?: string;
  recommendation?: string;
  savedAging?: "ALL" | "SAVED_GT_2D" | "SAVED_GT_5D";
  followUpFilter?: "ALL" | "DUE_TODAY" | "OVERDUE" | "UPCOMING";
  newSinceLastVisit?: boolean;
}

export interface Application {
  id: string;
  jobId: string;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  savedAt?: string;
  appliedAt?: string;
  lastActivityAt: string;
  nextFollowUpAt?: string;
  followUpDate?: string;
  followUpNote?: string;
  resumeVersion?: string;
  coverLetterUsed?: string;
  referral?: boolean;
  referralName?: string;
  referralNotes?: string;
  recruiterName?: string;
  recruiterEmail?: string;
  recruiterLinkedIn?: string;
  salaryOffered?: number;
  salaryExpected?: number;
  salaryCurrency?: string;
  noticePeriodDiscussed?: string;
  interviewDates?: string[];
  notes?: string;
  communicationNotes?: string;
  rejectionReason?: string;
  withdrawalReason?: string;
  source?: string;
  applicationUrl?: string;
}

export interface ApplicationFunnelMetrics {
  totalApplications: number;
  saved: number;
  applied: number;
  screening: number;
  technical: number;
  final: number;
  offers: number;
  rejected: number;
  withdrawn: number;
  ignored: number;
  followUpsDue: number;
  // Funnel conversion percentages (0 to 100 or null if denominator is 0)
  appliedToScreeningConversion: number | null;
  screeningToTechnicalConversion: number | null;
  technicalToFinalConversion: number | null;
  finalToOfferConversion: number | null;
}

// ==========================================
// Phase 6: 60-Day Job Search Command Center Types
// ==========================================

export interface SearchPeriodSettings {
  searchStartDate: string; // YYYY-MM-DD
  searchEndDate: string; // YYYY-MM-DD
  durationDays: number; // default 60
  applicationsPerDayTarget: number; // default 2
  applicationsPerWeekTarget: number; // default 10
  followUpsPerWeekTarget: number; // default 5
  inactiveThresholdDays: number; // default 7
}

export interface SearchProgress {
  searchStartDate: string;
  searchEndDate: string;
  durationDays: number;
  currentDay: number; // 1 to durationDays
  daysRemaining: number;
  progressPercentage: number;
  isCompleted: boolean;
}

export interface DailyActivityBucket {
  date: string; // YYYY-MM-DD
  dayNumber: number; // 1 to 60
  isToday: boolean;
  jobsDiscovered: number;
  jobsSaved: number;
  applicationsSubmitted: number;
  followUpsCompleted: number;
  applicationsProgressed: number;
}

export interface WeeklyActivityBucket {
  weekNumber: number; // 1 to 9
  label: string; // "Week 1", ... "Week 9"
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number; // 7 (or partial for final week)
  isCurrent: boolean;
  jobsDiscovered: number;
  jobsSaved: number;
  applicationsSubmitted: number;
  followUpsCompleted: number;
  applicationsProgressed: number;
}

export interface TodayMetrics {
  todayDateFormatted?: string;
  applyNowCount?: number;
  needsReviewCount?: number;
  savedNotAppliedCount?: number;
  followUpsDueToday?: number;
  recentlyDiscoveredHighPriority?: number;
  newRelevantJobs: number;
  priorityOpportunities: number;
  savedNotApplied: number;
  applicationsSubmittedToday: number;
  followUpsDue: number;
  overdueFollowUps: number;
  applicationsProgressedToday: number;
}

export interface DailyAction {
  id: string;
  title: string;
  description: string;
  count: number;
  actionUrl: string;
  badgeType: "urgent" | "attention" | "info" | "neutral";
  priorityOrder: number;
}

export interface SearchHealthMetrics {
  relevantOpportunitiesDiscovered: number;
  saved: number;
  applied: number;
  awaitingResponse: number;
  screenings: number;
  technical: number;
  finalStages: number;
  offers: number;
  followUpsDue: number;
  savedNotApplied: number;
  appliedNoRecentActivity: number;
  applicationsWithUpcomingFollowUp: number;
}

export interface TargetRoleDistribution {
  domains: Array<{
    domain: CareerDomain;
    label: string;
    count: number;
  }>;
  workArrangements: {
    internationalTravel: number;
    clientSiteTravel: number;
    remoteGlobal: number;
  };
}

export interface MarketActivityMetrics {
  totalJobs: number;
  highCareerFit: number;
  relevant: number;
  possible: number;
  fresh: number;
  recent: number;
  hyderabad: number;
  india: number;
  remoteIndia: number;
  globalRemote: number;
  internationalTravel: number;
  clientSiteTravel: number;
  // Phase 7 additions:
  emea?: number;
  indiaToEmea?: number;
  clientFacing?: number;
  internationalPriority?: number;
}

