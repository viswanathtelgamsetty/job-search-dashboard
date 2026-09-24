import { NextResponse } from "next/server";
import { demoSeedJobs } from "@/lib/demoData";
import { evaluateJobMatch } from "@/lib/matchingEngine";
import { extractTravelDetails } from "@/lib/travelExtractor";
import { parseAndNormalizeSalary } from "@/lib/salaryParser";
import { defaultSearchProfile } from "@/config/defaultProfile";
import { classifyLocation } from "@/lib/locationClassifier";
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

    const match = evaluateJobMatch(
      {
        title,
        company,
        location,
        remoteType: body.remoteType || "REMOTE",
        skills: body.skills || ["React", "TypeScript"],
        roleFamily: body.roleFamily || "Senior Technical Lead",
        experienceMin: body.experienceMin || 10,
        experienceMax: body.experienceMax || 15,
        salaryLpaMin: parsedSalary.lpaMin,
        salaryDisclosed: parsedSalary.isDisclosed,
        travelType: travel.type,
        travelPercentage: travel.percentage,
        travelDestinations: travel.destinations,
        description: body.description,
      },
      defaultSearchProfile
    );

    const newJob: Job = {
      id: `manual-${Date.now()}`,
      title,
      normalizedTitle: title.toLowerCase().replace(/[^a-z0-9]/g, ""),
      company,
      normalizedCompany: company.toLowerCase().replace(/[^a-z0-9]/g, ""),
      location,
      normalizedLocation: classifyLocation(location, body.remoteType),
      remoteType: body.remoteType || "REMOTE",
      salaryMin: parsedSalary.min,
      salaryMax: parsedSalary.max,
      currency: parsedSalary.currency,
      salaryLpaMin: parsedSalary.lpaMin,
      salaryLpaMax: parsedSalary.lpaMax,
      salaryDisclosed: parsedSalary.isDisclosed,
      experienceMin: body.experienceMin || 10,
      experienceMax: body.experienceMax || 15,
      skills: body.skills || ["React", "Next.js", "TypeScript"],
      roleFamily: body.roleFamily || "Senior Technical Lead",
      travel,
      description: body.description || "Manually captured opportunity",
      source: body.source || "Manual Entry",
      url: body.url || "#",
      discoveredAt: new Date().toISOString(),
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
