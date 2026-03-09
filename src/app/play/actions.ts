"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { explainAnswer } from "@/lib/ai/explain-answer";
import { analyzeQuizResults as analyzeQuizResultsAI } from "@/lib/ai/analyze-quiz-results";
import type { QuizQuestion } from "@/types";

export type { CategoryResult, AnalyzeResult } from "@/lib/ai/analyze-quiz-results";

export interface QuizListItem {
  id: string;
  created_at: string;
  name: string | null;
}

export async function getQuizzes(): Promise<QuizListItem[]> {
  const { userId } = await auth();
  if (!userId) return [];
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("quizzes")
      .select("id, created_at, name")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return (data ?? []) as QuizListItem[];
  } catch {
    return [];
  }
}

export async function saveQuizAttempt(
  quizId: string,
  score: number,
  total: number,
  answers: { questionIndex: number; correct: boolean }[],
  timeSeconds?: number,
  questionSeconds?: number[]
) {
  const { userId } = await auth();
  if (!userId) return;
  try {
    const supabase = createAdminClient();
    await supabase.from("quiz_attempts").insert({
      quiz_id: quizId,
      user_id: userId,
      score,
      total,
      answers,
      time_seconds: timeSeconds ?? 0,
      question_seconds: questionSeconds ?? [],
    });
    revalidatePath("/play");
  } catch (e) {
    console.error("saveQuizAttempt:", e);
  }
}

export interface RecentAttempt {
  id: string;
  quiz_id: string;
  score: number;
  total: number;
  time_seconds: number;
  created_at: string;
  quiz_created_at: string;
}

export async function getRecentAttempts(): Promise<RecentAttempt[]> {
  const { userId } = await auth();
  if (!userId) return [];
  try {
    const supabase = createAdminClient();
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, total, time_seconds, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(25);
    if (!attempts?.length) return [];

    const quizIds = [...new Set(attempts.map((a) => a.quiz_id))];
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, created_at")
      .in("id", quizIds);
    const quizMap = new Map((quizzes ?? []).map((q) => [q.id, q]));

    return attempts.map((a) => ({
      ...a,
      quiz_created_at: quizMap.get(a.quiz_id)?.created_at ?? a.created_at,
    })) as RecentAttempt[];
  } catch {
    return [];
  }
}

export async function analyzeQuizResults(
  questions: QuizQuestion[],
  answers: boolean[]
): Promise<{ data?: { categories: { name: string; correct: number; missed: number }[]; suggestions: string[] }; error?: string }> {
  await auth();
  return analyzeQuizResultsAI(questions, answers);
}

export async function explainQuestion(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  existingExplanation?: string;
}): Promise<{ explanation: string; memoryTip: string; error?: string }> {
  await auth();
  return explainAnswer(params);
}

export async function flagQuestion(quizId: string, questionId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("question_flags").insert({
      user_id: userId,
      quiz_id: quizId,
      question_id: questionId,
      flag_type: "review",
    });
    if (error) return { error: error.message };
    revalidatePath("/play");
    revalidatePath("/play/flagged");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to flag" };
  }
}

export async function reportQuestion(quizId: string, questionId: string, note?: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("question_flags").insert({
      user_id: userId,
      quiz_id: quizId,
      question_id: questionId,
      flag_type: "report",
      note: note?.trim() || null,
    });
    if (error) return { error: error.message };
    revalidatePath("/play");
    revalidatePath("/play/flagged");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to report" };
  }
}

export async function unflagQuestion(flagId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("question_flags")
      .delete()
      .eq("id", flagId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/play/flagged");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove" };
  }
}

export interface FlaggedItem {
  id: string;
  quiz_id: string;
  question_id: string;
  flag_type: string;
  note: string | null;
  created_at: string;
  question?: QuizQuestion;
}

export async function getFlaggedQuestions(): Promise<FlaggedItem[]> {
  const { userId } = await auth();
  if (!userId) return [];
  try {
    const supabase = createAdminClient();
    const { data: flags } = await supabase
      .from("question_flags")
      .select("id, quiz_id, question_id, flag_type, note, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (!flags?.length) return [];

    const items: FlaggedItem[] = [];
    for (const f of flags) {
      const { data: quiz } = await supabase
        .from("quizzes")
        .select("questions")
        .eq("id", f.quiz_id)
        .eq("user_id", userId)
        .single();
      const questions = (quiz?.questions as QuizQuestion[] | null) ?? [];
      const question = questions.find((q) => q.id === f.question_id);
      items.push({ ...f, question });
    }
    return items;
  } catch {
    return [];
  }
}
