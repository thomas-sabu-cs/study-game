"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { QuizQuestion } from "@/types";
import { getOrCreateNotesSubject } from "@/app/notes/actions";
import { generateFlashcardsFromNotes } from "@/lib/ai/generate-flashcards";
import { getAppUserId } from "@/lib/appUser";
import { UNASSIGNED_FOLDER_ID } from "@/lib/cardFolders";

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

export interface CardFolder {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  created_at: string;
}

export async function getCardFolders(): Promise<CardFolder[]> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("card_folders")
      .select("id, user_id, name, color, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) return [];
    return (data ?? []) as CardFolder[];
  } catch {
    return [];
  }
}

/** All folder memberships for the current user's cards (for UI). */
export async function getCardFolderMemberships(): Promise<{ card_id: string; folder_id: string }[]> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data: cardIds } = await supabase
      .from("flashcards")
      .select("id")
      .eq("user_id", userId);
    if (!cardIds?.length) return [];
    const { data, error } = await supabase
      .from("card_folder_members")
      .select("card_id, folder_id")
      .in("card_id", (cardIds as { id: string }[]).map((c) => c.id));
    if (error) return [];
    return (data ?? []) as { card_id: string; folder_id: string }[];
  } catch {
    return [];
  }
}

export async function getCardsInFolder(folderId: string): Promise<Flashcard[]> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    if (folderId === UNASSIGNED_FOLDER_ID) {
      const { data: allCards, error: allError } = await supabase
        .from("flashcards")
        .select("id, front, back, source_note_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(500);
      if (allError || !allCards?.length) return [];
      const { data: memberCardIds } = await supabase
        .from("card_folder_members")
        .select("card_id")
        .in("card_id", (allCards as { id: string }[]).map((c) => c.id));
      const assigned = new Set((memberCardIds ?? []).map((r: { card_id: string }) => r.card_id));
      return (allCards as Flashcard[]).filter((c) => !assigned.has(c.id));
    }
    const { data, error } = await supabase
      .from("card_folder_members")
      .select("card_id")
      .eq("folder_id", folderId);
    if (error || !data?.length) return [];
    const cardIds = data.map((r: { card_id: string }) => r.card_id);
    const { data: cards, error: cardsError } = await supabase
      .from("flashcards")
      .select("id, front, back, source_note_id, created_at")
      .eq("user_id", userId)
      .in("id", cardIds)
      .order("created_at", { ascending: false });
    if (cardsError) return [];
    return (cards ?? []) as Flashcard[];
  } catch {
    return [];
  }
}

export async function createCardFolder(
  name: string,
  color?: string | null
): Promise<{ folderId?: string; error?: string }> {
  const userId = await getAppUserId();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Folder name is required." };
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("card_folders")
      .insert({ user_id: userId, name: trimmed.slice(0, 200), color: color ?? null })
      .select("id")
      .single();
    if (error) return { error: error.message };
    revalidatePath("/cards");
    revalidatePath("/play");
    return { folderId: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create folder" };
  }
}

export async function updateCardFolder(
  id: string,
  name?: string | null,
  color?: string | null
): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const updates: { name?: string; color?: string | null } = {};
    if (name !== undefined && name != null) updates.name = String(name).trim().slice(0, 200);
    if (color !== undefined) updates.color = color;
    if (Object.keys(updates).length === 0) return {};
    const { error } = await supabase
      .from("card_folders")
      .update(updates)
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/cards");
    revalidatePath("/play");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to update folder" };
  }
}

export async function deleteCardFolder(id: string): Promise<{ error?: string }> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("card_folders")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);
    if (error) return { error: error.message };
    revalidatePath("/cards");
    revalidatePath("/play");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to delete folder" };
  }
}

export async function addCardsToFolder(
  cardIds: string[],
  folderId: string
): Promise<{ error?: string }> {
  if (folderId === UNASSIGNED_FOLDER_ID) return {};
  const userId = await getAppUserId();
  if (!cardIds.length) return {};
  try {
    const supabase = createAdminClient();
    const { data: folder } = await supabase
      .from("card_folders")
      .select("id")
      .eq("id", folderId)
      .eq("user_id", userId)
      .single();
    if (!folder) return { error: "Folder not found." };
    const rows = cardIds.map((card_id) => ({ card_id, folder_id: folderId }));
    const { error } = await supabase.from("card_folder_members").upsert(rows, {
      onConflict: "card_id,folder_id",
      ignoreDuplicates: true,
    });
    if (error) return { error: error.message };
    revalidatePath("/cards");
    revalidatePath("/play");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to add cards to folder" };
  }
}

export async function removeCardsFromFolder(
  cardIds: string[],
  folderId: string
): Promise<{ error?: string }> {
  if (folderId === UNASSIGNED_FOLDER_ID) return {};
  const userId = await getAppUserId();
  if (!cardIds.length) return {};
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("card_folder_members")
      .delete()
      .eq("folder_id", folderId)
      .in("card_id", cardIds);
    if (error) return { error: error.message };
    revalidatePath("/cards");
    revalidatePath("/play");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to remove cards from folder" };
  }
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

/** Build a quiz from a card folder (or Unassigned) for Play → Quiz or Match. */
export async function createQuizFromDeck(
  folderId: string,
  name?: string
): Promise<{ quizId?: string; error?: string }> {
  const userId = await getAppUserId();
  const cards = await getCardsInFolder(folderId);
  if (!cards.length) {
    const label = folderId === UNASSIGNED_FOLDER_ID ? "Unassigned" : "this folder";
    return { error: `No cards in ${label} to build a quiz from.` };
  }
  try {
    const supabase = createAdminClient();
    const subject = await getOrCreateNotesSubject();
    if (!subject) return { error: "Could not find or create Notes subject for quiz seed." };

    let displayName = name?.trim() || "Quiz from deck";
    if (folderId !== UNASSIGNED_FOLDER_ID) {
      const { data: folder } = await supabase
        .from("card_folders")
        .select("name")
        .eq("id", folderId)
        .eq("user_id", userId)
        .single();
      if (folder?.name) displayName = `Quiz: ${folder.name}`;
    }

    const safeName = displayName.slice(0, 200);
    const fakePath = `flashcards:${folderId}:${Date.now()}`;
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
        type: "multiple_choice" as const,
        question: c.front,
        options: optionsText.map((text, idx) => ({
          id: `${c.id}-opt-${idx}`,
          text,
          isCorrect: text === correct,
        })),
      };
    });

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
    if (quizError || !quiz) return { error: quizError?.message || "Failed to create quiz from deck." };

    revalidatePath("/play");
    return { quizId: quiz.id as string };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to create quiz from deck" };
  }
}

