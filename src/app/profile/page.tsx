import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { getUserSettings, updateUserSettings } from "./actions";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  await requireAuth();
  const settings = await getUserSettings();
  const mode = settings?.background_mode ?? "stars";

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl space-y-6 rounded-2xl border border-pastel-sage/50 bg-white/70 p-6 shadow-sm">
        <h1 className="mb-2 text-2xl font-bold text-gray-800">Profile & settings</h1>
        <p className="text-sm text-gray-600">
          Personalize how Study Game looks and feels while you&apos;re studying.
        </p>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-800">Background</h2>
          <form
            action={async (formData: FormData) => {
              "use server";
              await updateUserSettings(formData);
              redirect("/play");
            }}
            className="space-y-3"
          >
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
      </div>
    </main>
  );
}

async function requireAuth() {
  const { userId } = await auth();
  if (!userId) redirect("/");
}

