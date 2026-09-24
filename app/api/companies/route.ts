import { NextResponse } from "next/server";
import { defaultTargetCompanies } from "@/config/defaultCompanies";
import type { TargetCompany } from "@/types";

export async function GET() {
  return NextResponse.json({
    success: true,
    companies: defaultTargetCompanies,
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const newCompany: TargetCompany = {
      id: `comp-${Date.now()}`,
      name: body.name || "New Company",
      website: body.website || "",
      careersUrl: body.careersUrl || "",
      industry: body.industry || "Technology",
      targetRoleFamilies: body.targetRoleFamilies || ["Technical Lead", "Solutions Architect"],
      internationalPresence: body.internationalPresence || ["USA", "Europe"],
      travelPossibility: body.travelPossibility || "Client-site Travel",
      notes: body.notes || "",
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ success: true, company: newCompany });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to save company",
      },
      { status: 500 }
    );
  }
}
