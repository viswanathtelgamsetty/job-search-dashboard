import type { NormalizedLocation, RemoteType } from "@/types";

export interface IndiaEligibilityResult {
  isIndiaEligible: boolean;
  reason: string;
}

export function classifyLocation(
  locationStr: string,
  remoteType?: RemoteType
): NormalizedLocation {
  const loc = (locationStr || "").toLowerCase().trim();

  if (!loc) {
    return "UNKNOWN";
  }

  // 1. Tech Metro Hubs in India
  if (
    /\b(hyderabad|secunderabad|telangana|hitec\s*city|gachibowli|madhapur|financial\s*district)\b/i.test(
      loc
    )
  ) {
    return "HYDERABAD";
  }

  if (
    /\b(bangalore|bengaluru|karnataka|whitefield|electronic\s*city|bellandur|koramangala|indiranagar)\b/i.test(
      loc
    )
  ) {
    return "BANGALORE";
  }

  if (/\b(pune|hinjewadi|magarpatta|baner|kharadi|maharashtra)\b/i.test(loc) && !/\b(mumbai|bombay)\b/i.test(loc)) {
    return "PUNE";
  }

  if (/\b(chennai|tamil\s*nadu|madras|omr|siruseri)\b/i.test(loc)) {
    return "CHENNAI";
  }

  if (/\b(mumbai|bombay|navi\s*mumbai|thane)\b/i.test(loc)) {
    return "MUMBAI";
  }

  if (
    /\b(delhi|gurgaon|gurugram|noida|greater\s*noida|faridabad|ncr|haryana)\b/i.test(
      loc
    )
  ) {
    return "DELHI_NCR";
  }

  // 2. Multi-Region Check (Requirement 1 & 2: Never infer USA from "Northern America, LATAM, Europe, APAC")
  const regionMatches = [
    /\b(northern america|north america|americas)\b/i.test(loc) || (/\b(usa|united states|canada)\b/i.test(loc) && /[,/|]/.test(loc)),
    /\b(latam|latin america|south america|brazil|argentina)\b/i.test(loc),
    /\b(emea|europe|european union|uk|germany|netherlands|france|spain)\b/i.test(loc),
    /\b(apac|asia pacific|singapore|australia|japan)\b/i.test(loc),
  ].filter(Boolean);

  if (regionMatches.length >= 2 || /\b(multi[- ]region|multiple regions)\b/i.test(loc)) {
    return "MULTI_REGION";
  }

  // 3. Remote Global / Worldwide (Check before general India check)
  if (
    /\b(anywhere\s+in\s+the\s+world|worldwide|global|all regions|international remote|remote - global|any location|global remote)\b/i.test(
      loc
    )
  ) {
    return "REMOTE_GLOBAL";
  }

  // 4. India Remote vs Remote Global vs India Other
  const isIndia = /\b(india)\b|[,/]\s*in\b/i.test(loc);
  const isRemote =
    remoteType === "REMOTE" ||
    /\b(remote|wfh|work from home|anywhere)\b/i.test(loc);

  if (isIndia && isRemote) {
    return "REMOTE_INDIA";
  }

  if (isIndia) {
    return "INDIA_OTHER";
  }

  // 5. International Geographies
  if (/\b(singapore)\b/i.test(loc)) {
    return "SINGAPORE";
  }

  if (
    /\b(dubai|uae|united arab emirates|saudi|riyadh|qatar|doha|middle east|bahrain)\b/i.test(
      loc
    )
  ) {
    return "MIDDLE_EAST";
  }

  // Strict USA check: never infer USA from "Northern America" or "Americas"
  if (
    /\b(usa|united states|u\.s\.|u\.s\.a\.|new york|california|san francisco|austin|seattle|chicago|boston|los angeles|seattle|texas)\b/i.test(
      loc
    ) &&
    !/\b(northern america|north america|latin america|south america|americas)\b/i.test(loc)
  ) {
    return "USA";
  }

  if (
    /\b(europe|uk|united kingdom|london|germany|berlin|munich|frankfurt|netherlands|amsterdam|switzerland|zurich|france|paris|ireland|dublin|poland|spain|sweden)\b/i.test(
      loc
    )
  ) {
    return "EUROPE";
  }

  // If remote with unspecified geographic restriction, classify as REMOTE_GLOBAL (not REMOTE_INDIA)
  if (isRemote) {
    return "REMOTE_GLOBAL";
  }

  return "OTHER";
}

