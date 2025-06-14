"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase-client";
import { collection, query, where, getDocs } from "firebase/firestore";
import { Student, Attempt } from "@/types";

interface StudentResult {
  student: Student;
  attempt: Attempt;
}

export default function TeacherDashboard() {
  const params = useParams();
  const code = params.code as string;
  const [results, setResults] = useState<StudentResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResults = async () => {
    try {
      const studentsSnapshot = await getDocs(collection(db, "students"));
      const allResults: StudentResult[] = [];

      for (const studentDoc of studentsSnapshot.docs) {
        const student = { id: studentDoc.id, ...studentDoc.data() } as Student;

        const attemptsQuery = query(
          collection(db, "students", studentDoc.id, "attempts"),
          where("sessionCode", "==", code)
        );

        const attemptsSnapshot = await getDocs(attemptsQuery);

        attemptsSnapshot.docs.forEach((attemptDoc) => {
          const attempt = {
            id: attemptDoc.id,
            ...attemptDoc.data(),
          } as Attempt;
          if (attempt.completed) {
            allResults.push({ student, attempt });
          }
        });
      }

      setResults(allResults);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching results:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!code) return;

    // Initial fetch
    fetchResults();

    // Poll every 5 seconds for updates
    const interval = setInterval(fetchResults, 5000);

    return () => clearInterval(interval);
  }, [code]);

  const exportCSV = () => {
    window.open(`/api/export?code=${code}`, "_blank");
  };

  const getColourBadge = (colourBand: string) => {
    const colours = {
      green: "bg-green-100 text-green-800",
      amber: "bg-yellow-100 text-yellow-800",
      red: "bg-red-100 text-red-800",
    };
    return (
      colours[colourBand as keyof typeof colours] || "bg-gray-100 text-gray-800"
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Assessment Dashboard
              </h1>
              <p className="text-gray-600">
                Session Code:{" "}
                <span className="font-mono text-2xl font-bold text-blue-600">
                  {code}
                </span>
              </p>
            </div>
            <button
              onClick={exportCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              Export CSV
            </button>
          </div>

          <div className="text-center p-8 bg-blue-50 rounded-lg">
            <p className="text-lg text-gray-700 mb-2">
              Share this code with students to join the assessment:
            </p>
            <div className="text-6xl font-mono font-bold text-blue-600 tracking-wider">
              {code}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h2 className="text-xl font-semibold text-gray-900">
              Completed Assessments ({results.length})
            </h2>
          </div>

          {results.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>
                No completed assessments yet. Students will appear here as they
                finish.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Year Group
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Home Language
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      English Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      L1 Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Gap
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Band
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Summary
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.map((result, index) => (
                    <tr
                      key={`${result.student.id}-${result.attempt.id}`}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.student.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.student.yearGroup}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.student.homeLanguage}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.attempt.englishScore}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.attempt.l1Score}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result.attempt.gap?.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getColourBadge(
                            result.attempt.colourBand || "gray"
                          )}`}
                        >
                          {result.attempt.colourBand}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs">
                        {result.attempt.summary}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
