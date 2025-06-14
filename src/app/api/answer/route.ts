import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase";
import { selectNextQuestion, getStartingQuestion } from "@/lib/adaptive";
import { scoreAttempt } from "@/lib/gptScore";
import { AnswerRequest, Question, Response } from "@/types";

export async function POST(request: NextRequest) {
  try {
    const body: AnswerRequest = await request.json();
    const { studentId, attemptId, questionId, selectedIdx, timeMs } = body;

    const questionDoc = await adminDb
      .collection("questions")
      .doc(questionId)
      .get();
    if (!questionDoc.exists) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      );
    }

    const question = { id: questionDoc.id, ...questionDoc.data() } as Question;
    const isCorrect = selectedIdx === question.correctIdx;

    const responseData: Omit<Response, "id"> = {
      questionId,
      selectedIdx,
      isCorrect,
      timeMs,
    };

    await adminDb
      .collection("students")
      .doc(studentId)
      .collection("attempts")
      .doc(attemptId)
      .collection("responses")
      .add(responseData);

    const responsesSnapshot = await adminDb
      .collection("students")
      .doc(studentId)
      .collection("attempts")
      .doc(attemptId)
      .collection("responses")
      .get();

    const responses = responsesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Response[];

    const englishCount = await countResponsesByLanguage(responses, "en");
    const l1Count = await countNonEnglishResponses(responses);

    let nextQuestion: Question | null = null;
    let completed = false;

    if (question.language === "en" && englishCount < 15) {
      const usedEnglishIds = await getUsedQuestionIdsByLanguage(
        responses,
        "en"
      );
      nextQuestion = await selectNextQuestion(
        question,
        isCorrect,
        usedEnglishIds
      );
    } else if (
      question.language === "en" &&
      englishCount >= 15 &&
      l1Count === 0
    ) {
      const attemptDoc = await adminDb
        .collection("students")
        .doc(studentId)
        .collection("attempts")
        .doc(attemptId)
        .get();

      const studentDoc = await adminDb
        .collection("students")
        .doc(studentId)
        .get();
      const studentData = studentDoc.data();

      const homeLanguage = studentData?.homeLanguage;

      if (homeLanguage) {
        nextQuestion = await getStartingQuestion(homeLanguage);
      } else {
        console.error("No home language found for student");
        completed = true;
        await completeAttempt(studentId, attemptId, responses);
      }
    } else if (question.language !== "en" && l1Count < 3) {
      const usedL1Ids = await getUsedQuestionIdsBySpecificLanguage(
        responses,
        question.language
      );
      nextQuestion = await selectNextQuestion(question, isCorrect, usedL1Ids);
    } else {
      completed = true;
      await completeAttempt(studentId, attemptId, responses);
    }

    return NextResponse.json({
      nextQuestion,
      completed,
    });
  } catch (error) {
    console.error("Error processing answer:", error);
    return NextResponse.json(
      { error: "Failed to process answer" },
      { status: 500 }
    );
  }
}

async function getUsedQuestionIdsByLanguage(
  responses: Response[],
  language: string
): Promise<string[]> {
  const usedIds: string[] = [];

  for (const response of responses) {
    const questionDoc = await adminDb
      .collection("questions")
      .doc(response.questionId)
      .get();
    const questionData = questionDoc.data();
    if (questionData?.language === language) {
      usedIds.push(response.questionId);
    }
  }

  return usedIds;
}

async function getUsedQuestionIdsBySpecificLanguage(
  responses: Response[],
  language: string
): Promise<string[]> {
  const usedIds: string[] = [];

  for (const response of responses) {
    const questionDoc = await adminDb
      .collection("questions")
      .doc(response.questionId)
      .get();
    const questionData = questionDoc.data();
    if (questionData?.language === language) {
      usedIds.push(response.questionId);
    }
  }

  return usedIds;
}

async function countResponsesByLanguage(
  responses: Response[],
  language: string
): Promise<number> {
  let count = 0;
  for (const response of responses) {
    const questionDoc = await adminDb
      .collection("questions")
      .doc(response.questionId)
      .get();
    const questionData = questionDoc.data();
    if (questionData?.language === language) {
      count++;
    }
  }
  return count;
}

async function countNonEnglishResponses(
  responses: Response[]
): Promise<number> {
  let count = 0;
  for (const response of responses) {
    const questionDoc = await adminDb
      .collection("questions")
      .doc(response.questionId)
      .get();
    const questionData = questionDoc.data();
    if (questionData?.language !== "en") {
      count++;
    }
  }
  return count;
}

async function completeAttempt(
  studentId: string,
  attemptId: string,
  responses: Response[]
) {
  const englishResults = [];
  const l1Results = [];

  for (const response of responses) {
    const questionDoc = await adminDb
      .collection("questions")
      .doc(response.questionId)
      .get();
    const questionData = questionDoc.data();

    if (questionData) {
      const result = {
        difficulty: questionData.difficulty,
        correct: response.isCorrect,
      };

      if (questionData.language === "en") {
        englishResults.push(result);
      } else if (questionData.language === "l1") {
        l1Results.push(result);
      }
    }
  }

  const scores = await scoreAttempt(englishResults, l1Results);

  const gap = scores.l1Score - scores.englishScore;
  let colourBand: "green" | "amber" | "red" = "green";
  if (gap > 0.5 && gap <= 1.5) colourBand = "amber";
  if (gap > 1.5) colourBand = "red";

  await adminDb
    .collection("students")
    .doc(studentId)
    .collection("attempts")
    .doc(attemptId)
    .update({
      completed: new Date(),
      englishScore: scores.englishScore,
      l1Score: scores.l1Score,
      gap,
      colourBand,
      summary: scores.summary,
    });
}
