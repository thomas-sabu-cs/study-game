import Link from "next/link";
import { Gamepad2, BookOpen, Flag, List, Clock } from "lucide-react";
import { getQuizzes, getRecentAttempts, getRecentlyDeletedQuizzes } from "./actions";
import { getFlashcards } from "@/app/cards/actions";
import { PlayTabs } from "./PlayTabs";

export const dynamic = "force-dynamic";

export default async function PlayPage() {
  let quizzes: Awaited<ReturnType<typeof getQuizzes>> = [];
  let recents: Awaited<ReturnType<typeof getRecentAttempts>> = [];
  let recentlyDeleted: Awaited<ReturnType<typeof getRecentlyDeletedQuizzes>> = [];
  let flashcards: Awaited<ReturnType<typeof getFlashcards>> = [];
  let loadError: string | null = null;
  try {
    [quizzes, recents, recentlyDeleted, flashcards] = await Promise.all([
      getQuizzes(),
      getRecentAttempts(),
      getRecentlyDeletedQuizzes(),
      getFlashcards(),
    ]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Could not load play data.";
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <Gamepad2 className="h-8 w-8 text-pastel-leaf" />
          Play
        </h1>
        <p className="mb-6">
          Choose a game type and a quiz to play. Quizzes are saved—generate in the Locker, then pick one here. Recents shows your latest scores.
        </p>

        {loadError && (
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-sm text-amber-800">
            {loadError}
          </p>
        )}
        <div className="mb-6">
          <Link
            href="/play/flagged"
            className="inline-flex items-center gap-2 rounded-xl border border-pastel-sage/50 bg-white/70 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-mint/50 transition"
          >
            <Flag className="h-4 w-4" />
            Flagged & reported
          </Link>
        </div>

        <PlayTabs
          quizzes={quizzes}
          recents={recents}
          recentlyDeleted={recentlyDeleted}
          flashcards={flashcards}
        />
      </div>
    </main>
  );
}
