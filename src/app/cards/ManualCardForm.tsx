"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { createFlashcard } from "./actions";

export function ManualCardForm() {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await createFlashcard(front, back);
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess("Saved!");
        setFront("");
        setBack("");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Front (prompt)</label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-pastel-sage/60 px-3 py-2 text-sm"
          placeholder="e.g. What is classical conditioning?"
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-gray-600">Back (answer)</label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-pastel-sage/60 px-3 py-2 text-sm"
          placeholder="Short, clear answer or definition."
        />
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {success && <p className="text-xs text-pastel-leaf">{success}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-pastel-leaf disabled:opacity-60"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save card
      </button>
    </form>
  );
}

