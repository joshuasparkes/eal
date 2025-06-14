import { Question } from "@/types";
import { adminDb } from "./firebase";

export async function selectNextQuestion(
  prev: Question,
  wasCorrect: boolean,
  usedQuestionIds: string[] = []
): Promise<Question | null> {
  let target = prev.difficulty + (wasCorrect ? 0.5 : -0.5);
  target = Math.max(1, Math.min(5, target));

  return await getRandomQuestion(prev.language, target, usedQuestionIds);
}

export async function getRandomQuestion(
  language: string,
  targetDifficulty: number,
  usedQuestionIds: string[] = []
): Promise<Question | null> {
  try {
    const questionsRef = adminDb.collection("questions");
    const snapshot = await questionsRef.where("language", "==", language).get();

    if (snapshot.empty) {
      console.log(`No questions found for language: ${language}`);
      return null;
    }

    let questions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Question[];

    // Filter out already used questions
    questions = questions.filter((q) => !usedQuestionIds.includes(q.id!));

    // If no unused questions, reset and use all questions
    if (questions.length === 0) {
      questions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Question[];
    }

    const selectedQuestion = findNearestDifficultyRandom(
      questions,
      targetDifficulty
    );
    return selectedQuestion;
  } catch (error) {
    console.error("Error fetching question:", error);
    return null;
  }
}

function findNearestDifficultyRandom(
  questions: Question[],
  target: number
): Question {
  // Find all questions with the closest difficulty
  const difficulties = questions.map((q) => Math.abs(q.difficulty - target));
  const minDiff = Math.min(...difficulties);

  const closestQuestions = questions.filter(
    (q) => Math.abs(q.difficulty - target) === minDiff
  );

  // Randomly select from the closest questions
  const randomIndex = Math.floor(Math.random() * closestQuestions.length);
  return closestQuestions[randomIndex];
}

export async function getStartingQuestion(
  language: string
): Promise<Question | null> {
  return await getRandomQuestion(language, 2.5, []);
}

export function generateSessionCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
