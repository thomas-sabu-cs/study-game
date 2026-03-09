import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MatchGameClient } from "./MatchGameClient";
import type { QuizQuestion } from "@/types";

export const dynamic = "force-dynamic";

export default async function MatchGamePage({
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
    .select("id, questions")
    .eq("id", quizId)
    .eq("user_id", userId)
    .single();

  if (error || !quiz) notFound();

  const questions = (quiz.questions as QuizQuestion[]) ?? [];
  if (questions.length === 0) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-pastel-cream to-pastel-butter/30 p-6">
      <div className="mx-auto max-w-3xl">
        <MatchGameClient questions={questions} quizId={quizId} />
      </div>
    </main>
  );
}

