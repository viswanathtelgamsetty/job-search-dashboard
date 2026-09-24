import type { JobMatchDetails, RemoteType, SearchProfile, TravelType } from "@/types";
import { matchesSalaryRequirement } from "./salaryParser";

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
    // If multiple words, check if key words match
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
    /\b(tech lead|technical lead|architect|lead engineer|principal|consultant|solutions engineer)\b/i.test(
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
    // Show top matched technologies
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
    /\b(10\+|12\+|10-15|12-16|senior lead|lead|architect|principal)\b/i.test(fullText)
  ) {
    experienceMatch = true;
    reasons.push(`✓ Senior Lead / Architect seniority level`);
  } else {
    // Default acceptable for lead roles
    experienceMatch = true;
    reasons.push(`✓ Experienced level matching 12+ yrs profile`);
  }

  // 4. Location & Remote Match
  let locationMatch = false;
  const isHyd = /\b(hyderabad|telangana)\b/i.test(job.location);
  const isIndia = /\b(india|bengaluru|bangalore|pune|gurgaon|noida|delhi|mumbai|chennai)\b/i.test(
    job.location
  );
  const isRemote = job.remoteType === "REMOTE" || /\b(remote|work from home|wfh)\b/i.test(job.location);

  if (isHyd) {
    locationMatch = true;
    reasons.push(`✓ Hyderabad Location`);
  } else if (isRemote && (isIndia || /\b(anywhere|worldwide|global|india)\b/i.test(fullText))) {
    locationMatch = true;
    reasons.push(`✓ Remote from India`);
  } else if (isIndia) {
    locationMatch = true;
    reasons.push(`✓ India (${job.location})`);
  } else if (isRemote) {
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

  // 6. Travel Match (International & Client-Site)
  let travelMatch = false;
  const tType = job.travelType || "UNKNOWN";
  if (tType === "INTERNATIONAL") {
    travelMatch = true;
    const dest =
      job.travelDestinations && job.travelDestinations.length > 0
        ? ` (${job.travelDestinations.join(", ")})`
        : "";
    const pct = job.travelPercentage ? ` [${job.travelPercentage}%]` : "";
    reasons.push(`✓ International Travel${dest}${pct}`);
  } else if (tType === "CLIENT_SITE") {
    travelMatch = true;
    reasons.push(
      `✓ Client-Site Travel${job.travelPercentage ? ` (${job.travelPercentage}%)` : ""}`
    );
  } else if (tType === "OCCASIONAL") {
    travelMatch = true;
    reasons.push("✓ Occasional Project Travel");
  } else if (tType === "RELOCATION") {
    travelMatch = true;
    reasons.push("✓ Relocation / International Mobility");
  }

  // Calculate Deterministic Transparent Score (0 to 100)
  // Weights:
  // Role: 25 pts
  // Tech: 25 pts (distributed per skill up to 4 skills)
  // Location / Remote: 20 pts
  // Salary: 15 pts
  // Travel: 15 pts (bonus if international or client-site)
  let score = 0;
  if (roleMatch) score += 25;
  const techScore = Math.min(25, matchedTech.length * 7);
  score += techScore;
  if (locationMatch) score += 20;
  if (salaryMatch) score += 15;
  if (travelMatch) score += 15;

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
