import type { TravelDetails, TravelPercentageRange, TravelType } from "@/types";

export function extractTravelDetails(
  text: string,
  hints?: {
    travelType?: TravelType;
    percentage?: number;
    notes?: string;
  }
): TravelDetails {
  const combined = `${text || ""} ${hints?.notes || ""}`.trim();

  if (!combined) {
    return {
      type: "NO_TRAVEL_MENTIONED",
      destinations: [],
      evidence: "No travel mentioned",
      notes: "No travel mentioned",
    };
  }

  // 1. Check for Relocation first
  const relocationRegex =
    /(?:relocation(?:\s+to\s+[^.]+?)?\s+required|relocate\s+to\s+[^.]+|willing\s+to\s+relocate(?:\s+to\s+[^.]+)?)/i;
  const relocationMatch = combined.match(relocationRegex);
  if (relocationMatch) {
    const evidence = extractSentenceOrSnippet(combined, relocationMatch[0]);
    const destinations = extractDestinations(combined);
    return {
      type: "RELOCATION",
      percentage: undefined,
      percentageRange: undefined,
      destinations,
      evidence,
      notes: `Relocation required: ${evidence}`,
    };
  }

  // 2. Check for Travel Percentages
  let percentage: number | undefined = hints?.percentage;
  let percentageRange: TravelPercentageRange | undefined;
  
  // Matches "10-20%", "10 to 20%", "up to 20%", "20% travel", "travel: 20%"
  const rangeMatch = combined.match(/(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s*%/i);
  const singleMatch = combined.match(/(?:up\s+to\s+|approx(?:\.|imately)?\s*|around\s*)?(\d{1,2})\s*%\s*(?:travel)?/i);

  if (rangeMatch) {
    const high = parseInt(rangeMatch[2], 10);
    percentage = high;
    if (high <= 10) percentageRange = "<10%";
    else if (high <= 20) percentageRange = "10-20%";
    else if (high <= 30) percentageRange = "20-30%";
    else percentageRange = "30%+";
  } else if (singleMatch) {
    const p = parseInt(singleMatch[1], 10);
    percentage = p;
    if (p <= 10) percentageRange = "<10%";
    else if (p <= 20) percentageRange = "10-20%";
    else if (p <= 30) percentageRange = "20-30%";
    else percentageRange = "30%+";
  }

  // 3. Check for Explicit Travel Requirements
  // Positive evidence phrases for actual travel:
  const travelPhrases = [
    // Travel to specific regions
    /(?:travel\s+to\s+(?:the\s+)?(?:us|usa|united states|america|europe|singapore|middle east|dubai|uk|london|germany|customer\s+locations?\s+in\s+the\s+us|customer\s+sites?))/i,
    // "travel required", "travel required 10-20%", "travel: 20%"
    /(?:travel\s+required(?:\s*[:\-]?\s*\d{1,2}(?:-\d{1,2})?%)?)/i,
    // "international travel", "travel internationally", "overseas travel", "frequent travel abroad"
    /(?:international\s+travel|travel\s+internationally|overseas\s+travel|business\s+trips?\s+abroad)/i,
    // "periodic client travel", "customer-site travel", "client-site travel"
    /(?:periodic\s+client\s+travel|customer-site\s+travel|client-site\s+travel|travel\s+to\s+client\s+sites?|travel\s+to\s+customer\s+locations?)/i,
    // "X% travel"
    /(?:\d{1,2}\s*%\s*travel|travel\s*(?:up\s+to\s+)?\d{1,2}\s*%)/i,
    // "willing to travel up to X%", "ability to travel up to X%"
    /(?:(?:willing|ability|required)\s+to\s+travel\s*(?:internationally|globally|extensively|up\s+to\s+\d{1,2}%))/i,
  ];

  let travelEvidenceSnippet: string | null = null;
  for (const regex of travelPhrases) {
    const match = combined.match(regex);
    if (match) {
      travelEvidenceSnippet = extractSentenceOrSnippet(combined, match[0]);
      break;
    }
  }

  // 4. If actual travel evidence is found:
  if (travelEvidenceSnippet) {
    const destinations = extractDestinations(combined);
    const isInternational =
      /(?:international|overseas|abroad|us|usa|united states|america|europe|singapore|middle east|dubai|uk|london|germany|switzerland)/i.test(
        travelEvidenceSnippet
      ) || destinations.length > 0;

    const isClientSite =
      /(?:customer|client|on-site|onsite)/i.test(travelEvidenceSnippet) && !isInternational;

    const type: TravelType = isInternational
      ? "INTERNATIONAL_TRAVEL"
      : isClientSite
      ? "CLIENT_SITE_TRAVEL"
      : "INTERNATIONAL_TRAVEL"; // travel with unknown destination defaults to international/client

    return {
      type,
      percentage,
      percentageRange,
      destinations,
      evidence: travelEvidenceSnippet,
      notes: travelEvidenceSnippet,
      rawMention: rangeMatch ? rangeMatch[0] : singleMatch ? singleMatch[0] : undefined,
    };
  }

  // 5. Check for INTERNATIONAL_TEAM_ONLY
  // These indicate team / stakeholder collaboration without travel:
  const teamOnlyPhrases = [
    /(?:work\s+with|collaborat(?:e|ing)\s+with|partner\s+with|interface\s+with)\s+(?:the\s+)?(?:us|usa|american|european|uk|global|international|cross-border)(?:-based)?\s+(?:engineering\s+)?(?:teams?|stakeholders?|leadership|organization)/i,
    /(?:us|usa|american|european|uk|global|international)(?:-based)?\s+(?:engineering\s+)?(?:teams?|stakeholders?|organization|peers|colleagues)/i,
    /(?:global\s+stakeholders\s+across\s+europe|global\s+stakeholders|us\s+stakeholders)/i,
    /(?:global\s+organization|international\s+organization|multinational\s+team)/i,
    /(?:collaborate\s+with\s+us|work\s+with\s+european\s+teams)/i,
  ];

  for (const regex of teamOnlyPhrases) {
    const match = combined.match(regex);
    if (match) {
      const snippet = extractSentenceOrSnippet(combined, match[0]);
      return {
        type: "INTERNATIONAL_TEAM_ONLY",
        percentage: undefined,
        percentageRange: undefined,
        destinations: extractDestinations(snippet),
        evidence: snippet,
        notes: `Global team collaboration (No travel required): "${snippet}"`,
      };
    }
  }

  // 6. Check for Remote Global / Remote Anywhere
  if (
    /(?:work\s+from\s+anywhere|remote\s+worldwide|anywhere\s+in\s+the\s+world|global\s+remote\s+role)/i.test(
      combined
    )
  ) {
    return {
      type: "REMOTE_GLOBAL",
      percentage: undefined,
      percentageRange: undefined,
      destinations: [],
      evidence: "Worldwide Remote / Work from anywhere",
      notes: "Remote anywhere in the world (Stationary remote)",
    };
  }

  // 7. Explicit "No travel mentioned" or no travel detected
  return {
    type: "NO_TRAVEL_MENTIONED",
    percentage: undefined,
    percentageRange: undefined,
    destinations: [],
    evidence: "No travel mentioned",
    notes: "No travel mentioned in job specification",
  };
}

function extractSentenceOrSnippet(fullText: string, targetPhrase: string): string {
  // Find index of targetPhrase
  const idx = fullText.toLowerCase().indexOf(targetPhrase.toLowerCase());
  if (idx === -1) return targetPhrase;

  // Look backwards for start of sentence or line
  let start = idx;
  while (start > 0 && !/[.!?\n]/.test(fullText[start - 1]) && idx - start < 60) {
    start--;
  }

  // Look forwards for end of sentence or line
  let end = idx + targetPhrase.length;
  while (end < fullText.length && !/[.!?\n]/.test(fullText[end]) && end - idx < 120) {
    end++;
  }

  const snippet = fullText.slice(start, end).trim();
  // Strip trailing punctuation like comma or semicolon, but preserve % and quotes
  return snippet.replace(/^[\s,;:]+|[\s,;:]+$/g, "");
}

function extractDestinations(text: string): string[] {
  const destinations: string[] = [];
  const t = text.toLowerCase();

  if (/\b(usa|us|united states|america|california|new york)\b/.test(t)) {
    destinations.push("USA");
  }
  if (/\b(europe|uk|united kingdom|london|germany|netherlands|amsterdam|switzerland)\b/.test(t)) {
    destinations.push("Europe");
  }
  if (/\b(middle east|dubai|uae|saudi|qatar|abu dhabi)\b/.test(t)) {
    destinations.push("Middle East");
  }
  if (/\b(singapore|apac)\b/.test(t)) {
    destinations.push("Singapore");
  }

  return destinations;
}
