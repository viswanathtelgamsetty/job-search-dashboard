import type {
  ClientFacingDetail,
  InternationalExposure,
  InternationalExposureDetail,
  TravelDetails,
} from "@/types";

export function classifyInternationalExposure(
  text: string,
  travel?: TravelDetails
): InternationalExposureDetail {
  const t = (text || "").toLowerCase();

  // 1. Check for Relocation first
  if (
    travel?.type === "RELOCATION" ||
    /\b(relocation(?:\s+to\s+[^.]+?)?\s+required|relocate\s+to\s+[^.]+|willing\s+to\s+relocate)\b/i.test(t)
  ) {
    const evidence = travel?.evidence || "Relocation required";
    return {
      exposure: "RELOCATION",
      evidence: `Relocation required: "${evidence}"`,
    };
  }

  // 2. Check for Client-Site Travel (Highest value international exposure)
  const clientSiteTravelRegex =
    /\b(travel\s+(?:up\s+to\s+\d{1,2}%\s+)?to\s+(?:customer|client)\s+(?:sites?|locations?)|customer-site\s+travel|client-site\s+travel|travel\s+to\s+customer\s+sites?|travel\s+\d{1,2}%\s+to\s+customer\s+sites?)\b/i;
  const clientSiteMatch = t.match(clientSiteTravelRegex);
  if (clientSiteMatch || travel?.type === "CLIENT_SITE_TRAVEL") {
    const snippet = clientSiteMatch ? clientSiteMatch[0] : travel?.evidence || "Client-site travel";
    return {
      exposure: "CLIENT_SITE_TRAVEL",
      evidence: `Client-site travel: "${snippet}"`,
    };
  }

  // 3. Check for International Travel
  const intlTravelRegex =
    /\b(international\s+travel|travel\s+internationally|overseas\s+travel|travel\s+(?:abroad|to\s+us|to\s+europe|to\s+emea|to\s+middle\s+east)|willingness\s+to\s+travel\s+internationally|travel\s+up\s+to\s+\d{1,2}%\s+(?:internationally)?)\b/i;
  const intlTravelMatch = t.match(intlTravelRegex);
  if (intlTravelMatch || travel?.type === "INTERNATIONAL_TRAVEL") {
    const snippet = intlTravelMatch ? intlTravelMatch[0] : travel?.evidence || "International travel";
    return {
      exposure: "INTERNATIONAL_TRAVEL",
      evidence: `International travel required: "${snippet}"`,
    };
  }

  // 4. Check for International Customers (Direct external client engagement across borders)
  const intlCustomersRegex =
    /\b((?:work(?:ing)?\s+(?:directly\s+|closely\s+)?with|support(?:ing)?|partner(?:ing)?\s+with|advise|advising|serve|serving|deliver(?:ing)?\s+to|engag(?:e|ing)\s+with)\s+(?:enterprise\s+)?(?:customers?|clients?)\s+(?:across|in)\s+(?:emea|europe|middle\s+east|the\s+us|usa|globally|international(?:ly)?)|(?:emea|european|global|international)\s+(?:customers?|clients?|client\s+base|customer\s+base)|client-facing\s+role\s+across\s+emea|work(?:ing)?\s+(?:directly\s+|closely\s+)?with\s+emea\s+customers)\b/i;
  const intlCustMatch = t.match(intlCustomersRegex);
  if (intlCustMatch) {
    return {
      exposure: "INTERNATIONAL_CUSTOMERS",
      evidence: `International customer engagement: "${intlCustMatch[0]}"`,
    };
  }

  // 5. Check for International Team (Internal cross-border team collaboration)
  const intlTeamRegex =
    /\b((?:work|collaborat(?:e|ing)|partner|interface)\s+with\s+(?:distributed\s+|remote\s+|cross-functional\s+)?(?:engineering\s+)?teams?\s+in\s+(?:the\s+)?(?:us|usa|europe|uk|germany|globally)|(?:us|european|uk|global|cross-border)\s+(?:-based\s+)?(?:engineering\s+)?teams?|global\s+stakeholders\s+across\s+europe|collaborate\s+with\s+(?:distributed\s+|remote\s+)?teams?\s+in\s+europe|work\s+with\s+us-based\s+engineering\s+team)\b/i;
  const intlTeamMatch = t.match(intlTeamRegex);
  if (intlTeamMatch || travel?.type === "INTERNATIONAL_TEAM_ONLY") {
    const snippet = intlTeamMatch ? intlTeamMatch[0] : travel?.evidence || "International team collaboration";
    return {
      exposure: "INTERNATIONAL_TEAM",
      evidence: `International team collaboration: "${snippet}"`,
    };
  }

  // Notice: phrases like "global company" or "company has offices worldwide"
  // MUST NOT trigger international exposure.
  return {
    exposure: "NONE_MENTIONED",
    evidence: "No direct international team, customer, or travel evidence found",
  };
}

export function classifyClientFacing(
  text: string,
  title = ""
): ClientFacingDetail {
  const combined = `${title} ${text}`.toLowerCase();

  // Strong client-facing evidence phrases
  const strongPhrases = [
    /\bcustomer-facing\b/i,
    /\bclient-facing\b/i,
    /\bcustomer\s+workshops?\b/i,
    /\bclient\s+workshops?\b/i,
    /\btechnical\s+discovery\b/i,
    /\bcustomer\s+architecture\b/i,
    /\bsolution\s+consulting\b/i,
    /\bsolutions?\s+consultant\b/i,
    /\bimplementation\s+consultant\b/i,
    /\bprofessional\s+services\b/i,
    /\bpre-sales\b/i,
    /\bpresales\b/i,
    /\bcustomer\s+engineering\b/i,
    /\benterprise\s+customer\s+engagement\b/i,
    /\bpartner\s+enablement\b/i,
    /\bclient\s+advisory\b/i,
    /\btechnical\s+consultant\b/i,
    /\b(?:work(?:ing)?|engag(?:e|ing)|partner(?:ing)?)\s+(?:directly\s+|closely\s+)?with\s+(?:enterprise\s+)?(?:customers?|clients?)\b/i,
  ];

  for (const phrase of strongPhrases) {
    const match = combined.match(phrase);
    if (match) {
      return {
        status: "YES",
        evidence: `Direct client/customer interaction identified: "${match[0]}"`,
      };
    }
  }

  // Negative phrases (purely internal roles)
  if (
    /\b(purely\s+internal|internal\s+tools?\s+only|no\s+client\s+interaction|back-office|strictly\s+internal)\b/i.test(
      combined
    )
  ) {
    return {
      status: "NO",
      evidence: "Posting specifies internal-only responsibilities",
    };
  }

  return {
    status: "UNKNOWN",
    evidence: "No explicit client-facing or internal-only evidence identified",
  };
}

export function formatInternationalExposure(exp: InternationalExposure): string {
  switch (exp) {
    case "CLIENT_SITE_TRAVEL":
      return "Client-Site Travel";
    case "INTERNATIONAL_TRAVEL":
      return "International Travel";
    case "INTERNATIONAL_CUSTOMERS":
      return "International Customers";
    case "INTERNATIONAL_TEAM":
      return "International Team";
    case "RELOCATION":
      return "Relocation";
    case "NONE_MENTIONED":
      return "No International Exposure";
    case "UNKNOWN":
      return "Exposure Unknown";
  }
}
