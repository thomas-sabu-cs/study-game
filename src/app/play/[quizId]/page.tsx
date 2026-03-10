import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { TakeQuizClient } from "./TakeQuizClient";
import type { QuizQuestion } from "@/types";
import { getAppUserId } from "@/lib/appUser";

export const dynamic = "force-dynamic";

export default async function PlayQuizPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = await params;
  const userId = await getAppUserId();

  const supabase = createAdminClient();
  const { data: quiz, error } = await supabase
    .from("quizzes")
    .select("id, questions")
    .eq("id", quizId)
    .eq("user_id", userId)
    .single();

  if (error || !quiz) notFound();

  const questions = (quiz.questions as QuizQuestion[]) ?? [];
  if (questions.length === 0) notFound();

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <TakeQuizClient questions={questions} quizId={quizId} />
      </div>
    </main>
  );
}
