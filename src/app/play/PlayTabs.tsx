"use client";

import { useState } from "react";
import Link from "next/link";
import { List, History, BookOpen, Clock, HelpCircle, Layers, Library } from "lucide-react";
import type { RecentAttempt, QuizListItem } from "./actions";

function quizDisplayName(q: QuizListItem): string {
  if (q.name?.trim()) return q.name.trim();
  return `Quiz ${new Date(q.created_at).toLocaleDateString()}`;
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function PlayTabs({
  quizzes,
  recents,
}: {
  quizzes: QuizListItem[];
  recents: RecentAttempt[];
}) {
  const [tab, setTab] = useState<"quizzes" | "recents">("quizzes");
  const [gameType, setGameType] = useState<"quiz" | "match" | "notecards">("quiz");

  return (
    <div className="rounded-2xl border border-pastel-sage/50 bg-white/60 shadow-sm overflow-hidden">
      {/* Game type: Quiz (active), Match / Notecards (coming soon) */}
      <div className="border-b border-pastel-sage/40 px-2 pt-2">
        <p className="text-xs font-medium text-gray-500 mb-2 px-2">Game type</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setGameType("quiz")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-t-lg text-sm font-medium transition ${
              gameType === "quiz"
                ? "bg-pastel-sage/70 text-gray-800"
                : "text-gray-600 hover:bg-pastel-mint/30"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            Quiz
          </button>
          <button
            type="button"
            onClick={() => setGameType("match")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-t-lg text-sm font-medium transition ${
              gameType === "match"
                ? "bg-pastel-sage/70 text-gray-800"
                : "text-gray-600 hover:bg-pastel-mint/30"
            }`}
          >
            <Layers className="h-4 w-4" />
            Match
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-t-lg text-sm font-medium text-gray-400 cursor-not-allowed"
          >
            <Library className="h-4 w-4" />
            Notecards
          </button>
        </div>
      </div>
      <div className="flex border-b border-pastel-sage/40">
        <button
          type="button"
          onClick={() => setTab("quizzes")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
            tab === "quizzes"
              ? "bg-pastel-sage/60 text-gray-800"
              : "text-gray-600 hover:bg-pastel-mint/30"
          }`}
        >
          <List className="h-4 w-4" />
          Your quizzes
        </button>
        <button
          type="button"
          onClick={() => setTab("recents")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
            tab === "recents"
              ? "bg-pastel-sage/60 text-gray-800"
              : "text-gray-600 hover:bg-pastel-mint/30"
          }`}
        >
          <History className="h-4 w-4" />
          Recents
        </button>
      </div>

      <div className="p-4">
        {tab === "quizzes" ? (
          <>
            {gameType === "quiz" && (
              <>
                {quizzes.length === 0 ? (
                  <p className="text-gray-500 py-4">
                    No quizzes yet. Add files in your Locker and generate a quiz.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {quizzes.map((q) => (
                      <li key={q.id}>
                        <Link
                          href={`/play/${q.id}`}
                          className="block rounded-xl border border-pastel-sage/40 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-pastel-mint/40 transition"
                        >
                          {quizDisplayName(q)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
            {gameType === "match" && (
              <>
                {quizzes.length === 0 ? (
                  <p className="text-gray-500 py-4">
                    No quizzes yet. Add files in your Locker and generate a quiz.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {quizzes.map((q) => (
                      <li key={q.id}>
                        <Link
                          href={`/play/match/${q.id}`}
                          className="block rounded-xl border border-pastel-sage/40 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-pastel-mint/40 transition"
                        >
                          {quizDisplayName(q)}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-gray-500">
                  Match uses your quiz questions and correct answers. (True/False questions are skipped.)
                </p>
              </>
            )}
            {gameType === "notecards" && (
              <p className="text-gray-500 py-4">Notecards coming soon. Pick a quiz above when it&apos;s ready.</p>
            )}
            <Link
              href="/dashboard"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
            >
              <BookOpen className="h-4 w-4" />
              Go to Locker
            </Link>
          </>
        ) : (
          <>
            {recents.length === 0 ? (
              <p className="text-gray-500 py-4">
                No attempts yet. Take a quiz to see your scores and times here.
              </p>
            ) : (
              <ul className="space-y-2">
                {recents.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`/play/${a.quiz_id}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pastel-sage/40 bg-white px-4 py-3 text-sm hover:bg-pastel-mint/30 transition"
                    >
                      <span className="font-medium text-gray-800">
                        {a.score} / {a.total}
                      </span>
                      <span className="flex items-center gap-1.5 text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime(a.time_seconds || 0)}
                      </span>
                      <span className="w-full text-xs text-gray-400">
                        {new Date(a.created_at).toLocaleString()}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
