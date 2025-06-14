import { NextRequest, NextResponse } from "next/server";
import { generateSessionCode } from "@/lib/adaptive";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherName } = body;

    const sessionCode = generateSessionCode();

    return NextResponse.json({ sessionCode });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
