"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizQuestion } from "@/types";
import { getOrCreateNotesSubject } from "@/app/notes/actions";
import { generateFlashcardsFromNotes } from "@/lib/ai/generate-flashcards";
import { getAppUserId } from "@/lib/appUser";

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  source_note_id: string | null;
  created_at: string;
}

export interface NoteSummary {
  id: string;
  title: string | null;
  created_at: string;
}

export async function getFlashcards(): Promise<Flashcard[]> {
  const userId = await getAppUserId();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("flashcards")
      .select("id, front, back, source_note_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return [];
    return (data ?? []) as Flashcard[];
  } catch {
    return [];
  }
}

export async function getNotesForFlashcards(): Promise<NoteSummary[]> {
  const userId = await getAppUserId();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return [];
    return (data ?? []).map((n) => ({
      id: n.id,
      title: n.title ?? null,
      created_at: n.created_at,
    })) as NoteSummary[];
  } catch {
    return [];
  }
}

export async function createFlashcard(front: string, back: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();

  const trimmedFront = front.trim();
  const trimmedBack = back.trim();
  if (!trimmedFront || !trimmedBack) return { error: "Front and back are required." };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("flashcards").insert({
      user_id: userId,
      front: trimmedFront,
      back: trimmedBack,
      source_note_id: null,
    });
    if (error) return { error: error.message };
    revalidatePath("/cards");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save flashcard" };
  }
}

export async function generateFlashcardsFromNote(noteId: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  if (!noteId) return { error: "Select a note first." };

  try {
    const supabase = createAdminClient();
    const { data: note, error } = await supabase
      .from("notes")
      .select("id, content")
      .eq("id", noteId)
      .eq("user_id", userId)
      .single();

    if (error || !note) return { error: "Note not found." };

    const { cards, error: genError } = await generateFlashcardsFromNotes(note.content);
    if (genError) return { error: genError };
    if (!cards.length) return { error: "AI did not return any flashcards." };

    const rows = cards.map((c) => ({
      user_id: userId,
      front: c.front,
      back: c.back,
      source_note_id: note.id,
    }));

    const { error: insertError } = await supabase.from("flashcards").insert(rows);
    if (insertError) return { error: insertError.message };
    revalidatePath("/cards");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate flashcards" };
  }
}

export async function updateFlashcard(id: string, front: string, back: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  const trimmedFront = front.trim();
  const trimmedBack = back.trim();
  if (!trimmedFront || !trimmedBack) return { error: "Front and back are required." };
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("flashcards")
      .update({ front: trimmedFront, back: trimmedBack })
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/cards");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update flashcard" };
  }
}

export async function deleteFlashcard(id: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("flashcards")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/cards");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete flashcard" };
  }
}

export async function createQuizFromAllFlashcards(
  name?: string
): Promise<{ quizId?: string; error?: string }> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data: cards, error } = await supabase
      .from("flashcards")
      .select("id, front, back")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) return { error: error.message };
    if (!cards || cards.length === 0) return { error: "No notecards to build a quiz from." };

    const subject = await getOrCreateNotesSubject();
    if (!subject) return { error: "Could not find or create Notes subject for quiz seed." };

    // Create a lightweight study_files row to satisfy quizzes.file_id constraint.
    const safeName = (name?.trim() || "Notecards quiz").slice(0, 200);
    const fakePath = `flashcards:${Date.now()}`;
    const { data: fileRow, error: fileError } = await supabase
      .from("study_files")
      .insert({
        subject_id: subject.id,
        user_id: userId,
        name: safeName,
        storage_path: fakePath,
        extracted_text: null,
      })
      .select("id")
      .single();
    if (fileError || !fileRow) return { error: fileError?.message || "Failed to create quiz seed file." };

    // Build multiple-choice questions from flashcards:
    // front -> question, back -> correct answer, other backs -> distractors.
    const backsPool = cards.map((c) => c.back);
    const questions: QuizQuestion[] = cards.map((c, index) => {
      const correct = c.back;
      const distractors = backsPool
        .filter((b) => b !== correct)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      const optionsText = [correct, ...distractors].sort(() => Math.random() - 0.5);
      return {
        id: `${c.id}-${index}`,
        type: "multiple_choice",
        question: c.front,
        options: optionsText.map((text, idx) => ({
          id: `${c.id}-opt-${idx}`,
          text,
          isCorrect: text === correct,
        })),
      };
    });

    const displayName = name?.trim() || "Quiz from notecards";
    const { data: quiz, error: quizError } = await supabase
      .from("quizzes")
      .insert({
        file_id: fileRow.id,
        user_id: userId,
        questions,
        source_file_ids: [fileRow.id],
        name: displayName,
      })
      .select("id")
      .single();
    if (quizError || !quiz) return { error: quizError?.message || "Failed to create quiz from notecards." };

    revalidatePath("/play");
    return { quizId: quiz.id as string };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create quiz from notecards" };
  }
}

