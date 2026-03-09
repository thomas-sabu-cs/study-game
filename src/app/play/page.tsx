import Link from "next/link";
import { Gamepad2, BookOpen, Flag, List, Clock } from "lucide-react";
import { getQuizzes, getRecentAttempts } from "./actions";
import { PlayTabs } from "./PlayTabs";

export const dynamic = "force-dynamic";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

export default async function PlayPage() {
  const [quizzes, recents] = await Promise.all([getQuizzes(), getRecentAttempts()]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pastel-cream to-pastel-butter/30 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-800">
          <Gamepad2 className="h-8 w-8 text-pastel-leaf" />
          Play
        </h1>
        <p className="mb-6 text-gray-600">
          Take quizzes from your study files, or pick one below. Check Recents to see your latest scores.
        </p>

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
          formatTime={formatTime}
        />
      </div>
    </main>
  );
}
