"use server";

import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateQuizQuestions } from "@/lib/ai/gemini";
import { extractTextFromBuffer } from "@/lib/extract/text";
import type { StudyFile } from "@/types";

const BUCKET = "study-files";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIMES = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function uploadFile(formData: FormData): Promise<{ error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };

  const file = formData.get("file") as File | null;
  const subjectId = formData.get("subjectId") as string | null;
  if (!file || !subjectId) return { error: "Missing file or subject" };
  if (file.size > MAX_FILE_BYTES) return { error: "File too large. Maximum size is 10 MB." };

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
    const { data: subject } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("user_id", userId)
      .single();
    if (!subject) return { error: "Subject not found" };

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
    const storagePath = `${userId}/${subjectId}/${crypto.randomUUID()}_${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: mime, upsert: false });

    if (uploadError) {
      const msg = uploadError.message ?? "";
      if (msg.includes("Bucket") || msg.includes("bucket") || msg.includes("not found") || msg.includes("NotFound"))
        return {
          error: 'Storage bucket "study-files" not found. In Supabase Dashboard go to Storage → New bucket → name it "study-files".',
        };
      return { error: msg || "Storage upload failed." };
    }

    const { text, error: extractError } = await extractTextFromBuffer(buffer, mime);
    if (extractError && !text) return { error: extractError };

    const { error: insertError } = await supabase.from("study_files").insert({
      subject_id: subjectId,
      user_id: userId,
      name: file.name || safeName,
      storage_path: storagePath,
      extracted_text: text || null,
    });

    if (insertError) {
      console.error("Insert study_files:", insertError.message);
      return { error: insertError.message || "Failed to save file record." };
    }
    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/subjects/${subjectId}`);
    return {};
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("uploadFile error:", err.message);
    if (err.message.includes("SUPABASE") || err.message.includes("Missing")) return { error: err.message };
    return { error: err.message || "Upload failed. Check the server terminal." };
  }
}

export async function getFilesForSubject(subjectId: string): Promise<StudyFile[]> {
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

    if (error) {
      console.error("getFilesForSubject:", error.message);
      return [];
    }
    return (data ?? []) as StudyFile[];
  } catch {
    return [];
  }
}

export async function generateQuiz(fileIds: string[]): Promise<{ quizId?: string; error?: string }> {
  const { userId } = await auth();
  if (!userId) return { error: "Not signed in" };
  const ids = Array.isArray(fileIds) ? fileIds : [fileIds].filter(Boolean);
  if (ids.length === 0) return { error: "Select at least one file." };

  try {
    const supabase = createAdminClient();
    const { data: files, error: filesError } = await supabase
      .from("study_files")
      .select("id, extracted_text")
      .in("id", ids)
      .eq("user_id", userId);

    if (filesError || !files?.length) return { error: "File(s) not found." };
    const combined = files
      .map((f) => f.extracted_text?.trim())
      .filter(Boolean)
      .join("\n\n---\n\n");
    if (!combined) return { error: "No text was extracted from the selected file(s). Try re-uploading." };

    const { questions, error: genError } = await generateQuizQuestions(combined);
    if (genError) return { error: genError };
    if (!questions.length) return { error: "Could not generate any questions. Try again." };

    const firstFileId = ids[0];
    const { data: quiz, error: insertError } = await supabase
      .from("quizzes")
      .insert({
        file_id: firstFileId,
        user_id: userId,
        questions,
        source_file_ids: ids,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("insert quiz:", insertError.message);
      return { error: insertError.message };
    }
    revalidatePath("/dashboard");
    revalidatePath("/play");
    return { quizId: quiz.id };
  } catch (e) {
    console.error("generateQuiz:", e);
    return { error: e instanceof Error ? e.message : "Failed to generate quiz" };
  }
}
