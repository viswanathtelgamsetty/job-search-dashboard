import { NextResponse } from "next/server";
import { demoSeedJobs } from "@/lib/demoData";
import { evaluateJobMatch } from "@/lib/matchingEngine";
import { extractTravelDetails } from "@/lib/travelExtractor";
import { parseAndNormalizeSalary } from "@/lib/salaryParser";
import { defaultSearchProfile } from "@/config/defaultProfile";
import { classifyLocation, checkIndiaEligibility } from "@/lib/locationClassifier";
import { classifyRoleFamily } from "@/lib/roleClassifier";
import { detectSeniority } from "@/lib/seniorityDetector";
import { extractActualJobTechnologies } from "@/lib/technologyMatcher";
import { calculateJobFreshness } from "@/lib/jobQuality";
import type { Job } from "@/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.toLowerCase();

  let jobs = demoSeedJobs;

  if (search) {
    jobs = jobs.filter(
      (j) =>
        j.title.toLowerCase().includes(search) ||
        j.company.toLowerCase().includes(search) ||
        j.skills.some((s) => s.toLowerCase().includes(search))
    );
  }

  return NextResponse.json({
    success: true,
    count: jobs.length,
    jobs,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const title = body.title || "Untitled Role";
    const company = body.company || "Unknown Company";
    const location = body.location || "India / Remote";

    const parsedSalary = parseAndNormalizeSalary(
      body.salaryText,
      body.salaryMin,
      body.salaryMax,
      body.currency || "INR"
    );

    const travel = extractTravelDetails(`${title} ${location} ${body.notes || ""}`, {
      travelType: body.travelType,
      percentage: body.travelPercentage,
      notes: body.travelNotes,
    });

    const roleClassification = classifyRoleFamily(title, body.description);
    const seniorityResult = detectSeniority(title, body.description, body.experienceMin, body.experienceMax);
    const actualTechnologies = extractActualJobTechnologies(body.skills || [], `${title} ${body.description || ""}`);
    const indiaCheck = checkIndiaEligibility(location, body.remoteType, body.description);
    const freshness = calculateJobFreshness(undefined, new Date().toISOString());

    const match = evaluateJobMatch(
      {
        title,
        company,
        location,
        remoteType: body.remoteType || "REMOTE",
        skills: actualTechnologies,
        roleFamily: roleClassification.primary,
        seniority: seniorityResult.level,
        experienceMin: seniorityResult.experienceMin,
        experienceMax: seniorityResult.experienceMax,
        salaryLpaMin: parsedSalary.lpaMin,
        salaryDisclosed: parsedSalary.isDisclosed,
        travelType: travel.type,
        travelPercentage: travel.percentage,
        travelDestinations: travel.destinations,
        travelEvidence: travel.evidence,
        description: body.description,
      },
      defaultSearchProfile
    );

    const matchedTargets = match.breakdown.technologyMatch.details
      ? match.breakdown.technologyMatch.details
          .filter((d) => d.matched)
          .map((d) => d.technology)
      : [];

    const newJob: Job = {
      id: `manual-${Date.now()}`,
      title,
      normalizedTitle: title.toLowerCase().replace(/[^a-z0-9]/g, ""),
      company,
      normalizedCompany: company.toLowerCase().replace(/[^a-z0-9]/g, ""),
      location,
      rawLocation: location,
      normalizedLocation: classifyLocation(location, body.remoteType),
      remoteType: body.remoteType || "REMOTE",
      isIndiaEligible: indiaCheck.isIndiaEligible,
      indiaEligibilityReason: indiaCheck.reason,
      salaryState: parsedSalary.salaryState,
      salaryMin: parsedSalary.min,
      salaryMax: parsedSalary.max,
      currency: parsedSalary.currency,
      salaryLpaMin: parsedSalary.lpaMin,
      salaryLpaMax: parsedSalary.lpaMax,
      salaryDisclosed: parsedSalary.isDisclosed,
      originalSalary: parsedSalary.originalSalary,
      originalCurrency: parsedSalary.originalCurrency,
      convertedSalary: parsedSalary.convertedSalary,
      isSalaryEstimated: parsedSalary.isEstimated,
      seniority: seniorityResult.level,
      seniorityEvidence: seniorityResult.evidence,
      experienceMin: seniorityResult.experienceMin || 10,
      experienceMax: seniorityResult.experienceMax || 15,
      skills: actualTechnologies,
      actualJobTechnologies: actualTechnologies,
      matchedTargetTechnologies: matchedTargets,
      technologyMatchDetails: match.breakdown.technologyMatch.details || [],
      roleFamily: roleClassification.primary,
      secondaryRoleFamilies: roleClassification.secondary,
      domains: match.domainMatches.filter((d) => d.matched && d.domain !== "OTHER").map((d) => d.domain),
      domainMatches: match.domainMatches,
      careerFit: match.careerFit,
      travel,
      description: body.description || "Manually captured opportunity",
      source: body.source || "Manual Entry",
      sourceTitle: title,
      sourceLocation: location,
      sourceDescription: body.description,
      sourceSkills: body.skills || [],
      sourceSalary: body.salaryText,
      url: body.url || "#",
      discoveredAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      freshness: freshness.freshness,
      postedDaysAgo: freshness.daysAgo,
      status: body.status || "SAVED",
      isDemo: false,
      match,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, job: newJob });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to create job",
      },
      { status: 500 }
    );
  }
}
