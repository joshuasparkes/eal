import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          EAL Reading Gap Assessment
        </h1>

        <p className="text-lg text-gray-700 mb-8">
          An adaptive assessment tool to measure reading proficiency gaps
          between English and home language skills for EAL students.
        </p>

        <div className="space-y-4">
          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              For Teachers
            </h2>
            <p className="text-gray-600 mb-4">
              Create assessment areas and monitor student progress in
              real-time.
            </p>
            <Link
              href="/teacher"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Teacher Dashboard
            </Link>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">
              For Students
            </h2>
            <p className="text-gray-600 mb-4">
              Enter your session code to begin the adaptive reading assessment.
            </p>
            <Link
              href="/start"
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              Start Assessment
            </Link>
          </div>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>
            This assessment adapts to student responses and provides insights
            into reading proficiency gaps between English and home languages.
          </p>
        </div>
      </div>
    </div>
  );
}
