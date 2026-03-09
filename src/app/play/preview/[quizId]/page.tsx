import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizQuestion } from "@/types";
import { ArrowLeft, HelpCircle, List } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function QuizPreviewPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const { userId } = await auth();
  if (!userId) notFound();

  const supabase = createAdminClient();
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, name, created_at, questions")
    .eq("id", quizId)
    .eq("user_id", userId)
    .single();

  if (error || !quiz) notFound();

  const questions = (quiz.questions as QuizQuestion[]) ?? [];
  if (questions.length === 0) notFound();

  const title =
    (quiz.name && String(quiz.name).trim()) ||
    `Quiz from ${new Date(quiz.created_at).toLocaleDateString()}`;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link
            href="/play"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Play
          </Link>
        </div>

        <div className="rounded-2xl border border-pastel-sage/50 bg-white/80 p-5 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-pastel-leaf" />
            <h1 className="text-lg font-semibold text-gray-800">{title}</h1>
          </div>
          <p className="mb-3 text-sm text-gray-600">
            Preview the questions in this quiz to make sure it&apos;s the one you want, then click
            **Begin** to start playing.
          </p>
          <p className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500 flex items-center gap-1.5">
            <List className="h-3.5 w-3.5" />
            {questions.length} question{questions.length !== 1 ? "s" : ""}
          </p>

          <ol className="space-y-3 max-h-[24rem] overflow-y-auto pr-1">
            {questions.map((q, idx) => (
              <li key={q.id ?? idx} className="rounded-xl border border-pastel-sage/40 bg-white px-3 py-2">
                <p className="text-sm font-medium text-gray-800">
                  Q{idx + 1}. {q.question}
                </p>
                {Array.isArray(q.options) && q.options.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-xs text-gray-600">
                    {q.options.map((opt) => (
                      <li key={opt.id}>
                        {opt.isCorrect ? (
                          <span className="font-semibold text-pastel-leaf">
                            ✓ {opt.text}
                          </span>
                        ) : (
                          <span>{opt.text}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <Link
              href="/play"
              className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Link>
            <Link
              href={`/play/${quizId}`}
              className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-5 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
            >
              Begin quiz
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

