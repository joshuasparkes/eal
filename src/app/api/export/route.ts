import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { Student, Attempt } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");

    if (!code) {
      return NextResponse.json(
        { error: "Session code required" },
        { status: 400 }
      );
    }

    const studentsSnapshot = await adminDb.collection("students").get();
    const csvRows = [
      "Name,Year Group,Home Language,English Score,L1 Score,Gap,Colour Band,Summary",
    ];

    for (const studentDoc of studentsSnapshot.docs) {
      const student = { id: studentDoc.id, ...studentDoc.data() } as Student;

      const attemptsSnapshot = await adminDb
        .collection("students")
        .doc(studentDoc.id)
        .collection("attempts")
        .where("sessionCode", "==", code)
        .where("completed", "!=", null)
        .get();

      for (const attemptDoc of attemptsSnapshot.docs) {
        const attempt = { id: attemptDoc.id, ...attemptDoc.data() } as Attempt;

        const row = [
          `"${student.name}"`,
          `"${student.yearGroup}"`,
          `"${student.homeLanguage}"`,
          attempt.englishScore?.toString() || "0",
          attempt.l1Score?.toString() || "0",
          attempt.gap?.toString() || "0",
          `"${attempt.colourBand || "unknown"}"`,
          `"${attempt.summary || ""}"`,
        ].join(",");

        csvRows.push(row);
      }
    }

    const csvContent = csvRows.join("\n");

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="session-${code}-results.csv"`,
      },
    });
  } catch (error) {
    console.error("Error exporting data:", error);
    return NextResponse.json(
      { error: "Failed to export data" },
      { status: 500 }
    );
  }
}
