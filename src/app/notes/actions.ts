"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateNotesFromText } from "@/lib/ai/generate-notes";
import { extractTextFromBuffer } from "@/lib/extract/text";
import type { StudyFile } from "@/types";

const BUCKET = "study-files";
const NOTES_SUBJECT_NAME = "Notes";
// NOTE: On Vercel, the hard request body limit is ~4.5 MB.
// This 8 MB cap is mainly for local/dev or self-hosted deployments.
const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED_MIMES = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export interface NotesSubject {
  id: string;
}

export async function getOrCreateNotesSubject(): Promise<NotesSubject | null> {
  const { userId } = await auth();
  if (!userId) return null;

  try {
    const supabase = createAdminClient();
    const { data: existing } = await supabase
      .from("subjects")
      .select("id")
      .eq("user_id", userId)
      .eq("name", NOTES_SUBJECT_NAME)
      .single();

    if (existing) return { id: existing.id };

    const { data: created, error } = await supabase
      .from("subjects")
      .insert({ user_id: userId, name: NOTES_SUBJECT_NAME })
      .select("id")
      .single();

    if (error || !created) return null;
    return { id: created.id };
  } catch {
    return null;
  }
}

export async function getNotesFiles(subjectId: string): Promise<StudyFile[]> {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("study_files")
      .select("id, subject_id, user_id, name, storage_path, extracted_text, created_at")
      .eq("subject_id", subjectId)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return [];
    return (data ?? []) as StudyFile[];
  } catch {
    return [];
  }
}

export async function uploadFileForNotes(
  formData: FormData
): Promise<{ error?: string; duplicateFileId?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };

  const subject = await getOrCreateNotesSubject();
  if (!subject) return { error: "Could not get Notes folder." };

  const file = formData.get("file") as File | null;
  if (!file) return { error: "Choose a file first." };
  if (file.size > MAX_FILE_BYTES) {
    return {
      error:
        "File too large. Maximum size is 8 MB here, but Vercel may still reject requests over ~4.5 MB. Try a smaller PDF or split it if it fails.",
    };
  }

  let mime = file.type || "application/octet-stream";
  const ext = (file.name || "").toLowerCase();
  if (mime === "application/octet-stream" && ext) {
    if (ext.endsWith(".pdf")) mime = "application/pdf";
    else if (ext.endsWith(".txt")) mime = "text/plain";
    else if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) mime = "image/jpeg";
    else if (ext.endsWith(".png")) mime = "image/png";
    else if (ext.endsWith(".webp")) mime = "image/webp";
  }
  if (!ALLOWED_MIMES.includes(mime))
    return { error: "Only PDF, TXT, and JPEG/PNG/WebP are allowed." };

  try {
    const supabase = createAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { createHash } = await import("crypto");
    const fileHash = createHash("sha256").update(buffer).digest("hex");

    const { data: existing } = await supabase
      .from("study_files")
      .select("id")
      .eq("user_id", userId)
      .eq("subject_id", subject.id)
      .eq("file_hash", fileHash)
      .limit(1)
      .maybeSingle();
    if (existing?.id) return { error: "That file is already uploaded.", duplicateFileId: existing.id } as any;

    const safeName = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
    const storagePath = `${userId}/${subject.id}/${crypto.randomUUID()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: mime, upsert: false });

    if (uploadError) {
      const msg = uploadError.message ?? "";
      if (msg.includes("Bucket") || msg.includes("bucket") || msg.includes("not found") || msg.includes("NotFound"))
        return { error: 'Storage bucket "study-files" not found.' };
      return { error: msg };
    }

    const { text, error: extractError } = await extractTextFromBuffer(buffer, mime);
    if (extractError && !text) return { error: extractError };

    const { error: insertError } = await supabase.from("study_files").insert({
      subject_id: subject.id,
      user_id: userId,
      name: file.name || safeName,
      storage_path: storagePath,
      extracted_text: text || null,
      file_hash: fileHash,
      file_size: file.size,
    });

    if (insertError) return { error: insertError.message };
    revalidatePath("/notes");
    return {};
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: msg || "Upload failed." };
  }
}

export interface Note {
  id: string;
  title: string | null;
  content: string;
  source_file_ids: string[];
  created_at: string;
}

export async function getNotes(): Promise<Note[]> {
  const { userId } = await auth();
  if (!userId) return [];

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notes")
      .select("id, title, content, source_file_ids, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return [];
    return (data ?? []).map((n) => ({
      ...n,
      title: n.title ?? null,
      source_file_ids: Array.isArray(n.source_file_ids) ? n.source_file_ids : [],
    })) as Note[];
  } catch {
    return [];
  }
}

export async function generateNotes(
  fileIds: string[],
  title?: string | null
): Promise<{ noteId?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };

  const ids = Array.isArray(fileIds) ? fileIds : [fileIds].filter(Boolean);
  if (ids.length === 0) return { error: "Select at least one file." };

  try {
    const supabase = createAdminClient();
    const { data: files, error: filesError } = await supabase
      .from("study_files")
      .select("id, name, extracted_text")
      .in("id", ids)
      .eq("user_id", userId);

    if (filesError || !files?.length) return { error: "File(s) not found." };
    const combined = files
      .map((f) => f.extracted_text?.trim())
      .filter(Boolean)
      .join("\n\n---\n\n");
    if (!combined) return { error: "No text was extracted from the selected file(s). Try re-uploading." };

    const { content, title: aiTitle, error: genError } = await generateNotesFromText(combined, {
      title: title?.trim() || undefined,
    });
    if (genError) return { error: genError };
    if (!content) return { error: "Could not generate notes." };

    const displayTitle = (title?.trim() || aiTitle || files[0]?.name || "Notes") as string | null;

    const { data: note, error: insertError } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        source_file_ids: ids,
        title: displayTitle,
        content,
      })
      .select("id")
      .single();

    if (insertError) return { error: insertError.message };
    revalidatePath("/notes");
    return { noteId: note.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to generate notes" };
  }
}

export async function saveNote(
  noteId: string,
  title: string | null,
  content: string
): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("notes")
      .update({ title, content })
      .eq("id", noteId)
      .eq("user_id", userId);

    if (error) return { error: error.message };
    revalidatePath("/notes");
    return {};
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save note" };
  }
}

export async function saveNoteAs(
  title: string | null,
  content: string,
  sourceFileIds: string[]
): Promise<{ noteId?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: userId,
        source_file_ids: sourceFileIds,
        title,
        content,
      })
      .select("id")
      .single();

    if (error) return { error: error.message };
    revalidatePath("/notes");
    return { noteId: data.id };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Failed to save note copy" };
  }
}
