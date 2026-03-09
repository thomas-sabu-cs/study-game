"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { generateQuiz } from "./actions";
import type { StudyFile } from "@/types";

export function FileList({
  files,
  subjectId,
}: {
  files: StudyFile[];
  subjectId: string;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (fileId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  async function handleGenerate() {
    const ids = Array.from(selected);
    if (ids.length === 0) {
      setError("Select at least one file.");
      return;
    }
    setGenerating(true);
    setError(null);
    const result = await generateQuiz(ids);
    setGenerating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.quizId) {
      router.push(`/play/${result.quizId}`);
    }
  }

  if (files.length === 0) {
    return (
      <p className="rounded-lg bg-pastel-mint/40 px-3 py-2 text-sm text-gray-600">
        No files yet. Upload a PDF or TXT above.
      </p>
    );
  }

  const readyFiles = files.filter((f) => f.extracted_text);
  const noneSelected = selected.size === 0;

  return (
    <ul className="space-y-2">
      {error && (
        <li className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </li>
      )}
      {files.map((file) => (
        <li
          key={file.id}
          className="flex flex-wrap items-center gap-2 rounded-xl border border-pastel-sage/50 bg-white/70 px-4 py-3"
        >
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={selected.has(file.id)}
              onChange={() => toggle(file.id)}
              disabled={!file.extracted_text}
              className="h-4 w-4 rounded border-pastel-sage text-pastel-leaf focus:ring-pastel-leaf"
            />
            <FileText className="h-5 w-5 shrink-0 text-pastel-leaf" />
            <div className="min-w-0">
              <p className="font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-500">
                {file.extracted_text ? "Ready for quiz" : "No text extracted"}
              </p>
            </div>
          </label>
        </li>
      ))}
      <li className="pt-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || noneSelected}
          className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating
            ? "Generating…"
            : selected.size > 0
              ? `Generate quiz from ${selected.size} file(s)`
              : "Select files above, then generate quiz"}
        </button>
      </li>
    </ul>
  );
}
