"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase-client";
import { collection, addDoc, doc, getDoc } from "firebase/firestore";
import { Question, Student, Attempt } from "@/types";

type AssessmentPhase = "entry" | "english" | "l1" | "completed";

interface AvailableLanguage {
  code: string;
  name: string;
}

export default function StartPage() {
  const [phase, setPhase] = useState<AssessmentPhase>("entry");
  const [sessionCode, setSessionCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [yearGroup, setYearGroup] = useState("");
  const [homeLanguage, setHomeLanguage] = useState("");
  const [availableLanguages, setAvailableLanguages] = useState<
    AvailableLanguage[]
  >([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [studentId, setStudentId] = useState<string>("");
  const [attemptId, setAttemptId] = useState<string>("");
  const [questionStartTime, setQuestionStartTime] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [englishCount, setEnglishCount] = useState(0);
  const [l1Count, setL1Count] = useState(0);
  const [finalResult, setFinalResult] = useState<any>(null);

  // Load available languages on component mount
  useEffect(() => {
    loadAvailableLanguages();
  }, []);

  const loadAvailableLanguages = async () => {
    try {
      const response = await fetch("/api/available-languages");
      if (response.ok) {
        const data = await response.json();
        setAvailableLanguages(data.languages);
      } else {
        console.error("Failed to load available languages");
      }
    } catch (error) {
      console.error("Error loading available languages:", error);
    } finally {
      setLoadingLanguages(false);
    }
  };

  const startAssessment = async () => {
    if (!sessionCode || !studentName || !yearGroup || !homeLanguage) {
      alert("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const studentData: Omit<Student, "id"> = {
        name: studentName,
        yearGroup,
        homeLanguage,
        createdAt: new Date(),
      };

      const studentDoc = await addDoc(collection(db, "students"), studentData);
      setStudentId(studentDoc.id);

      // Get teacher name from URL params if available
      const urlParams = new URLSearchParams(window.location.search);
      const teacherName = urlParams.get("teacher") || "Unknown Teacher";

      const attemptData: Omit<Attempt, "id"> = {
        sessionCode,
        started: new Date(),
        teacherName,
      };

      const attemptDoc = await addDoc(
        collection(db, "students", studentDoc.id, "attempts"),
        attemptData
      );
      setAttemptId(attemptDoc.id);

      const questionResponse = await fetch("/api/get-starting-question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ language: "en" }),
      });

      if (questionResponse.ok) {
        const questionData = await questionResponse.json();
        if (questionData.question) {
          setCurrentQuestion(questionData.question);
          setQuestionStartTime(Date.now());
          setPhase("english");
        } else {
          alert("No questions available. Please contact your teacher.");
        }
      } else {
        alert("Failed to load questions. Please contact your teacher.");
      }
    } catch (error) {
      console.error("Error starting assessment:", error);
      alert("Failed to start assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async () => {
    if (selectedAnswer === null || !currentQuestion) return;

    setLoading(true);
    try {
      const timeMs = Date.now() - questionStartTime;

      const response = await fetch("/api/answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId,
          attemptId,
          questionId: currentQuestion.id,
          selectedIdx: selectedAnswer,
          timeMs,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit answer");
      }

      const data = await response.json();

      if (data.completed) {
        const attemptDocRef = doc(
          db,
          "students",
          studentId,
          "attempts",
          attemptId
        );
        const attemptSnapshot = await getDoc(attemptDocRef);
        if (attemptSnapshot.exists()) {
          setFinalResult(attemptSnapshot.data());
        }
        setPhase("completed");
      } else if (data.nextQuestion) {
        setCurrentQuestion(data.nextQuestion);
        setQuestionStartTime(Date.now());
        setSelectedAnswer(null);

        if (currentQuestion.language === "en") {
          setEnglishCount((prev) => prev + 1);
          if (englishCount >= 14) {
            setPhase("l1");
          }
        } else {
          setL1Count((prev) => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      alert("Failed to submit answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getColourMessage = (colourBand: string) => {
    switch (colourBand) {
      case "green":
        return {
          message: "Great work! Your reading skills are well balanced.",
          color: "text-green-600",
        };
      case "amber":
        return {
          message: "Good progress! There are some areas to focus on.",
          color: "text-yellow-600",
        };
      case "red":
        return {
          message: "Keep practicing! Your teacher will help you improve.",
          color: "text-red-600",
        };
      default:
        return {
          message: "Assessment completed successfully!",
          color: "text-blue-600",
        };
    }
  };

  if (phase === "entry") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Start Assessment
            </h1>

            <div className="space-y-4 text-black">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Code
                </label>
                <input
                  type="text"
                  value={sessionCode}
                  onChange={(e) => setSessionCode(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Year Group
                </label>
                <select
                  value={yearGroup}
                  onChange={(e) => setYearGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select year group</option>
                  <option value="Year 7">Year 7</option>
                  <option value="Year 8">Year 8</option>
                  <option value="Year 9">Year 9</option>
                  <option value="Year 10">Year 10</option>
                  <option value="Year 11">Year 11</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Home Language
                </label>
                {loadingLanguages ? (
                  <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                    Loading available languages...
                  </div>
                ) : (
                  <select
                    value={homeLanguage}
                    onChange={(e) => setHomeLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select your home language</option>
                    {availableLanguages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                )}
                {!loadingLanguages && availableLanguages.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No home language questions available. Please contact your
                    teacher.
                  </p>
                )}
              </div>

              <button
                onClick={startAssessment}
                disabled={
                  loading ||
                  !sessionCode ||
                  !studentName ||
                  !yearGroup ||
                  !homeLanguage
                }
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Starting Assessment..." : "Begin Assessment"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "completed") {
    const colourInfo = getColourMessage(finalResult?.colourBand || "");

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-100 flex items-center justify-center p-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              Assessment Complete!
            </h1>

            <div className="mb-6">
              <div className={`text-6xl mb-4 ${colourInfo.color}`}>
                {finalResult?.colourBand === "green" && "🟢"}
                {finalResult?.colourBand === "amber" && "🟡"}
                {finalResult?.colourBand === "red" && "🔴"}
              </div>
              <p className={`text-xl font-semibold ${colourInfo.color}`}>
                {colourInfo.message}
              </p>
            </div>

            {finalResult?.summary && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-gray-700">{finalResult.summary}</p>
              </div>
            )}

            <div className="text-sm text-gray-600">
              <p>Thank you for completing the assessment!</p>
              <p>Your teacher will review your results and provide feedback.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold text-gray-900">
                {phase === "english"
                  ? "English Reading"
                  : "Home Language Reading"}
              </h1>
              <div className="text-sm text-gray-600">
                {phase === "english"
                  ? `Question ${englishCount + 1} of 15`
                  : `Question ${l1Count + 1} of 3`}
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width:
                    phase === "english"
                      ? `${((englishCount + 1) / 15) * 100}%`
                      : `${((l1Count + 1) / 3) * 100}%`,
                }}
              ></div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              {currentQuestion.text}
            </h2>

            <div className="space-y-3">
              {currentQuestion.choices.map((choice, index) => (
                <label
                  key={index}
                  className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedAnswer === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={selectedAnswer === index}
                    onChange={() => setSelectedAnswer(index)}
                    className="sr-only"
                  />
                  <span className="text-gray-900">{choice}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={submitAnswer}
              disabled={selectedAnswer === null || loading}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Submitting..." : "Next Question"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
