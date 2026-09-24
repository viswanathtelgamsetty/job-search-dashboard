import { NextResponse } from "next/server";
import { defaultSearchProfile } from "@/config/defaultProfile";

export async function GET() {
  return NextResponse.json({
    success: true,
    profile: defaultSearchProfile,
  });
}

export async function PUT(request: Request) {
  try {
    const updated = await request.json();
    return NextResponse.json({
      success: true,
      profile: { ...defaultSearchProfile, ...updated },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
