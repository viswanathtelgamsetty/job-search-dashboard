import type { NormalizedLocation, RemoteType } from "@/types";

export function classifyLocation(
  locationStr: string,
  remoteType?: RemoteType
): NormalizedLocation {
  const loc = (locationStr || "").toLowerCase().trim();

  // 1. Check for specific Indian Tech Metro Cities FIRST
  if (/\b(hyderabad|secunderabad|telangana|hitec\s*city|gachibowli|madhapur|financial\s*district)\b/i.test(loc)) {
    return "HYDERABAD";
  }

  if (/\b(bangalore|bengaluru|karnataka|whitefield|electronic\s*city|bellandur)\b/i.test(loc)) {
    return "BANGALORE";
  }

  if (/\b(pune|hinjewadi|magarpatta|baner)\b/i.test(loc)) {
    return "PUNE";
  }

  if (/\b(chennai|tamil\s*nadu|madras|omr|siruseri)\b/i.test(loc)) {
    return "CHENNAI";
  }

  if (/\b(mumbai|bombay|navi\s*mumbai|thane)\b/i.test(loc)) {
    return "MUMBAI";
  }

  if (/\b(delhi|gurgaon|gurugram|noida|greater\s*noida|faridabad|ncr)\b/i.test(loc)) {
    return "DELHI_NCR";
  }

  // 2. India Remote vs Remote Global vs India Other
  const isIndia = /\b(india|in)\b/i.test(loc);
  const isRemote =
    remoteType === "REMOTE" ||
    /\b(remote|wfh|work from home|anywhere)\b/i.test(loc);

  if (isIndia && isRemote) {
    return "REMOTE_INDIA";
  }

  if (isIndia) {
    return "INDIA_OTHER";
  }

  // 3. Remote Global / Worldwide
  if (
    /\b(anywhere|worldwide|global|all regions|international remote|remote - global|any location|global remote)\b/i.test(
      loc
    )
  ) {
    return "REMOTE_GLOBAL";
  }

  // 4. International Geographies
  if (/\b(singapore)\b/i.test(loc)) {
    return "SINGAPORE";
  }

  if (/\b(dubai|uae|united arab emirates|saudi|riyadh|qatar|doha|middle east|bahrain)\b/i.test(loc)) {
    return "MIDDLE_EAST";
  }

  if (
    /\b(usa|united states|u\.s\.|america|new york|california|san francisco|austin|seattle|chicago|boston)\b/i.test(
      loc
    )
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

  // If remote with unknown geographic restriction, treat as REMOTE_GLOBAL
  if (isRemote) {
    return "REMOTE_GLOBAL";
  }

  return "OTHER";
}
