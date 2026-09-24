import type {
  ClientFacingDetail,
  ClientFacingStatus,
  FreshnessStatus,
  InternationalExposure,
  InternationalExposureDetail,
  InternationalOpportunity,
  InternationalOpportunityBucket,
  InternationalOpportunityDimensions,
  MarketRegion,
  RelevanceBucket,
  SeniorityLevel,
  TravelDetails,
  WorkAuthorization,
  WorkAuthorizationDetail,
} from "@/types";

export interface EvaluateInternationalOpportunityParams {
  careerFit: RelevanceBucket;
  market: MarketRegion;
  seniority: SeniorityLevel;
  isIndiaEligible: boolean;
  internationalExposure: InternationalExposureDetail | InternationalExposure;
  clientFacingDetail?: ClientFacingDetail;
  clientFacing?: ClientFacingStatus;
  travel?: TravelDetails;
  workAuthorization?: WorkAuthorizationDetail | WorkAuthorization;
  isIndiaToEmea?: boolean;
  freshnessStatus?: "FRESH" | "RECENT" | "OLDER" | "UNKNOWN";
  freshness?: FreshnessStatus;
  roleFamily?: string;
  emeaCountry?: string;
}

export function evaluateInternationalOpportunity(
  params: EvaluateInternationalOpportunityParams
): InternationalOpportunity {
  const careerFit = params.careerFit;
  const market = params.market;
  const seniority = params.seniority;
  const isIndiaEligible = params.isIndiaEligible;
  const travel = params.travel;
  const isIndiaToEmea = params.isIndiaToEmea || false;
  const freshnessStatus = params.freshnessStatus || "UNKNOWN";

  // Safely normalize internationalExposure
  const rawExposure = params.internationalExposure as unknown;
  const internationalExposure: InternationalExposureDetail =
    typeof rawExposure === "object" && rawExposure !== null && "exposure" in rawExposure
      ? (rawExposure as InternationalExposureDetail)
      : typeof rawExposure === "string"
      ? { exposure: rawExposure as InternationalExposureDetail["exposure"], evidence: rawExposure }
      : { exposure: "NONE_MENTIONED", evidence: "No international exposure mentioned" };

  // Safely normalize clientFacingDetail
  const rawParams = params as unknown as Record<string, unknown>;
  const rawClient = (params.clientFacingDetail || rawParams.clientFacing) as unknown;
  const clientFacingDetail: ClientFacingDetail =
    typeof rawClient === "object" && rawClient !== null && "status" in rawClient
      ? (rawClient as ClientFacingDetail)
      : typeof rawClient === "string"
      ? { status: rawClient as ClientFacingDetail["status"], evidence: rawClient }
      : { status: "UNKNOWN", evidence: "Client-facing status unspecified" };

  // Safely normalize workAuthorization
  const rawAuth = params.workAuthorization as unknown;
  const workAuthorization: WorkAuthorizationDetail =
    typeof rawAuth === "object" && rawAuth !== null && "authorization" in rawAuth
      ? (rawAuth as WorkAuthorizationDetail)
      : typeof rawAuth === "string"
      ? { authorization: rawAuth as WorkAuthorizationDetail["authorization"], evidence: rawAuth }
      : { authorization: "UNKNOWN", evidence: "Work authorization unspecified" };

  // 1. Market Fit Dimension (Max 20)
  let marketFitScore = 0;
  let marketFitEvidence = "Market region unspecified";
  if (market === "INDIA") {
    marketFitScore = 20;
    marketFitEvidence = "India-based primary hiring market";
  } else if (market === "EMEA") {
    marketFitScore = 18;
    marketFitEvidence = "EMEA regional market opportunity";
  } else if (market === "GLOBAL_REMOTE") {
    marketFitScore = 17;
    marketFitEvidence = "Global remote market with worldwide scope";
  } else if (market === "NORTH_AMERICA" || market === "APAC") {
    marketFitScore = 10;
    marketFitEvidence = `${market} market`;
  }

  // 2. Customer Exposure Dimension (Max 25)
  let customerScore = 0;
  let customerEvidence = internationalExposure.evidence;
  if (isIndiaToEmea) {
    customerScore = 25;
    customerEvidence = "India-based role with dedicated EMEA customer scope";
  } else if (internationalExposure.exposure === "INTERNATIONAL_CUSTOMERS") {
    customerScore = 22;
    customerEvidence = "Direct international customer engagement";
  } else if (internationalExposure.exposure === "CLIENT_SITE_TRAVEL") {
    customerScore = 24;
    customerEvidence = "Direct client-site international engagement";
  } else if (internationalExposure.exposure === "INTERNATIONAL_TRAVEL") {
    customerScore = 18;
    customerEvidence = "International travel opportunities";
  } else if (internationalExposure.exposure === "INTERNATIONAL_TEAM") {
    customerScore = 10;
    customerEvidence = "Internal cross-border team collaboration";
  } else if (internationalExposure.exposure === "RELOCATION") {
    customerScore = 12;
    customerEvidence = "International relocation opportunity";
  }

  // 3. Travel Opportunity Dimension (Max 15)
  let travelScore = 0;
  let travelEvidence = travel?.evidence || "No travel mentioned";
  if (travel?.type === "CLIENT_SITE_TRAVEL") {
    travelScore = 15;
    travelEvidence = "Client-site travel explicitly required";
  } else if (travel?.type === "INTERNATIONAL_TRAVEL") {
    travelScore = 14;
    travelEvidence = "International business travel required";
  } else if (
    travel?.type === "TRAVEL_20_30" ||
    travel?.type === "TRAVEL_30_PLUS" ||
    (travel?.percentage && travel.percentage >= 20)
  ) {
    travelScore = 13;
    travelEvidence = `Substantial travel required (${travel.percentage || "20-30"}%)`;
  } else if (
    travel?.type === "TRAVEL_10_20" ||
    travel?.type === "OCCASIONAL_TRAVEL"
  ) {
    travelScore = 8;
    travelEvidence = "Occasional / 10-20% travel required";
  }

  // 4. Client Facing Dimension (Max 15)
  let clientScore = 0;
  let clientEvidence = clientFacingDetail.evidence;
  if (clientFacingDetail.status === "YES") {
    clientScore = 15;
    clientEvidence = clientFacingDetail.evidence;
  } else if (clientFacingDetail.status === "UNKNOWN") {
    clientScore = 5;
    clientEvidence = "Client-facing involvement not specified";
  }

  // 5. India Eligibility Dimension (Max 15)
  let indiaScore = 0;
  let indiaEvidence = "Not confirmed India eligible";
  if (isIndiaEligible) {
    indiaScore = 15;
    indiaEvidence = "Confirmed India hiring eligible";
  } else if (market === "GLOBAL_REMOTE") {
    indiaScore = 10;
    indiaEvidence = "Global remote (India hiring plausible)";
  }

  // 6. Work Authorization Dimension (Max 10)
  let authScore = 0;
  const authEvidence = workAuthorization?.evidence || "Work auth unspecified";
  if (workAuthorization?.authorization === "INDIA_ELIGIBLE") {
    authScore = 10;
  } else if (workAuthorization?.authorization === "SPONSORSHIP_AVAILABLE") {
    authScore = 9;
  } else if (workAuthorization?.authorization === "UNKNOWN") {
    authScore = 5;
  } else if (
    workAuthorization?.authorization === "LOCAL_WORK_AUTH_REQUIRED" ||
    workAuthorization?.authorization === "REMOTE_LOCATION_RESTRICTED" ||
    workAuthorization?.authorization === "SPONSORSHIP_NOT_AVAILABLE"
  ) {
    authScore = 0;
  }

  // 7. Freshness Dimension (Max 5)
  let freshScore = 2;
  let freshEvidence = "Posted within regular search window";
  if (freshnessStatus === "FRESH") {
    freshScore = 5;
    freshEvidence = "Recently posted opportunity (<= 3 days)";
  } else if (freshnessStatus === "RECENT") {
    freshScore = 4;
    freshEvidence = "Active opportunity (<= 14 days)";
  }

  const dimensions: InternationalOpportunityDimensions = {
    marketFit: { score: marketFitScore, evidence: marketFitEvidence },
    customerExposure: { score: customerScore, evidence: customerEvidence },
    travelOpportunity: { score: travelScore, evidence: travelEvidence },
    clientFacing: { score: clientScore, evidence: clientEvidence },
    indiaEligibility: { score: indiaScore, evidence: indiaEvidence },
    workAuthorization: { score: authScore, evidence: authEvidence },
    freshness: { score: freshScore, evidence: freshEvidence },
  };

  const totalScore =
    marketFitScore +
    customerScore +
    travelScore +
    clientScore +
    indiaScore +
    authScore +
    freshScore;

  const reasons: string[] = [];

  // =========================================================================
  // CRITICAL CONSTRAINT (Sections 16, 29, 31):
  // "Do not let international opportunity override poor career fit.
  // A completely unrelated job must remain low even if it mentions international travel."
  // =========================================================================
  if (careerFit === "LOW_RELEVANCE") {
    reasons.push("Job does not meet career fit / technical background criteria");
    return {
      bucket: "NOT_INTERNATIONAL",
      score: Math.min(totalScore, 25),
      reasons,
      dimensions,
    };
  }

  const isSeniorOrLead = [
    "ARCHITECT",
    "PRINCIPAL",
    "STAFF",
    "LEAD",
    "DIRECTOR",
    "SENIOR",
  ].includes(seniority);

  const hasHighCareerFit =
    careerFit === "HIGH_RELEVANCE" || careerFit === "RELEVANT";

  const hasIntlOrEmeaScope =
    isIndiaToEmea ||
    market === "EMEA" ||
    market === "GLOBAL_REMOTE" ||
    internationalExposure.exposure === "INTERNATIONAL_CUSTOMERS" ||
    internationalExposure.exposure === "CLIENT_SITE_TRAVEL" ||
    internationalExposure.exposure === "INTERNATIONAL_TRAVEL";

  const hasClientFacing = clientFacingDetail.status === "YES";

  let bucket: InternationalOpportunityBucket = "NOT_INTERNATIONAL";

  // Bucket classification:
  // INTERNATIONAL_PRIORITY:
  // - India eligible (or global remote)
  // - Senior/Lead/Architect
  // - Strong target role (career fit HIGH or RELEVANT)
  // - International customer or client-facing evidence
  // - Travel or EMEA/global exposure
  if (
    hasHighCareerFit &&
    isSeniorOrLead &&
    (isIndiaEligible || market === "GLOBAL_REMOTE") &&
    (isIndiaToEmea || (hasIntlOrEmeaScope && (hasClientFacing || customerScore >= 18 || travelScore >= 12)))
  ) {
    bucket = "INTERNATIONAL_PRIORITY";
    if (isIndiaToEmea) {
      reasons.push("India-based role with direct EMEA customer exposure");
    }
    if (hasClientFacing) {
      reasons.push("Verified client-facing technical leadership");
    }
    if (travelScore >= 12) {
      reasons.push("Explicit international or client-site travel requirement");
    }
    if (market === "GLOBAL_REMOTE") {
      reasons.push("Global remote opportunity suitable for senior architect");
    }
  } else if (
    hasHighCareerFit &&
    hasIntlOrEmeaScope &&
    (isIndiaEligible ||
      workAuthorization?.authorization === "SPONSORSHIP_AVAILABLE" ||
      workAuthorization?.authorization === "UNKNOWN" ||
      market === "EMEA")
  ) {
    bucket = "INTERNATIONAL_ACTIVE";
    reasons.push("Strong career fit with verified international or EMEA scope");
    if (market === "EMEA") {
      reasons.push("Direct EMEA market opportunity");
    }
  } else if (
    (hasIntlOrEmeaScope || internationalExposure.exposure === "INTERNATIONAL_TEAM") &&
    (careerFit === "POSSIBLE" || workAuthorization?.authorization === "UNKNOWN")
  ) {
    bucket = "INTERNATIONAL_WATCH";
    reasons.push("International relevance exists; location or work authorization requires review");
  } else {
    bucket = "NOT_INTERNATIONAL";
    reasons.push("Domestic focus or no international exposure specified");
  }

  return {
    bucket,
    score: totalScore,
    reasons,
    dimensions,
  };
}

export function formatInternationalBucket(
  bucket: InternationalOpportunityBucket
): string {
  switch (bucket) {
    case "INTERNATIONAL_PRIORITY":
      return "Intl Priority";
    case "INTERNATIONAL_ACTIVE":
      return "Intl Active";
    case "INTERNATIONAL_WATCH":
      return "Intl Watch";
    case "NOT_INTERNATIONAL":
      return "Domestic / Standard";
  }
}
