import { NextResponse } from "next/server";
import { jobIngestionService } from "@/services/JobIngestionService";
import { defaultSearchProfile } from "@/config/defaultProfile";
import type { Job, SearchProfile } from "@/types";

export async function POST(request: Request) {
  try {
    let body: { profile?: SearchProfile; existingJobs?: Job[] } = {};
    try {
      body = await request.json();
    } catch {
      // Empty or invalid body is acceptable; use defaults
    }

    const profile = body.profile || defaultSearchProfile;
    const existingJobs = body.existingJobs || [];

    const result = await jobIngestionService.runIngestion(profile, existingJobs);

    return NextResponse.json({
      success: true,
      totalDiscovered: result.totalIngested,
      newJobsCount: result.newJobs.length,
      jobs: result.allJobs,
      providers: result.providers,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Job sync API error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to sync jobs from providers",
      },
      { status: 500 }
    );
  }
}
