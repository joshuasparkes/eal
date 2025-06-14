import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacherName } = body;

    const sessionCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Store the session with teacher info
    if (teacherName && teacherName.trim()) {
      await adminDb.collection("sessions").doc(sessionCode).set({
        sessionCode,
        teacherName: teacherName.trim(),
        createdAt: new Date(),
        active: true,
      });
    }

    console.log(
      "Generated session code:",
      sessionCode,
      "for teacher:",
      teacherName
    );

    return NextResponse.json({ sessionCode, teacherName });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
