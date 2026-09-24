import type { JobMatchDetails, RemoteType, SearchProfile, TravelType } from "@/types";
import { matchesSalaryRequirement } from "./salaryParser";
import { classifyLocation } from "./locationClassifier";

interface JobForMatch {
  title: string;
  company: string;
  location: string;
  remoteType: RemoteType;
  skills: string[];
  roleFamily?: string;
  experienceMin?: number;
  experienceMax?: number;
  salaryLpaMin?: number;
  salaryDisclosed?: boolean;
  travelType?: TravelType;
  travelPercentage?: number;
  travelDestinations?: string[];
  description?: string;
}

export function evaluateJobMatch(
  job: JobForMatch,
  profile: SearchProfile
): JobMatchDetails {
  const reasons: string[] = [];
  const missingOrNeutral: string[] = [];
  const fullText = `${job.title} ${job.company} ${job.location} ${job.skills.join(" ")} ${job.roleFamily || ""} ${job.description || ""}`.toLowerCase();

  // 1. Role / Seniority Match
  let roleMatch = false;
  const matchedRole = profile.targetRoleFamilies.find((role) => {
    const roleTokens = role.toLowerCase().split(/\s+/);
    if (roleTokens.length > 1) {
      const coreKeywords = roleTokens.filter(
        (t) => !["senior", "associate", "level", "/", "the"].includes(t)
      );
      return coreKeywords.every((kw) => fullText.includes(kw));
    }
    return fullText.includes(role.toLowerCase());
  });

  if (matchedRole) {
    roleMatch = true;
    reasons.push(`✓ Role: ${matchedRole}`);
  } else if (
    /\b(tech lead|technical lead|architect|lead engineer|principal|consultant|solutions engineer|advisor|builder)\b/i.test(
      job.title
    )
  ) {
    roleMatch = true;
    reasons.push(`✓ Senior Level: ${job.title}`);
  } else {
    missingOrNeutral.push("Title does not explicitly mention Lead/Architect role family");
  }

  // 2. Technology & Skills Match
  const matchedTech: string[] = [];
  profile.targetSkills.forEach((skill) => {
    const skillNorm = skill.toLowerCase();
    const hasSkillTag = job.skills.some((s) => s.toLowerCase() === skillNorm);
    const regex = new RegExp(`\\b${skillNorm.replace(/[.+*?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (hasSkillTag || regex.test(fullText)) {
      matchedTech.push(skill);
    }
  });

  const techStackMatch = matchedTech.length > 0;
  if (techStackMatch) {
    matchedTech.slice(0, 4).forEach((tech) => {
      reasons.push(`✓ ${tech}`);
    });
  } else {
    missingOrNeutral.push("No core technologies explicitly matched");
  }

  // 3. Experience Match (12+ years / Senior Lead)
  let experienceMatch = false;
  if (job.experienceMin !== undefined && job.experienceMin !== null) {
    if (job.experienceMin <= profile.experienceYears) {
      experienceMatch = true;
      reasons.push(
        `✓ ${job.experienceMin}${job.experienceMax ? `–${job.experienceMax}` : "+"} yrs exp (matches ${profile.experienceYears}+ yrs)`
      );
    } else {
      missingOrNeutral.push(
        `Requires ${job.experienceMin}+ yrs experience (Profile: ${profile.experienceYears} yrs)`
      );
    }
  } else if (
    /\b(10\+|12\+|10-15|12-16|senior lead|lead|architect|principal|staff|director)\b/i.test(fullText)
  ) {
    experienceMatch = true;
    reasons.push(`✓ Senior Lead / Architect seniority level`);
  } else {
    experienceMatch = true;
    reasons.push(`✓ Experienced level matching 12+ yrs profile`);
  }

  // 4. Location Classification & Match
  let locationMatch = false;
  const normLoc = classifyLocation(job.location, job.remoteType);

  if (normLoc === "HYDERABAD") {
    locationMatch = true;
    reasons.push(`✓ Hyderabad Location (Target City)`);
  } else if (normLoc === "REMOTE_INDIA") {
    locationMatch = true;
    reasons.push(`✓ Remote from India`);
  } else if (["BANGALORE", "PUNE", "CHENNAI", "MUMBAI", "DELHI_NCR", "INDIA_OTHER"].includes(normLoc)) {
    locationMatch = true;
    reasons.push(`✓ India (${job.location})`);
  } else if (normLoc === "REMOTE_GLOBAL") {
    locationMatch = true;
    reasons.push(`✓ International Remote Opportunity`);
  } else {
    missingOrNeutral.push(`Location: ${job.location}`);
  }

  // 5. Compensation / Salary Match
  let salaryMatch = false;
  const salaryCheck = matchesSalaryRequirement(
    job.salaryLpaMin,
    job.salaryDisclosed,
    profile.minSalaryLpa
  );
  if (salaryCheck.matches) {
    salaryMatch = true;
    if (job.salaryDisclosed && job.salaryLpaMin) {
      reasons.push(`✓ ₹${job.salaryLpaMin}L+ (Target: ₹${profile.minSalaryLpa}L+)`);
    } else {
      reasons.push(`✓ Disclosed Salary or Competitive Open Budget`);
    }
  } else {
    missingOrNeutral.push(salaryCheck.reason);
  }

  // 6. Travel Match using Corrected Travel Categories
  let travelMatch = false;
  const tType = job.travelType || "UNKNOWN";
  const pctStr = job.travelPercentage ? ` [${job.travelPercentage}%]` : "";
  const destStr =
    job.travelDestinations && job.travelDestinations.length > 0
      ? ` (${job.travelDestinations.join(", ")})`
      : "";

  if (tType === "INTERNATIONAL_TRAVEL") {
    travelMatch = true;
    reasons.push(`✓ International Travel${destStr}${pctStr}`);
  } else if (tType === "CLIENT_SITE_TRAVEL") {
    travelMatch = true;
    reasons.push(`✓ Client-Site Travel${pctStr}`);
  } else if (tType === "INTERNATIONAL_TEAM_ONLY") {
    travelMatch = true;
    reasons.push(`✓ International Team & Stakeholder Collaboration`);
  } else if (tType === "RELOCATION") {
    travelMatch = true;
    reasons.push(`✓ Relocation / International Mobility${destStr}`);
  } else if (tType === "REMOTE_GLOBAL") {
    travelMatch = true;
    reasons.push(`✓ Global Remote Interaction`);
  }

  // Calculate Deterministic Transparent Score (0 to 100)
  let score = 0;
  if (roleMatch) score += 25;
  const techScore = Math.min(25, matchedTech.length * 7);
  score += techScore;
  if (locationMatch) score += 20;
  if (salaryMatch) score += 15;
  if (travelMatch) {
    if (tType === "INTERNATIONAL_TRAVEL") score += 15;
    else if (tType === "CLIENT_SITE_TRAVEL") score += 12;
    else if (tType === "INTERNATIONAL_TEAM_ONLY") score += 8;
    else score += 5;
  }

  return {
    overallScore: Math.min(100, Math.max(10, score)),
    reasons,
    missingOrNeutral,
    breakdown: {
      roleMatch,
      techStackMatch,
      experienceMatch,
      locationMatch,
      salaryMatch,
      travelMatch,
    },
  };
}
