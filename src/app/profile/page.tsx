import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings, updateUserSettings } from "./actions";
import { MusicSettingsClient } from "@/components/MusicSettingsClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams?: { from?: string };
}) {
  await requireAuth();
  const settings = await getUserSettings();
  const mode = settings?.background_mode ?? "stars";
  const from = typeof searchParams?.from === "string" ? searchParams.from : undefined;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-pastel-sage/50 bg-white/70 p-6 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-gray-800">Profile & settings</h1>
          {from && (
            <Link
              href={from}
              className="btn-dynamic inline-flex items-center gap-1.5 rounded-lg border border-pastel-sage/60 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-pastel-mint/40"
            >
              ← Back
            </Link>
          )}
        </div>
        <p className="text-sm text-gray-600">
          Personalize how Study Buddy looks and feels while you&apos;re studying.
        </p>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Background</h2>
          <form
            action={async (formData: FormData) => {
              "use server";
              await updateUserSettings(formData);
              const from = formData.get("from");
              if (typeof from === "string" && from) {
                redirect(from);
              }
              redirect("/play");
            }}
            className="space-y-3"
          >
            <input type="hidden" name="from" value={from ?? ""} />
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="background_mode"
                  value="stars"
                  defaultChecked={mode === "stars"}
                  className="h-4 w-4 text-pastel-leaf"
                />
                <span>
                  Dynamic **starfield** background{" "}
                  <span className="text-xs text-gray-500">(dark, moving stars)</span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="background_mode"
                  value="starsLight"
                  defaultChecked={mode === "starsLight"}
                  className="h-4 w-4 text-pastel-leaf"
                />
                <span>
                  Light **starfield** background{" "}
                  <span className="text-xs text-gray-500">(light blue-green with black stars)</span>
                </span>
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-800">
                <input
                  type="radio"
                  name="background_mode"
                  value="perlin"
                  defaultChecked={mode === "perlin"}
                  className="h-4 w-4 text-pastel-leaf"
                />
                <span>
                  Cozy **pastel Perlin** background{" "}
                  <span className="text-xs text-gray-500">(soft green + pink particles)</span>
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn-dynamic inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf"
            >
              Save background
            </button>
          </form>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Music</h2>
          <p className="text-xs text-gray-600">
            Choose which track should play when Music is on. You can add more MP3 files under{" "}
            <code className="rounded bg-gray-100 px-1 py-0.5 text-[11px]">public/audio</code> and wire them into the
            list.
          </p>
          <MusicSettingsClient />
        </section>
      </div>
    </main>
  );
}

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect("/");
}

