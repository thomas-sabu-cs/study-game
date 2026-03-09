"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import type { NoteSummary } from "./actions";
import { generateFlashcardsFromNote } from "./actions";

export function GenerateFromNoteForm({ notes }: { notes: NoteSummary[] }) {
  const [noteId, setNoteId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await generateFlashcardsFromNote(noteId);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Generated cards from note!");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Choose a note</label>
        <select
          value={noteId}
          onChange={(e) => setNoteId(e.target.value)}
          className="w-full rounded-lg border border-pastel-sage/60 px-3 py-2 text-sm bg-white"
        >
          <option value="">Select a note…</option>
          {notes.map((n) => (
            <option key={n.id} value={n.id}>
              {(n.title || "Untitled notes") + " – " + new Date(n.created_at).toLocaleDateString()}
            </option>
          ))}
        </select>
        {notes.length === 0 && (
          <p className="mt-1 text-xs text-gray-500">
            You don&apos;t have any Notes yet. Create some in the Notes tab first.
          </p>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-pastel-leaf">{success}</p>}
      <button
        type="submit"
        disabled={isPending || !noteId}
        className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-pastel-leaf disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Generate cards
      </button>
    </form>
  );
}

