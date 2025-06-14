import { Question } from "@/types";
import { adminDb } from "./firebase";

export async function selectNextQuestion(
  prev: Question,
  wasCorrect: boolean
): Promise<Question | null> {
  let target = prev.difficulty + (wasCorrect ? 0.5 : -0.5);
  target = Math.max(1, Math.min(5, target));

  return await getRandomQuestion(prev.language, target);
}

export async function getRandomQuestion(
  language: "en" | "l1",
  targetDifficulty: number
): Promise<Question | null> {
  try {
    const questionsRef = adminDb.collection("questions");
    const snapshot = await questionsRef.where("language", "==", language).get();

    if (snapshot.empty) {
      return null;
    }

    const questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Question[];

    const nearestQuestion = findNearestDifficulty(questions, targetDifficulty);
    return nearestQuestion;
  } catch (error) {
    console.error("Error fetching question:", error);
    return null;
  }
}

function findNearestDifficulty(
  questions: Question[],
  target: number
): Question {
  return questions.reduce((closest, current) => {
    const closestDiff = Math.abs(closest.difficulty - target);
    const currentDiff = Math.abs(current.difficulty - target);
    return currentDiff < closestDiff ? current : closest;
  });
}

export async function getStartingQuestion(
  language: "en" | "l1"
): Promise<Question | null> {
  return await getRandomQuestion(language, 2.5);
}

export function generateSessionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