/**
 * Determines whether a job is eligible for candidates based in India.
 * Strict rule: Generic "Remote" is NOT India-eligible unless it explicitly states
 * Worldwide, Anywhere, India, or Global eligibility.
 */
export function checkIndiaEligibility(
  locationStr: string,
  remoteType?: RemoteType,
  description = ""
): IndiaEligibilityResult {
  const loc = (locationStr || "").toLowerCase().trim();
  const desc = (description || "").toLowerCase();
  const combined = `${loc} ${desc}`;

  // 1. Explicit Indian Cities or India Mention in Location
  if (
    /\b(hyderabad|bangalore|bengaluru|pune|chennai|mumbai|delhi|gurgaon|gurugram|noida|india)\b/i.test(
      loc
    )
  ) {
    return {
      isIndiaEligible: true,
      reason: `Location is within India (${locationStr})`,
    };
  }

  // 2. Explicit restrictions EXCLUDING India
  if (
    /\b(us only|usa only|u\.s\. only|must reside in the us|united states only|americas only|emea only|uk only|canada only|eu only)\b/i.test(
      combined
    )
  ) {
    return {
      isIndiaEligible: false,
      reason: "Geographic restriction excludes India (e.g. US/UK/EMEA only)",
    };
  }

  // 3. Worldwide / Anywhere remote
  if (
    /\b(worldwide|anywhere|global remote|work from anywhere|any location|all regions)\b/i.test(
      loc
    ) ||
    /\b(hire anywhere|work from anywhere in the world|distributed globally)\b/i.test(
      desc
    )
  ) {
    return {
      isIndiaEligible: true,
      reason: "Worldwide / Global remote hiring allows India-based candidates",
    };
  }

  // 4. Remote mentions India specifically
  if (/\b(india remote|remote india|remote - india)\b/i.test(combined)) {
    return {
      isIndiaEligible: true,
      reason: "Explicitly designated as India Remote",
    };
  }

  // 5. Generic Remote without worldwide confirmation
  if (
    remoteType === "REMOTE" ||
    /\b(remote|wfh|work from home)\b/i.test(loc)
  ) {
    return {
      isIndiaEligible: false,
      reason: "Generic remote without confirmed worldwide/India hiring eligibility",
    };
  }

  // 6. Non-India Onsite / Hybrid
  return {
    isIndiaEligible: false,
    reason: `Onsite / Hybrid position outside India (${locationStr})`,
  };
}

export function formatNormalizedLocation(loc: NormalizedLocation): string {
  switch (loc) {
    case "HYDERABAD":
      return "Hyderabad";
    case "BANGALORE":
      return "Bangalore";
    case "PUNE":
      return "Pune";
    case "CHENNAI":
      return "Chennai";
    case "MUMBAI":
      return "Mumbai";
    case "DELHI_NCR":
      return "Delhi NCR";
    case "INDIA_OTHER":
      return "India (Other)";
    case "REMOTE_INDIA":
      return "Remote (India)";
    case "REMOTE_GLOBAL":
      return "Remote (Global)";
    case "MULTI_REGION":
      return "Multi-Region";
    case "USA":
      return "USA";
    case "EUROPE":
      return "Europe";
    case "MIDDLE_EAST":
      return "Middle East";
    case "SINGAPORE":
      return "Singapore";
    case "OTHER":
      return "Other Location";
    case "UNKNOWN":
      return "Unknown";
  }
}
