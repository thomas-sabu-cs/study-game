"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bookmark, Trash2 } from "lucide-react";
import { unflagQuestion } from "../actions";
import type { FlaggedItem } from "../actions";

export function FlaggedList({ items }: { items: FlaggedItem[] }) {
  const router = useRouter();
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleRemove(id: string) {
    setRemovingId(id);
    await unflagQuestion(id);
    setRemovingId(null);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-8 text-center">
        <p className="text-gray-500">No flagged or reported questions.</p>
        <p className="mt-1 text-sm text-gray-400">
          Use “Flag for review” or “Report wrong” on a quiz question to see it here.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-2xl border border-pastel-sage/50 bg-white/70 p-4 shadow-sm"
        >
          <div className="mb-2 flex items-center gap-2">
            {item.flag_type === "report" ? (
              <AlertTriangle className="h-4 w-4 text-pastel-blossom" />
            ) : (
              <Bookmark className="h-4 w-4 text-pastel-leaf" />
            )}
            <span className="text-sm font-medium text-gray-600">
              {item.flag_type === "report" ? "Reported (possibly wrong)" : "Flagged for review"}
            </span>
          </div>
          {item.question && (
            <>
              <p className="mb-1 font-medium text-gray-800">{item.question.question}</p>
              <p className="text-sm text-gray-600">
                Correct:{" "}
                {item.question.options.find((o) => o.isCorrect)?.text ?? "—"}
              </p>
              {item.question.explanation && (
                <p className="mt-2 text-sm text-gray-500">{item.question.explanation}</p>
              )}
            </>
          )}
          {item.note && (
            <p className="mt-2 rounded bg-pastel-blossom/20 px-2 py-1 text-sm text-gray-700">
              Your note: {item.note}
            </p>
          )}
          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => handleRemove(item.id)}
              disabled={removingId === item.id}
              className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              Remove from list
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
