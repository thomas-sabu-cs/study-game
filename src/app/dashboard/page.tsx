import Link from "next/link";
import { BookOpen, FolderPlus, Gamepad2 } from "lucide-react";
import { getSubjects } from "./actions";
import { AddSubjectForm } from "./AddSubjectForm";
import { SubjectCard } from "./SubjectCard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const subjects = await getSubjects();

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8">
          <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-800">
            <BookOpen className="h-8 w-8 text-pastel-leaf" />
            Your Locker
          </h1>
          <p className="text-gray-600">
            Create subjects (e.g. History, Bio), add files, and generate quizzes.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Add subject
          </h2>
          <AddSubjectForm />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Subjects
          </h2>
          {subjects.length === 0 ? (
            <div className="rounded-2xl border border-pastel-sage/50 bg-white/50 p-8 text-center">
              <FolderPlus className="mx-auto mb-3 h-12 w-12 text-pastel-sage" />
              <p className="text-gray-600">No subjects yet.</p>
              <p className="mt-1 text-sm text-gray-500">
                Add one above (e.g. History, Biology) to get started.
              </p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {subjects.map((subject) => (
                <SubjectCard key={subject.id} subject={subject} />
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8">
          <Link
            href="/play"
            className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
          >
            <Gamepad2 className="h-4 w-4" />
            Play quizzes
          </Link>
        </div>
      </div>
    </main>
  );
}
