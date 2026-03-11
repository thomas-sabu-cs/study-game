"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Subject } from "@/types";
import { getAppUserId } from "@/lib/appUser";

// Reserved subject used by the Notes page; hidden from locker and not deletable.
const RESERVED_NOTES_SUBJECT_NAME = "Notes";

function friendlyDbError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("SUPABASE_SERVICE_ROLE_KEY") || error.message.includes("NEXT_PUBLIC_SUPABASE")) {
      return "Database keys are missing. Add SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to .env.local.";
    }
  }
  return "Database connection failed. Check your Supabase keys in .env.local.";
}

function friendlySupabaseError(message: string, code?: string): string {
  if (code === "42P01" || message.includes("does not exist") || message.includes("relation")) {
    return "The subjects table doesn't exist yet. Run the SQL in supabase/migrations/001_subjects.sql in your Supabase project (Dashboard → SQL Editor), then try again.";
  }
  return message;
}

export async function getSubjects(): Promise<Subject[]> {
  const userId = await getAppUserId();

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("subjects")
      .select("id, user_id, name, color, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      const msg = "message" in error ? (error as { message: string }).message : String(error);
      const code = "code" in error ? (error as { code?: string }).code : undefined;
      console.error("getSubjects failed:", code ?? msg, code ? `(${msg})` : "");
      return [];
    }
    const list = (data ?? []) as Subject[];
    return list.filter((s) => s.name !== RESERVED_NOTES_SUBJECT_NAME);
  } catch (err) {
    console.error("getSubjects error:", err instanceof Error ? err.message : err);
    return [];
  }
}

export async function createSubject(formData: FormData) {
  const userId = await getAppUserId();

  const name = (formData.get("name") as string)?.trim();
  if (!name) return { error: "Subject name is required" };

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("subjects").insert({
      user_id: userId,
      name,
      color: (formData.get("color") as string) || null,
    });

    if (error) {
      const code = "code" in error ? (error as { code?: string }).code : undefined;
      console.error("createSubject failed:", code ?? error.message, code ? `(${error.message})` : "");
      return {
        error: friendlySupabaseError(error.message, code),
      };
    }
    revalidatePath("/dashboard");
    return { error: null };
  } catch (err) {
    console.error("createSubject:", err);
    return { error: friendlyDbError(err) };
  }
}

export async function deleteSubject(id: string) {
  const userId = await getAppUserId();

  const supabase = createAdminClient();
  const { data: subject, error: fetchError } = await supabase
    .from("subjects")
    .select("id, name")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError || !subject) {
    return { error: "Subject not found." };
  }
  if (subject.name === RESERVED_NOTES_SUBJECT_NAME) {
    return {
      error:
        "The Notes subject is reserved for the Notes page and can't be deleted from the locker. Your notes and uploaded files are stored there.",
    };
  }

  const { error } = await supabase
    .from("subjects")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    const msg = "message" in error ? (error as { message: string }).message : String(error);
    console.error("deleteSubject failed:", msg);
    return { error: msg };
  }
  revalidatePath("/dashboard");
  return { error: null };
}

export async function deleteSubjectForm(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;
  await deleteSubject(id);
}
