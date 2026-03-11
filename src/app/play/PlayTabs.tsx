"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  List,
  History,
  BookOpen,
  Clock,
  HelpCircle,
  Layers,
  Trash2,
  RotateCcw,
  Library,
  Loader2,
} from "lucide-react";
import {
  deleteQuiz,
  restoreQuiz,
  permanentlyDeleteQuiz,
  type RecentAttempt,
  type DeletedQuizItem,
  type PlayDataset,
} from "./actions";
import { createQuizFromDeck } from "@/app/cards/actions";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function PlayTabs({
  datasets,
  recents,
  recentlyDeleted,
}: {
  datasets: PlayDataset[];
  recents: RecentAttempt[];
  recentlyDeleted: DeletedQuizItem[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"datasets" | "recents" | "deleted">("datasets");
  const [selectedDataset, setSelectedDataset] = useState<PlayDataset | null>(null);
  const [deckPending, startDeckTransition] = useTransition();

  return (
    <div className="card-surface overflow-hidden">
      <div className="flex border-b border-pastel-sage/40">
        <button
          type="button"
          onClick={() => setTab("datasets")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition ${
            tab === "datasets"
              ? "bg-pastel-sage/60 text-gray-800"
              : "text-gray-600 hover:bg-pastel-mint/30"
          }`}
        >
          <List className="h-4 w-4" />
          Choose dataset
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
        {tab === "datasets" ? (
          <>
            <p className="text-xs text-gray-600 mb-3">
              Pick a dataset (locker quiz or notecard folder), then choose a game type.
            </p>
            <label className="block mb-3">
              <span className="text-xs font-medium text-gray-700 block mb-1">Dataset</span>
              <select
                value={selectedDataset ? `${selectedDataset.type}:${selectedDataset.id}` : ""}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v) {
                    setSelectedDataset(null);
                    return;
                  }
                  const [type, id] = v.split(":");
                  const name = datasets.find((d) => d.type === type && d.id === id)?.name ?? "";
                  setSelectedDataset({ type: type as "quiz" | "deck", id, name });
                }}
                className="w-full rounded-xl border border-pastel-sage/50 bg-white px-4 py-2.5 text-sm text-gray-800"
              >
                <option value="">Select a dataset…</option>
                {datasets.map((d) => (
                  <option key={`${d.type}-${d.id}`} value={`${d.type}:${d.id}`}>
                    {d.type === "quiz" ? "📋 " : "📁 "}
                    {d.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedDataset && (
              <div className="space-y-3 border-t border-pastel-sage/30 pt-4">
                <p className="text-xs font-medium text-gray-700">Game type</p>
                <div className="flex flex-wrap gap-2">
                  {selectedDataset.type === "quiz" && (
                    <>
                      <Link
                        href={`/play/preview/${selectedDataset.id}`}
                        className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
                      >
                        <HelpCircle className="h-4 w-4" />
                        Play Quiz
                      </Link>
                      <Link
                        href={`/play/match/${selectedDataset.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-pastel-sage/60 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-mint/40 transition"
                      >
                        <Layers className="h-4 w-4" />
                        Play Match
                      </Link>
                      <button
                        type="button"
                        onClick={async () => {
                          if (!confirm("Delete this quiz?")) return;
                          await deleteQuiz(selectedDataset.id);
                          setSelectedDataset(null);
                          router.refresh();
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete quiz
                      </button>
                    </>
                  )}
                  {selectedDataset.type === "deck" && (
                    <>
                      <button
                        type="button"
                        disabled={deckPending}
                        onClick={() => {
                          startDeckTransition(async () => {
                            const res = await createQuizFromDeck(selectedDataset.id);
                            if (res.quizId) router.push(`/play/preview/${res.quizId}`);
                          });
                        }}
                        className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition disabled:opacity-60"
                      >
                        {deckPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <HelpCircle className="h-4 w-4" />}
                        Play Quiz
                      </button>
                      <button
                        type="button"
                        disabled={deckPending}
                        onClick={() => {
                          startDeckTransition(async () => {
                            const res = await createQuizFromDeck(selectedDataset.id);
                            if (res.quizId) router.push(`/play/match/${res.quizId}`);
                          });
                        }}
                        className="inline-flex items-center gap-2 rounded-xl border border-pastel-sage/60 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-mint/40 transition disabled:opacity-60"
                      >
                        {deckPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
                        Play Match
                      </button>
                      <Link
                        href={`/play/flip/${selectedDataset.id}`}
                        className="inline-flex items-center gap-2 rounded-xl border border-pastel-sage/60 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-mint/40 transition"
                      >
                        <Library className="h-4 w-4" />
                        Play Flip
                      </Link>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage/80 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
              >
                <BookOpen className="h-4 w-4" />
                Go to Locker
              </Link>
              <Link
                href="/cards"
                className="inline-flex items-center gap-2 rounded-xl border border-pastel-sage/50 bg-white/70 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-mint/50 transition"
              >
                <BookOpen className="h-4 w-4" />
                Manage notecards
              </Link>
            </div>
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
                        {(q.name && q.name.trim()) || `Quiz ${new Date(q.created_at).toLocaleDateString()}`}
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
                {recents.map((a) => {
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
