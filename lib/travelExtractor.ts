import type { TravelDetails, TravelPercentageRange, TravelType } from "@/types";

export function extractTravelDetails(
  text: string,
  hints?: {
    travelType?: TravelType;
    percentage?: number;
    notes?: string;
  }
): TravelDetails {
  if (!text && !hints) {
    return {
      type: "UNKNOWN",
      destinations: [],
      notes: "No travel information mentioned",
    };
  }

  const combined = `${text} ${hints?.notes || ""}`.toLowerCase();

  // Detect Destinations
  const destinations: string[] = [];
  if (/\b(usa|us|united states|america|california|new york)\b/.test(combined)) {
    destinations.push("USA");
  }
  if (/\b(europe|uk|united kingdom|london|germany|netherlands|amsterdam|switzerland|nordics)\b/.test(combined)) {
    destinations.push("Europe");
  }
  if (/\b(middle east|dubai|uae|saudi|qatar|abu dhabi)\b/.test(combined)) {
    destinations.push("Middle East");
  }
  if (/\b(singapore|apac|southeast asia)\b/.test(combined)) {
    destinations.push("Singapore");
  }

  // Detect Travel Percentage
  let percentage: number | undefined = hints?.percentage;
  let percentageRange: TravelPercentageRange | undefined;

  const percentMatch = combined.match(/(\d{1,2})\s*%\s*(?:to\s*(\d{1,2})\s*%)?\s*travel/);
  if (percentMatch) {
    const low = parseInt(percentMatch[1], 10);
    const high = percentMatch[2] ? parseInt(percentMatch[2], 10) : low;
    percentage = high;

    if (high <= 10) {
      percentageRange = "<10%";
    } else if (high <= 20) {
      percentageRange = "10-20%";
    } else if (high <= 30) {
      percentageRange = "20-30%";
    } else {
      percentageRange = "30%+";
    }
  } else if (/\b(10\s*-\s*20%|10%|15%|20%)\b/.test(combined)) {
    percentage = 20;
    percentageRange = "10-20%";
  } else if (/\b(20\s*-\s*30%|25%|30%)\b/.test(combined)) {
    percentage = 25;
    percentageRange = "20-30%";
  }

  // Determine Travel Type
  let type: TravelType = hints?.travelType || "UNKNOWN";

  const isRelocation = /\b(relocation required|relocate to|willing to relocate)\b/.test(combined);
  const isInternational =
    /\b(international travel|travel internationally|global travel|client visits abroad|overseas travel|travel to us|travel to europe|travel to middle east|travel to singapore|frequent international|business trips abroad)\b/.test(
      combined
    ) || destinations.length > 0;

  const isClientSite =
    /\b(client site|client-site|client location|customer site|customer location|onsite at client|onsite workshops|client visits|travel to client)\b/.test(
      combined
    );

  const isOccasional =
    /\b(occasional travel|travel as needed|minimal travel|periodic travel|infrequent travel|some travel required)\b/.test(
      combined
    );

  const isNoTravel =
    /\b(no travel|0% travel|zero travel|no travel required)\b/.test(combined);

  if (isRelocation) {
    type = "RELOCATION";
  } else if (isInternational) {
    type = "INTERNATIONAL";
  } else if (isClientSite) {
    type = "CLIENT_SITE";
  } else if (isOccasional) {
    type = "OCCASIONAL";
  } else if (isNoTravel) {
    type = "NONE";
  } else if (type === "UNKNOWN" && percentage) {
    type = "CLIENT_SITE";
  }

  let notes = hints?.notes;
  if (!notes) {
    if (type === "INTERNATIONAL") {
      notes = destinations.length > 0
        ? `International travel (${percentage ? `${percentage}%` : "project-based"}) to ${destinations.join(", ")}`
        : "International customer & project travel indicated";
    } else if (type === "CLIENT_SITE") {
      notes = `Client-site travel ${percentage ? `(${percentage}%)` : "as required"}`;
    } else if (type === "OCCASIONAL") {
      notes = "Occasional travel for workshops and quarterly team syncs";
    } else if (type === "NONE") {
      notes = "No travel required (100% stationary)";
    }
  }

  return {
    type,
    percentage,
    percentageRange,
    destinations,
    notes,
    rawMention: percentMatch ? percentMatch[0] : undefined,
  };
}
