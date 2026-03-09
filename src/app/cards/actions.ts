"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateFlashcardsFromNotes } from "@/lib/ai/generate-flashcards";

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
  const { userId } = await auth();
  if (!userId) return [];

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
  const { userId } = await auth();
  if (!userId) return [];

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
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };

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
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };
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

