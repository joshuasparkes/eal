"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";

interface TeacherSession {
  sessionCode: string;
  teacherName: string;
  createdAt: Date;
  studentCount: number;
  active: boolean;
}

export default function TeacherPage() {
  const [mode, setMode] = useState<"select" | "new">("select");
  const [loading, setLoading] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teachers, setTeachers] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [teacherSessions, setTeacherSessions] = useState<TeacherSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const router = useRouter();

  // Load list of teachers on component mount
  useEffect(() => {
    loadTeachers();
  }, []);

  // Load sessions when a teacher is selected
  useEffect(() => {
    if (selectedTeacher) {
      loadTeacherSessions(selectedTeacher);
    } else {
      setTeacherSessions([]);
    }
  }, [selectedTeacher]);

  const loadTeachers = async () => {
    setLoadingTeachers(true);
    try {
      // Get teachers from sessions collection
      const sessionsSnapshot = await getDocs(collection(db, "sessions"));
      const teacherNames = new Set<string>();

      sessionsSnapshot.docs.forEach((doc) => {
        const session = doc.data();
        if (session.teacherName) {
          teacherNames.add(session.teacherName);
        }
      });

      // If no teachers found in sessions, try to get from attempts (legacy data)
      if (teacherNames.size === 0) {
        console.log(
          "No teachers found in sessions collection, checking attempts..."
        );
        const studentsSnapshot = await getDocs(collection(db, "students"));

        for (const studentDoc of studentsSnapshot.docs) {
          const attemptsSnapshot = await getDocs(
            collection(db, "students", studentDoc.id, "attempts")
          );

          attemptsSnapshot.docs.forEach((attemptDoc) => {
            const attempt = attemptDoc.data();
            if (attempt.teacherName) {
              teacherNames.add(attempt.teacherName);
            }
          });
        }
      }

      const teachersList = Array.from(teacherNames).sort();
      console.log("Found teachers:", teachersList);
      setTeachers(teachersList);
    } catch (error) {
      console.error("Error loading teachers:", error);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const loadTeacherSessions = async (teacher: string) => {
    setLoadingSessions(true);
    try {
      // First try to get sessions from sessions collection
      const sessionsQuery = query(
        collection(db, "sessions"),
        where("teacherName", "==", teacher)
      );
      const sessionsSnapshot = await getDocs(sessionsQuery);

      const sessionsMap = new Map<string, TeacherSession>();

      // Add sessions from sessions collection
      sessionsSnapshot.docs.forEach((doc) => {
        const session = doc.data();
        sessionsMap.set(session.sessionCode, {
          sessionCode: session.sessionCode,
          teacherName: session.teacherName,
          createdAt: session.createdAt?.toDate() || new Date(),
          studentCount: 0, // Will be calculated below
          active: session.active || false,
        });
      });

      // Count students for each session by checking attempts
      const studentsSnapshot = await getDocs(collection(db, "students"));

      for (const studentDoc of studentsSnapshot.docs) {
        const attemptsSnapshot = await getDocs(
          collection(db, "students", studentDoc.id, "attempts")
        );

        attemptsSnapshot.docs.forEach((attemptDoc) => {
          const attempt = attemptDoc.data();
          const sessionCode = attempt.sessionCode;

          // Check if this attempt belongs to our teacher's sessions
          if (sessionsMap.has(sessionCode)) {
            const session = sessionsMap.get(sessionCode)!;
            session.studentCount += 1;
          } else if (attempt.teacherName === teacher && sessionCode) {
            // Legacy data - create session entry if not exists
            if (!sessionsMap.has(sessionCode)) {
              sessionsMap.set(sessionCode, {
                sessionCode,
                teacherName: teacher,
                createdAt: attempt.started?.toDate() || new Date(),
                studentCount: 1,
                active: false,
              });
            } else {
              sessionsMap.get(sessionCode)!.studentCount += 1;
            }
          }
        });
      }

      const sessions = Array.from(sessionsMap.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );

      console.log("Found sessions for", teacher, ":", sessions);
      setTeacherSessions(sessions);
    } catch (error) {
      console.error("Error loading teacher sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const createSession = async () => {
    if (!teacherName.trim()) {
      alert("Please enter your name");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/create-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherName: teacherName.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to create session");
      }

      const data = await response.json();
      router.push(
        `/teacher/${data.sessionCode}?teacher=${encodeURIComponent(
          teacherName.trim()
        )}`
      );
    } catch (error) {
      console.error("Error creating session:", error);
      alert("Failed to create session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const viewSession = (sessionCode: string) => {
    router.push(
      `/teacher/${sessionCode}?teacher=${encodeURIComponent(selectedTeacher)}`
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Teacher Dashboard
          </h1>

          {/* Mode Selection */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setMode("select")}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                mode === "select"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              View Existing Sessions
            </button>
            <button
              onClick={() => setMode("new")}
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                mode === "new"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-800"
              }`}
            >
              Create New Session
            </button>
          </div>

          {mode === "select" ? (
            <div className="space-y-6">
              {/* Teacher Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Teacher
                </label>
                {loadingTeachers ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-600 mt-2 text-sm">
                      Loading teachers...
                    </p>
                  </div>
                ) : (
                  <select
                    value={selectedTeacher}
                    onChange={(e) => setSelectedTeacher(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Choose a teacher...</option>
                    {teachers.map((teacher) => (
                      <option key={teacher} value={teacher}>
                        {teacher}
                      </option>
                    ))}
                  </select>
                )}

                {!loadingTeachers && teachers.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    No teachers found. Create a new session first to appear in
                    this list.
                  </p>
                )}
              </div>

              {/* Sessions List */}
              {selectedTeacher && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Sessions for {selectedTeacher}
                  </h3>

                  {loadingSessions ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-600 mt-2">Loading sessions...</p>
                    </div>
                  ) : teacherSessions.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No sessions found for this teacher.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {teacherSessions.map((session) => (
                        <div
                          key={session.sessionCode}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-mono text-lg font-semibold text-blue-600">
                                {session.sessionCode}
                              </div>
                              {session.active && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-600">
                              {session.createdAt.toLocaleDateString()} at{" "}
                              {session.createdAt.toLocaleTimeString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.studentCount} student
                              {session.studentCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                          <button
                            onClick={() => viewSession(session.sessionCode)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                          >
                            View Dashboard
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="teacherName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Your Name
                </label>
                <input
                  type="text"
                  id="teacherName"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <button
                onClick={createSession}
                disabled={loading || !teacherName.trim()}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading
                  ? "Creating Session..."
                  : "Create New Baseline Session"}
              </button>

              <div className="mt-6 text-sm text-gray-600">
                <p>
                  Click &quot;Create New Baseline Session&quot; to generate a
                  6-digit code that students can use to join the assessment.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
