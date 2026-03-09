"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import type { Flashcard } from "./actions";
import { updateFlashcard, deleteFlashcard, createQuizFromAllFlashcards } from "./actions";

export function FlashcardList({ cards }: { cards: Flashcard[] }) {
  const [expanded, setExpanded] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFront, setEditFront] = useState("");
  const [editBack, setEditBack] = useState("");
  const [quizName, setQuizName] = useState("");
  const [quizError, setQuizError] = useState<string | null>(null);
  const [isQuizPending, startQuizTransition] = useTransition();
  const [isEditPending, startEditTransition] = useTransition();
  const router = useRouter();

  if (cards.length === 0) {
    return (
      <p className="rounded-lg bg-pastel-mint/40 px-3 py-2 text-sm text-gray-600">
        No cards yet. Add one manually or generate from Notes.
      </p>
    );
  }

  const visible = expanded ? cards : cards.slice(0, 20);

  return (
    <div className="space-y-3">
      <ul className="space-y-2">
        {visible.map((c) => {
          const isEditing = editingId === c.id;
          return (
            <li
              key={c.id}
              className="rounded-xl border border-pastel-sage/50 bg-white/80 px-4 py-3 text-sm"
            >
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editFront}
                    onChange={(e) => setEditFront(e.target.value)}
                    className="w-full rounded-lg border border-pastel-sage/60 px-3 py-1.5 text-sm text-gray-800"
                    placeholder="Front"
                  />
                  <textarea
                    value={editBack}
                    onChange={(e) => setEditBack(e.target.value)}
                    rows={2}
                    className="w-full rounded-lg border border-pastel-sage/60 px-3 py-1.5 text-sm text-gray-800"
                    placeholder="Back"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isEditPending}
                      onClick={() => {
                        startEditTransition(async () => {
                          const res = await updateFlashcard(c.id, editFront, editBack);
                          if (!res.error) {
                            setEditingId(null);
                            router.refresh();
                          }
                        });
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-sage px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-pastel-leaf disabled:opacity-60"
                    >
                      {isEditPending ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-800">{c.front}</p>
                    <p className="mt-1 text-gray-600">{c.back}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(c.id);
                        setEditFront(c.front);
                        setEditBack(c.back);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-pastel-sage/60 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:bg-pastel-mint/30"
                    >
                      <Pencil className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const confirmed = window.confirm("Delete this card?");
                        if (!confirmed) return;
                        const res = await deleteFlashcard(c.id);
                        if (!res.error) router.refresh();
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-3 w-3" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {cards.length > 20 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="inline-flex items-center gap-1 text-xs font-medium text-pastel-leaf hover:underline"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3" /> Show less
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3" /> Show all {cards.length} cards
            </>
          )}
        </button>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-2 border-t border-pastel-sage/40 pt-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Quiz name from notecards (optional)</span>
          <input
            type="text"
            value={quizName}
            onChange={(e) => setQuizName(e.target.value)}
            placeholder="e.g. Notecards review"
            className="w-64 max-w-full rounded-lg border border-pastel-sage/50 px-3 py-1.5 text-sm"
          />
        </label>
        <button
          type="button"
          disabled={isQuizPending || cards.length === 0}
          onClick={() => {
            setQuizError(null);
            startQuizTransition(async () => {
              const res = await createQuizFromAllFlashcards(quizName.trim() || undefined);
              if (res.error) {
                setQuizError(res.error);
                return;
              }
              if (res.quizId) {
                setQuizName("");
                router.push(`/play/${res.quizId}`);
              }
            });
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-xs font-medium text-gray-800 hover:bg-pastel-leaf disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isQuizPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          {isQuizPending ? "Building quiz…" : "Create quiz from all cards"}
        </button>
        {quizError && (
          <p className="w-full text-xs text-red-600">
            {quizError}
          </p>
        )}
      </div>
    </div>
  );
}

