import type { WorkAuthorization, WorkAuthorizationDetail } from "@/types";

export function classifyWorkAuthorization(
  location?: string,
  description = "",
  isIndiaEligible = false
): WorkAuthorizationDetail {
  const loc = (location || "").toLowerCase();
  const desc = (description || "").toLowerCase();
  const combined = `${loc} ${desc}`;

  // 1. Check for explicit sponsorship available
  const sponsorshipAvailableRegex =
    /\b(visa\s+sponsorship\s+(?:is\s+)?available|sponsorship\s+available|we\s+sponsor\s+visas?|will\s+sponsor\s+visa|eligible\s+for\s+visa\s+sponsorship|relocation\s+and\s+visa\s+support)\b/i;
  const sponsorshipMatch = combined.match(sponsorshipAvailableRegex);
  if (sponsorshipMatch) {
    return {
      authorization: "SPONSORSHIP_AVAILABLE",
      evidence: `Explicit visa sponsorship indicated: "${sponsorshipMatch[0]}"`,
    };
  }

  // 2. Check for Local Work Authorization Required (takes precedence over generic 'no sponsorship')
  const localAuthRegex =
    /\b(must\s+(?:have|hold|possess|be)\s+(?:valid\s+)?[a-z/ -]*(?:work\s+authorization|authorized\s+to\s+work|legal\s+right\s+to\s+work|eligible\s+to\s+work|work\s+permit)|must\s+be\s+authorized\s+to\s+work\s+in|valid\s+[a-z/ -]*(?:work\s+authorization|work\s+permit)|existing\s+right\s+to\s+work|right\s+to\s+work\s+in\s+the\s+(?:uk|us|eu)|valid\s+work\s+permit)\b/i;
  const localAuthMatch = combined.match(localAuthRegex);
  if (localAuthMatch) {
    return {
      authorization: "LOCAL_WORK_AUTH_REQUIRED",
      evidence: `Local work authorization required: "${localAuthMatch[0]}"`,
    };
  }

  // 3. Check for explicit sponsorship NOT available
  const sponsorshipNotAvailableRegex =
    /\b(no\s+visa\s+sponsorship|sponsorship\s+(?:is\s+)?not\s+available|unable\s+to\s+sponsor|not\s+offering\s+sponsorship|cannot\s+sponsor|without\s+need\s+for\s+sponsorship)\b/i;
  const noSponsorshipMatch = combined.match(sponsorshipNotAvailableRegex);
  if (noSponsorshipMatch) {
    return {
      authorization: "SPONSORSHIP_NOT_AVAILABLE",
      evidence: `Visa sponsorship not available: "${noSponsorshipMatch[0]}"`,
    };
  }

  // 4. Check for remote residency restriction
  const remoteRestrictedRegex =
    /\b(must\s+(?:reside|be\s+located|be\s+based)\s+in\s+(?:the\s+)?(?:us|usa|united states|uk|eu|europe|germany|canada)|remote\s+(?:within|in)\s+(?:the\s+)?(?:us|usa|uk|eu|canada)\s+only|us\s+residents?\s+only)\b/i;
  const remoteRestrictedMatch = combined.match(remoteRestrictedRegex);
  if (remoteRestrictedMatch) {
    return {
      authorization: "REMOTE_LOCATION_RESTRICTED",
      evidence: `Remote location restricted to specific country: "${remoteRestrictedMatch[0]}"`,
    };
  }

  // 5. If based in India and verified India eligible
  if (isIndiaEligible) {
    return {
      authorization: "INDIA_ELIGIBLE",
      evidence: "Role is located in or hiring from India",
    };
  }

  // 6. Unknown / Unspecified
  return {
    authorization: "UNKNOWN",
    evidence: "Work authorization requirements not explicitly stated in posting",
  };
}

export function formatWorkAuthorization(auth: WorkAuthorization): string {
  switch (auth) {
    case "INDIA_ELIGIBLE":
      return "India Eligible";
    case "SPONSORSHIP_AVAILABLE":
      return "Visa Sponsorship Available";
    case "SPONSORSHIP_NOT_AVAILABLE":
      return "No Sponsorship";
    case "LOCAL_WORK_AUTH_REQUIRED":
      return "Local Auth Required";
    case "REMOTE_LOCATION_RESTRICTED":
      return "Country Restricted";
    case "UNKNOWN":
      return "Work Auth Unspecified";
  }
}
