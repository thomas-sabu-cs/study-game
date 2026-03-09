"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { Flashcard } from "./actions";

export function FlashcardList({ cards }: { cards: Flashcard[] }) {
  const [expanded, setExpanded] = useState<boolean>(false);

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
        {visible.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-pastel-sage/50 bg-white/80 px-4 py-3 text-sm"
          >
            <p className="font-medium text-gray-800">{c.front}</p>
            <p className="mt-1 text-gray-600">{c.back}</p>
          </li>
        ))}
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
    </div>
  );
}

