import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const questionsRef = adminDb.collection("questions");
    const snapshot = await questionsRef.get();

    const languages = new Set<string>();

    snapshot.docs.forEach((doc) => {
      const question = doc.data();
      if (question.language && question.language !== "en") {
        languages.add(question.language);
      }
    });

    // Convert language codes to display names
    const languageMap: Record<string, string> = {
      spanish: "Spanish (Español)",
      french: "French (Français)",
      arabic: "Arabic (العربية)",
      polish: "Polish (Polski)",
      portuguese: "Portuguese (Português)",
      urdu: "Urdu (اردو)",
      bengali: "Bengali (বাংলা)",
      punjabi: "Punjabi (ਪੰਜਾਬੀ)",
      turkish: "Turkish (Türkçe)",
      somali: "Somali (Soomaali)",
    };

    const availableLanguages = Array.from(languages)
      .map((code) => ({
        code,
        name: languageMap[code] || code.charAt(0).toUpperCase() + code.slice(1),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ languages: availableLanguages });
  } catch (error) {
    console.error("Error fetching available languages:", error);
    return NextResponse.json(
      { error: "Failed to fetch available languages" },
      { status: 500 }
    );
  }
}
