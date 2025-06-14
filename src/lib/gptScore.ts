import { GPTScoreResponse } from "@/types";

interface QuestionResult {
  difficulty: number;
  correct: boolean;
}

export async function scoreAttempt(
  englishResults: QuestionResult[],
  l1Results: QuestionResult[]
): Promise<GPTScoreResponse> {
  const prompt = `You are a reading-assessment engine. Given arrays of (difficulty, correct/incorrect) for English and L1 language assessments, calculate scores and provide a summary.

English results: ${JSON.stringify(englishResults)}
L1 results: ${JSON.stringify(l1Results)}

Return ONLY valid JSON with:
- englishScore: 0-100 (weighted by difficulty)
- l1Score: 0-100 (weighted by difficulty)  
- summary: <=40 words describing the student's reading gap and strengths

IMPORTANT: Return only the JSON object, no markdown formatting, no code blocks, no extra text.

Example: {"englishScore": 75, "l1Score": 82, "summary": "Strong L1 skills with moderate English gap. Focus on vocabulary building."}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a precise educational assessment tool. Return ONLY valid JSON without any markdown formatting or code blocks.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    // Clean the content to remove potential markdown formatting
    let cleanContent = content.trim();

    // Remove markdown code blocks if present
    if (cleanContent.startsWith("```json")) {
      cleanContent = cleanContent
        .replace(/^```json\s*/, "")
        .replace(/\s*```$/, "");
    } else if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    // Remove any leading/trailing whitespace
    cleanContent = cleanContent.trim();

    console.log("GPT Response (cleaned):", cleanContent);

    const result = JSON.parse(cleanContent) as GPTScoreResponse;

    if (
      typeof result.englishScore !== "number" ||
      typeof result.l1Score !== "number" ||
      typeof result.summary !== "string"
    ) {
      throw new Error("Invalid response format from GPT");
    }

    return result;
  } catch (error) {
    console.error("Error scoring attempt:", error);

    const fallbackEnglishScore = calculateFallbackScore(englishResults);
    const fallbackL1Score = calculateFallbackScore(l1Results);

    return {
      englishScore: fallbackEnglishScore,
      l1Score: fallbackL1Score,
      summary:
        "Assessment completed. Detailed analysis temporarily unavailable.",
    };
  }
}

function calculateFallbackScore(results: QuestionResult[]): number {
  if (results.length === 0) return 0;

  const totalWeight = results.reduce((sum, r) => sum + r.difficulty, 0);
  const correctWeight = results
    .filter((r) => r.correct)
    .reduce((sum, r) => sum + r.difficulty, 0);

  return Math.round((correctWeight / totalWeight) * 100);
}
