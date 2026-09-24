import type { SeniorityLevel } from "@/types";

export interface SeniorityDetectionResult {
  level: SeniorityLevel;
  evidence: string;
  experienceMin?: number;
  experienceMax?: number;
}

export function detectSeniority(
  title: string,
  description = "",
  expMin?: number,
  expMax?: number
): SeniorityDetectionResult {
  const t = (title || "").toLowerCase();
  const d = (description || "").toLowerCase();
  const combined = `${t} ${d}`;

  // 1. Check for explicit years of experience in text if not provided
  let detectedMin = expMin;
  let detectedMax = expMax;

  if (detectedMin === undefined) {
    const rangeMatch = combined.match(
      /(\d{1,2})\s*(?:-|to)\s*(\d{1,2})\s*(?:\+)?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience|\s+exp)?/i
    );
    const minMatch = combined.match(
      /(\d{1,2})\s*\+?\s*(?:years?|yrs?)(?:\s+of)?(?:\s+experience|\s+exp)?/i
    );

    if (rangeMatch) {
      detectedMin = parseInt(rangeMatch[1], 10);
      detectedMax = parseInt(rangeMatch[2], 10);
    } else if (minMatch) {
      detectedMin = parseInt(minMatch[1], 10);
    }
  }

  // 2. Classify Seniority based on Title & Explicit Evidence
  // Priority order: DIRECTOR -> ARCHITECT -> PRINCIPAL -> STAFF -> LEAD -> SENIOR -> ENTRY/MID

  if (/\b(director|vp|vice\s+president|head\s+of)\b/i.test(t)) {
    return {
      level: "DIRECTOR",
      evidence: `Executive / Leadership title: "${title}"`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  if (/\b(architect|chief\s+architect|solutions?\s+architect|technical\s+architect)\b/i.test(t)) {
    const expText = detectedMin ? ` (${detectedMin}+ yrs exp)` : "";
    return {
      level: "ARCHITECT",
      evidence: `Architect title: "${title}"${expText}`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  if (/\b(principal|fellow)\b/i.test(t)) {
    const expText = detectedMin ? ` (${detectedMin}+ yrs exp)` : "";
    return {
      level: "PRINCIPAL",
      evidence: `Principal title: "${title}"${expText}`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  if (/\b(staff)\b/i.test(t)) {
    const expText = detectedMin ? ` (${detectedMin}+ yrs exp)` : "";
    return {
      level: "STAFF",
      evidence: `Staff title: "${title}"${expText}`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  if (/\b(lead|team\s+lead|tech\s+lead|technical\s+lead|leading)\b/i.test(t)) {
    const expText = detectedMin ? ` (${detectedMin}+ yrs exp)` : "";
    return {
      level: "LEAD",
      evidence: `Lead title: "${title}"${expText}`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  if (/\b(senior|sr\.?|sr|lead\s+consultant|managing\s+consultant)\b/i.test(t)) {
    const expText = detectedMin ? ` (${detectedMin}+ yrs exp)` : "";
    return {
      level: "SENIOR",
      evidence: `Senior title: "${title}"${expText}`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  if (/\b(junior|jr\.?|intern|graduate|entry\s+level|trainee|apprentice)\b/i.test(t)) {
    return {
      level: "ENTRY",
      evidence: `Entry-level title: "${title}"`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  // 3. Fallback based on explicit years of experience
  if (detectedMin !== undefined) {
    if (detectedMin >= 12) {
      return {
        level: "ARCHITECT",
        evidence: `${detectedMin}+ years experience requested`,
        experienceMin: detectedMin,
        experienceMax: detectedMax,
      };
    }
    if (detectedMin >= 8) {
      return {
        level: "LEAD",
        evidence: `${detectedMin}+ years experience requested`,
        experienceMin: detectedMin,
        experienceMax: detectedMax,
      };
    }
    if (detectedMin >= 5) {
      return {
        level: "SENIOR",
        evidence: `${detectedMin}+ years experience requested`,
        experienceMin: detectedMin,
        experienceMax: detectedMax,
      };
    }
    if (detectedMin >= 2) {
      return {
        level: "MID",
        evidence: `${detectedMin}+ years experience requested`,
        experienceMin: detectedMin,
        experienceMax: detectedMax,
      };
    }
    return {
      level: "ENTRY",
      evidence: `${detectedMin} years experience requested`,
      experienceMin: detectedMin,
      experienceMax: detectedMax,
    };
  }

  // 4. Check description for strong seniority keywords
  if (/\b(12\+|10\+|15\+)\s*(?:years?|yrs?)\b/i.test(combined)) {
    return {
      level: "LEAD",
      evidence: `Job description requests 10+ years experience`,
      experienceMin: 10,
    };
  }

  if (/\b(senior|experienced|lead)\b/i.test(combined)) {
    return {
      level: "SENIOR",
      evidence: `Description highlights senior-level experience`,
    };
  }

  return {
    level: "UNKNOWN",
    evidence: "Seniority not specified in job title or description",
  };
}

export function formatSeniorityLevel(level: SeniorityLevel): string {
  switch (level) {
    case "DIRECTOR":
      return "Director / VP";
    case "ARCHITECT":
      return "Architect";
    case "PRINCIPAL":
      return "Principal";
    case "STAFF":
      return "Staff";
    case "LEAD":
      return "Lead";
    case "SENIOR":
      return "Senior";
    case "MID":
      return "Mid-Level";
    case "ENTRY":
      return "Entry-Level";
    case "UNKNOWN":
      return "Seniority Unspecified";
  }
}
