import type {
  ClientFacingDetail,
  EmeaCountry,
  InternationalExposureDetail,
  MarketRegion,
  OpportunityType,
  RemoteType,
  TravelDetails,
} from "@/types";

export interface OpportunityTypeResult {
  primary: OpportunityType;
  types: OpportunityType[];
  isIndiaToEmea: boolean;
  isIndiaToEmeaReason?: string;
  customerRegion?: string;
}

export function classifyOpportunityTypes(params: {
  market: MarketRegion;
  emeaCountry?: EmeaCountry;
  remoteType?: RemoteType;
  location?: string;
  isIndiaEligible?: boolean;
  travel?: TravelDetails;
  internationalExposure?: InternationalExposureDetail | string;
  clientFacingDetail?: ClientFacingDetail | string;
  clientFacing?: string;
  description?: string;
  text?: string;
}): OpportunityTypeResult {
  const {
    market,
    remoteType,
    location = "",
    isIndiaEligible = false,
    travel,
  } = params;

  const text = params.description || params.text || "";
  const types: OpportunityType[] = [];
  const fullText = `${location} ${text}`.toLowerCase();

  const isRemote =
    remoteType === "REMOTE" ||
    /\bremote\b/i.test(location) ||
    /\bwork from home\b/i.test(location);

  const rawExposure = params.internationalExposure;
  const exposureVal =
    typeof rawExposure === "object" && rawExposure !== null && "exposure" in rawExposure
      ? rawExposure.exposure
      : typeof rawExposure === "string"
      ? rawExposure
      : undefined;

  const rawClient = params.clientFacingDetail || params.clientFacing;
  const isClientFacing =
    typeof rawClient === "object" && rawClient !== null && "status" in rawClient
      ? rawClient.status === "YES"
      : rawClient === "YES";

  const hasIntlTravel =
    travel?.type === "INTERNATIONAL_TRAVEL" ||
    travel?.type === "CLIENT_SITE_TRAVEL" ||
    exposureVal === "CLIENT_SITE_TRAVEL" ||
    exposureVal === "INTERNATIONAL_TRAVEL";

  const hasIntlExposure =
    exposureVal === "INTERNATIONAL_CUSTOMERS" ||
    exposureVal === "INTERNATIONAL_TRAVEL" ||
    exposureVal === "CLIENT_SITE_TRAVEL";

  // Check Relocation
  if (
    travel?.type === "RELOCATION" ||
    exposureVal === "RELOCATION"
  ) {
    types.push("RELOCATION");
  }

  // 1. INDIA OPPORTUNITIES
  if (market === "INDIA" || (isIndiaEligible && market !== "GLOBAL_REMOTE" && market !== "MULTI_REGION_REMOTE" && market !== "EMEA")) {
    if (travel?.type === "CLIENT_SITE_TRAVEL" || exposureVal === "CLIENT_SITE_TRAVEL") {
      types.push("INDIA_CLIENT_SITE_TRAVEL");
    }
    if (hasIntlTravel) {
      types.push("INDIA_INTERNATIONAL_TRAVEL");
    }
    if (exposureVal === "INTERNATIONAL_CUSTOMERS" || hasIntlExposure) {
      types.push("INDIA_INTERNATIONAL_CUSTOMERS");
    }
    if (isClientFacing) {
      types.push("INDIA_CLIENT_FACING");
    }
    if (hasIntlExposure || hasIntlTravel) {
      types.push("INDIA_INTERNATIONAL");
    }
    if (isRemote) {
      types.push("INDIA_REMOTE");
    } else {
      types.push("INDIA_LOCAL");
    }
  }

  // 2. EMEA OPPORTUNITIES
  if (market === "EMEA") {
    if (isRemote) {
      types.push("EMEA_REMOTE");
    } else {
      types.push("EMEA_LOCAL");
    }
  }

  // 3. MULTI-REGION & GLOBAL REMOTE OPPORTUNITIES
  if (market === "MULTI_REGION_REMOTE") {
    types.push("MULTI_REGION_REMOTE");
  }

  if (market === "GLOBAL_REMOTE" || travel?.type === "REMOTE_GLOBAL") {
    types.push("GLOBAL_REMOTE");
  }

  if (types.length === 0) {
    types.push("UNKNOWN");
  }

  // Determine Primary Opportunity Type
  // Preservation rule: If India + International Travel / Client Facing,
  // do NOT collapse to INDIA_LOCAL!
  let primary: OpportunityType = types[0];
  if (market === "GLOBAL_REMOTE" && types.includes("GLOBAL_REMOTE")) {
    primary = "GLOBAL_REMOTE";
  } else if (market === "MULTI_REGION_REMOTE" && types.includes("MULTI_REGION_REMOTE")) {
    primary = "MULTI_REGION_REMOTE";
  } else if (types.includes("INDIA_INTERNATIONAL_TRAVEL")) {
    primary = "INDIA_INTERNATIONAL_TRAVEL";
  } else if (types.includes("INDIA_CLIENT_SITE_TRAVEL")) {
    primary = "INDIA_CLIENT_SITE_TRAVEL";
  } else if (types.includes("INDIA_CLIENT_FACING") && types.includes("INDIA_INTERNATIONAL_CUSTOMERS")) {
    primary = "INDIA_CLIENT_FACING";
  } else if (types.includes("INDIA_INTERNATIONAL_CUSTOMERS")) {
    primary = "INDIA_INTERNATIONAL_CUSTOMERS";
  } else if (types.includes("INDIA_CLIENT_FACING")) {
    primary = "INDIA_CLIENT_FACING";
  } else if (types.includes("INDIA_INTERNATIONAL")) {
    primary = "INDIA_INTERNATIONAL";
  } else if (types.includes("INDIA_REMOTE")) {
    primary = "INDIA_REMOTE";
  } else if (types.includes("GLOBAL_REMOTE")) {
    primary = "GLOBAL_REMOTE";
  } else if (types.includes("EMEA_REMOTE")) {
    primary = "EMEA_REMOTE";
  } else if (types.includes("EMEA_LOCAL")) {
    primary = "EMEA_LOCAL";
  } else if (types.includes("RELOCATION")) {
    primary = "RELOCATION";
  } else if (types.includes("INDIA_LOCAL")) {
    primary = "INDIA_LOCAL";
  }

  // 4. Section 18: India -> EMEA Detection & Customer Region
  // Prioritize jobs that are based in India / remote India / India-eligible
  // AND have explicit evidence of EMEA customers, European clients, travel to Europe, etc.
  let isIndiaToEmea = false;
  let isIndiaToEmeaReason: string | undefined;
  let customerRegion: string | undefined;

  const isIndiaBase = market === "INDIA" || isIndiaEligible;
  const emeaCustomerRegex =
    /\b((?:work(?:ing)?|support(?:ing)?|partner(?:ing)?|advise|advising|serve|serving|deliver(?:ing)?|engag(?:e|ing))\s+(?:directly\s+|closely\s+)?(?:with\s+)?(?:enterprise\s+)?(?:customers?|clients?)\s+(?:across|in)\s+(?:emea|europe|middle\s+east|uk|germany)|(?:emea|european|middle\s+east)\s+(?:customers?|clients?|client\s+base|customer\s+base)|travel\s+to\s+(?:(?:customer\s+sites?|client\s+sites?)\s+(?:in|across)\s+)?(?:europe|emea|middle\s+east|uk|germany)|client-facing\s+role\s+across\s+emea|work(?:ing)?\s+(?:directly\s+|closely\s+)?with\s+emea\s+customers|supporting\s+middle\s+east)\b/i;

  const emeaCustomerMatch = fullText.match(emeaCustomerRegex);
  if (emeaCustomerMatch) {
    customerRegion = "EMEA";
    if (isIndiaBase) {
      isIndiaToEmea = true;
      isIndiaToEmeaReason = `India-based role with verified EMEA customer scope: "${emeaCustomerMatch[0]}"`;
      if (!types.includes("INDIA_INTERNATIONAL")) {
        types.push("INDIA_INTERNATIONAL");
      }
      if (!types.includes("INDIA_INTERNATIONAL_CUSTOMERS")) {
        types.push("INDIA_INTERNATIONAL_CUSTOMERS");
      }
    }
  } else if (/\b(?:us|usa|united states|north america|americas)\s+(?:customers?|clients?|stakeholders?)\b/i.test(fullText)) {
    customerRegion = "NORTH_AMERICA";
  } else if (/\b(?:apac|asia pacific|australia)\s+(?:customers?|clients?|stakeholders?)\b/i.test(fullText)) {
    customerRegion = "APAC";
  } else if (/\b(?:global|worldwide|international)\s+(?:customers?|clients?|stakeholders?)\b/i.test(fullText)) {
    customerRegion = "GLOBAL";
  }

  return {
    primary,
    types,
    isIndiaToEmea,
    isIndiaToEmeaReason,
    customerRegion,
  };
}

export function formatOpportunityType(type: OpportunityType): string {
  switch (type) {
    case "INDIA_LOCAL":
      return "India Local";
    case "INDIA_REMOTE":
      return "India Remote";
    case "INDIA_INTERNATIONAL":
      return "India International";
    case "INDIA_CLIENT_FACING":
      return "India Client-Facing";
    case "INDIA_INTERNATIONAL_CUSTOMERS":
      return "India Intl Customers";
    case "INDIA_INTERNATIONAL_TRAVEL":
      return "India Intl Travel";
    case "INDIA_CLIENT_SITE_TRAVEL":
      return "India Client-Site Travel";
    case "EMEA_LOCAL":
      return "EMEA Local";
    case "EMEA_REMOTE":
      return "EMEA Remote";
    case "GLOBAL_REMOTE":
      return "Global Remote";
    case "MULTI_REGION_REMOTE":
      return "Multi-Region Remote";
    case "RELOCATION":
      return "Relocation";
    case "UNKNOWN":
      return "Unspecified";
  }
}
