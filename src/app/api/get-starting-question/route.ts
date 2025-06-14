import { NextRequest, NextResponse } from "next/server";
import { getStartingQuestion } from "@/lib/adaptive";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { language } = body;

    if (!language) {
      return NextResponse.json({ error: "Invalid language" }, { status: 400 });
    }

    const question = await getStartingQuestion(language);

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error getting starting question:", error);
    return NextResponse.json(
      { error: "Failed to get starting question" },
      { status: 500 }
    );
  }
}
