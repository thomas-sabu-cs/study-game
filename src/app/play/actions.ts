"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { explainAnswer } from "@/lib/ai/explain-answer";
import { analyzeQuizResults as analyzeQuizResultsAI } from "@/lib/ai/analyze-quiz-results";
import type { QuizQuestion } from "@/types";
import { getAppUserId } from "@/lib/appUser";
import { getCardFolders } from "@/app/cards/actions";
import { UNASSIGNED_FOLDER_ID } from "@/lib/cardFolders";

export type { CategoryResult, AnalyzeResult } from "@/lib/ai/analyze-quiz-results";

export interface QuizListItem {
  id: string;
  created_at: string;
  name: string | null;
  times_played?: number;
  best_accuracy_pct?: number;
  best_time_seconds?: number;
}

export async function getQuizzes(): Promise<QuizListItem[]> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data: quizzes } = await supabase
      .from("quizzes")
      .select("id, created_at, name")
      .eq("user_id", userId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(50);
    if (!quizzes?.length) return [];

    const quizIds = quizzes.map((q) => q.id);
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("quiz_id, score, total, time_seconds")
      .eq("user_id", userId)
      .in("quiz_id", quizIds);

    const statsByQuiz = new Map<
      string,
      { times_played: number; best_accuracy_pct: number; best_time_seconds: number }
    >();
    for (const a of attempts ?? []) {
      const existing = statsByQuiz.get(a.quiz_id);
      const accuracy = a.total > 0 ? Math.round((a.score / a.total) * 100) : 0;
      const time = a.time_seconds ?? 0;
      if (!existing) {
        statsByQuiz.set(a.quiz_id, {
          times_played: 1,
          best_accuracy_pct: accuracy,
          best_time_seconds: time > 0 ? time : 0,
        });
      } else {
        existing.times_played += 1;
        existing.best_accuracy_pct = Math.max(existing.best_accuracy_pct, accuracy);
        if (time > 0) {
          existing.best_time_seconds =
            existing.best_time_seconds > 0
              ? Math.min(existing.best_time_seconds, time)
              : time;
        }
      }
    }

    return quizzes.map((q) => {
      const stats = statsByQuiz.get(q.id);
      return {
        ...q,
        times_played: stats?.times_played ?? 0,
        best_accuracy_pct: stats?.best_accuracy_pct,
        best_time_seconds: stats?.best_time_seconds,
      } as QuizListItem;
    });
  } catch {
    return [];
  }
}

export interface DeletedQuizItem {
  id: string;
  created_at: string;
  name: string | null;
  deleted_at: string;
}

export async function getRecentlyDeletedQuizzes(): Promise<DeletedQuizItem[]> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("quizzes")
      .select("id, created_at, name, deleted_at")
      .eq("user_id", userId)
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false })
      .limit(25);
    return (data ?? []) as DeletedQuizItem[];
  } catch {
    return [];
  }
}

/** Total seconds of quiz playtime for the current user (used for rainbow background unlock). */
export async function getTotalPlaytimeSeconds(): Promise<number> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("quiz_attempts")
      .select("time_seconds")
      .eq("user_id", userId);
    const total = (data ?? []).reduce((sum, row) => sum + (Number(row.time_seconds) || 0), 0);
    return total;
  } catch {
    return 0;
  }
}

export async function deleteQuiz(quizId: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("quizzes")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", quizId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/play");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete" };
  }
}

export async function restoreQuiz(quizId: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("quizzes")
      .update({ deleted_at: null })
      .eq("id", quizId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/play");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to restore" };
  }
}

export async function permanentlyDeleteQuiz(quizId: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("quizzes")
      .delete()
      .eq("id", quizId)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/play");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete permanently" };
  }
}

export async function saveQuizAttempt(
  quizId: string,
  score: number,
  total: number,
  answers: { questionIndex: number; correct: boolean }[],
  timeSeconds?: number,
  questionSeconds?: number[],
  gameType: "quiz" | "match" | "flip" = "quiz"
) {
  const userId = await getAppUserId();
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
      game_type: gameType,
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
  game_type: "quiz" | "match" | "flip" | null;
}

export async function getRecentAttempts(): Promise<RecentAttempt[]> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data: attempts } = await supabase
      .from("quiz_attempts")
      .select("id, quiz_id, score, total, time_seconds, created_at, game_type")
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
      game_type: (a as any).game_type ?? "quiz",
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
  // Guests are allowed to use AI helpers as well; no user id required here.
  return analyzeQuizResultsAI(questions, answers);
}

export async function explainQuestion(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  existingExplanation?: string;
}): Promise<{ explanation: string; memoryTip: string; error?: string }> {
  // Guests are allowed to use AI helpers as well; no user id required here.
  return explainAnswer(params);
}

export async function flagQuestion(quizId: string, questionId: string) {
  const userId = await getAppUserId();
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
  const userId = await getAppUserId();
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
  const userId = await getAppUserId();
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
  const userId = await getAppUserId();
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

/** Unified dataset for Play: locker quizzes + notecard folders (including Unassigned). */
export type PlayDataset =
  | { type: "quiz"; id: string; name: string }
  | { type: "deck"; id: string; name: string };

export async function getDatasets(): Promise<PlayDataset[]> {
  const [quizzes, folders] = await Promise.all([getQuizzes(), getCardFolders()]);
  const list: PlayDataset[] = [];

  for (const q of quizzes) {
    list.push({
      type: "quiz",
      id: q.id,
      name: (q.name && q.name.trim()) || `Quiz ${new Date(q.created_at).toLocaleDateString()}`,
    });
  }
  list.push({ type: "deck", id: UNASSIGNED_FOLDER_ID, name: "Unassigned" });
  for (const f of folders) {
    list.push({ type: "deck", id: f.id, name: f.name });
  }
  return list;
}
