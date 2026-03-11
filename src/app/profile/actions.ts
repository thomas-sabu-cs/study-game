"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAppUserId } from "@/lib/appUser";

export type BackgroundMode = "stars" | "starsLight" | "perlin";

export interface UserSettings {
  user_id: string;
  background_mode: BackgroundMode;
}

export async function getUserSettings(): Promise<UserSettings | null> {
  const userId = await getAppUserId();
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("user_settings")
      .select("user_id, background_mode")
      .eq("user_id", userId)
      .maybeSingle();
    if (!data) return null;
    const mode = (data.background_mode as BackgroundMode) || "stars";
    return { user_id: data.user_id, background_mode: mode };
  } catch {
    return null;
  }
}

export async function updateUserSettings(formData: FormData): Promise<void> {
  const userId = await getAppUserId();
  const supabase = createAdminClient();
  const rawMode = (formData.get("background_mode") as string | null) || "stars";
  let background_mode: BackgroundMode = "stars";
  if (rawMode === "perlin") background_mode = "perlin";
  else if (rawMode === "starsLight") background_mode = "starsLight";
  await supabase
    .from("user_settings")
    .upsert(
      { user_id: userId, background_mode },
      { onConflict: "user_id" }
    );
}

