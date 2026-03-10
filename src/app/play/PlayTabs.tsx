"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { List, History, BookOpen, Clock, HelpCircle, Layers, Trash2, RotateCcw, Library } from "lucide-react";
import {
  deleteQuiz,
  restoreQuiz,
  permanentlyDeleteQuiz,
  type RecentAttempt,
  type QuizListItem,
  type DeletedQuizItem,
} from "./actions";
import type { Flashcard } from "@/app/cards/actions";
import { FlashcardGameClient } from "@/app/cards/FlashcardGameClient";

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

function QuizStats({ q }: { q: QuizListItem }) {
  const played = q.times_played ?? 0;
  if (played === 0) return null;
  const parts: string[] = [];
  parts.push(`${played} play${played !== 1 ? "s" : ""}`);
  if (q.best_accuracy_pct != null) parts.push(`Best ${q.best_accuracy_pct}%`);
  if (q.best_time_seconds != null && q.best_time_seconds > 0)
    parts.push(`Best ${formatTime(q.best_time_seconds)}`);
  return (
    <span className="text-xs text-gray-500 mt-0.5 block">
      {parts.join(" · ")}
    </span>
  );
}

export function PlayTabs({
  quizzes,
  recents,
  recentlyDeleted,
  flashcards,
}: {
  quizzes: QuizListItem[];
  recents: RecentAttempt[];
  recentlyDeleted: DeletedQuizItem[];
  flashcards: Flashcard[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"quizzes" | "recents" | "deleted">("quizzes");
  const [gameType, setGameType] = useState<"quiz" | "match" | "flashcards">("quiz");

  return (
    <div className="card-surface overflow-hidden">
      {/* Game type: Quiz (active), Match / Notecards (coming soon) */}
      <div className="border-b border-pastel-sage/40 px-2 pt-2">
        <p className="text-xs font-medium mb-2 px-2">Game type</p>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setGameType("quiz")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-t-lg text-sm font-medium transition ${
              gameType === "quiz"
                ? "bg-pastel-sage/80 text-gray-900"
                : "text-gray-800 hover:bg-pastel-mint/30"
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
                ? "bg-pastel-sage/80 text-gray-900"
                : "text-gray-800 hover:bg-pastel-mint/30"
            }`}
          >
            <Layers className="h-4 w-4" />
            Match
          </button>
          <button
            type="button"
            onClick={() => setGameType("flashcards")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-t-lg text-sm font-medium transition ${
              gameType === "flashcards"
                ? "bg-pastel-sage/80 text-gray-900"
                : "text-gray-800 hover:bg-pastel-mint/30"
            }`}
          >
            <Library className="h-4 w-4" />
            Flip
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
        <button
          type="button"
          onClick={() => setTab("deleted")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
            tab === "deleted"
              ? "bg-pastel-sage/60 text-gray-800"
              : "text-gray-600 hover:bg-pastel-mint/30"
          }`}
        >
          <Trash2 className="h-4 w-4" />
          Recently deleted
        </button>
      </div>

      <div className="p-4">
        {tab === "quizzes" ? (
          <>
            {gameType === "flashcards" && (
              <>
                <div className="mb-4">
                  <FlashcardGameClient cards={flashcards} />
                </div>
                <Link
                  href="/cards"
                  className="inline-flex items-center gap-2 rounded-xl border border-pastel-sage/50 bg-white/70 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-mint/50 transition"
                >
                  <BookOpen className="h-4 w-4" />
                  Manage notecards
                </Link>
              </>
            )}
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
                        <div className="flex items-center gap-2 rounded-xl border border-pastel-sage/40 bg-white px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/play/preview/${q.id}`}
                              className="text-sm font-medium text-gray-800 hover:text-pastel-leaf transition"
                            >
                              {quizDisplayName(q)}
                            </Link>
                            <QuizStats q={q} />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              await deleteQuiz(q.id);
                              router.refresh();
                            }}
                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete quiz"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
                        <div className="flex items-center gap-2 rounded-xl border border-pastel-sage/40 bg-white px-4 py-3">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/play/match/${q.id}`}
                              className="text-sm font-medium text-gray-800 hover:text-pastel-leaf transition"
                            >
                              {quizDisplayName(q)}
                            </Link>
                            <QuizStats q={q} />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">
                            {new Date(q.created_at).toLocaleDateString()}
                          </span>
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.preventDefault();
                              await deleteQuiz(q.id);
                              router.refresh();
                            }}
                            className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete quiz"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 text-xs text-gray-500">
                  Match uses your quiz questions and correct answers. (True/False questions are skipped.)
                </p>
              </>
            )}
            {gameType !== "flashcards" && (
              <Link
                href="/dashboard"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
              >
                <BookOpen className="h-4 w-4" />
                Go to Locker
              </Link>
            )}
          </>
        ) : tab === "deleted" ? (
          <>
            {recentlyDeleted.length === 0 ? (
              <p className="text-gray-500 py-4">
                No recently deleted quizzes. Deleted quizzes appear here until you permanently delete them.
              </p>
            ) : (
              <ul className="space-y-2">
                {recentlyDeleted.map((q) => (
                  <li key={q.id}>
                    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-pastel-sage/40 bg-white px-4 py-3">
                      <span className="flex-1 min-w-0 text-sm font-medium text-gray-800">
                        {quizDisplayName(q)}
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">
                        Deleted {new Date(q.deleted_at).toLocaleDateString()}
                      </span>
                      <div className="flex gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            await restoreQuiz(q.id);
                            router.refresh();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-pastel-sage/50 bg-pastel-mint/30 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-pastel-mint/50 transition"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await permanentlyDeleteQuiz(q.id);
                            router.refresh();
                          }}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 transition"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Permanently delete
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            {recents.length === 0 ? (
              <p className="text-gray-500 py-4">
                No attempts yet. Play a game to see your recent history here.
              </p>
            ) : (
              <ul className="space-y-2">
                {recents
                  .filter((a) => {
                    const t = a.game_type ?? "quiz";
                    if (gameType === "quiz") return t === "quiz";
                    if (gameType === "match") return t === "match";
                    if (gameType === "flashcards") return t === "flip";
                    return true;
                  })
                  .map((a) => {
                    const t = a.game_type ?? "quiz";
                    const href =
                      t === "match"
                        ? `/play/match/${a.quiz_id}`
                        : `/play/${a.quiz_id}`;
                    const label =
                      t === "match" ? "Match" : t === "flip" ? "Flip" : "Quiz";
                    return (
                      <li key={a.id}>
                        <Link
                          href={href}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-pastel-sage/40 bg-white px-4 py-3 text-sm hover:bg-pastel-mint/30 transition"
                        >
                          <span className="inline-flex items-center gap-2 font-medium text-gray-800">
                            <span className="inline-flex items-center rounded-full border border-pastel-sage/70 bg-pastel-mint/40 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-700">
                              {label}
                            </span>
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
                    );
                  })}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}
