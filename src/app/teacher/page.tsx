"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TeacherPage() {
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const router = useRouter();

  const createSession = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      router.push(`/teacher/${data.sessionCode}`);
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Teacher Dashboard
          </h1>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="teacherName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Your Name (Optional)
              </label>
              <input
                type="text"
                id="teacherName"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full text-black px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your name"
              />
            </div>

            <button
              onClick={createSession}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Creating Session..." : "New Baseline Session"}
            </button>
          </div>

          <div className="mt-6 text-sm text-gray-600">
            <p>
              Click "New Baseline Session" to generate a 6-digit code that
              students can use to join the assessment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
