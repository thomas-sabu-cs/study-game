"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { generateNotes } from "./actions";
import type { StudyFile } from "@/types";

export function NotesFileList({
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
  const [noteTitle, setNoteTitle] = useState("");
  const [highlightId, setHighlightId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const id = window.localStorage.getItem("study-game-highlight-notes-file");
      if (!id) return;
      window.localStorage.removeItem("study-game-highlight-notes-file");
      setHighlightId(id);
      setTimeout(() => {
        const el = document.getElementById(`notes-file-${id}`);
        el?.scrollIntoView({ block: "center", behavior: "smooth" });
      }, 50);
      setTimeout(() => setHighlightId(null), 2200);
    } catch {
      // ignore
    }
  }, [files.length]);

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
    const result = await generateNotes(ids, noteTitle.trim() || undefined);
    setGenerating(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.noteId) {
      setNoteTitle("");
      router.refresh();
    }
  }

  if (files.length === 0) {
    return (
      <p className="rounded-lg bg-pastel-mint/40 px-3 py-2 text-sm text-gray-600">
        No files yet. Upload a document above.
      </p>
    );
  }

  const readyFiles = files.filter((f) => f.extracted_text);
  const noneSelected = selected.size === 0;

  return (
    <div className="space-y-3">
      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}
      <ul className="space-y-2">
        {files.map((file) => (
          <li
            key={file.id}
            id={`notes-file-${file.id}`}
            className={`flex flex-wrap items-center gap-2 rounded-xl border bg-white/70 px-4 py-3 transition ${
              highlightId === file.id
                ? "border-pastel-blossom ring-2 ring-pastel-blossom/60 bg-pastel-blossom/10"
                : "border-pastel-sage/50"
            }`}
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
                <p className="truncate font-medium text-gray-800">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {file.extracted_text ? "Ready for notes" : "No text extracted"}
                </p>
              </div>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-end gap-2 pt-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">Note title (optional)</span>
          <input
            type="text"
            value={noteTitle}
            onChange={(e) => setNoteTitle(e.target.value)}
            placeholder="e.g. Chapter 1 Summary"
            className="w-64 max-w-full rounded-lg border border-pastel-sage/50 px-3 py-2 text-sm"
          />
        </label>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || noneSelected}
          className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-pastel-leaf disabled:cursor-not-allowed disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          {generating
            ? "Generating…"
            : selected.size > 0
              ? `Generate notes from ${selected.size} file(s)`
              : "Select files above"}
        </button>
      </div>
    </div>
  );
}
