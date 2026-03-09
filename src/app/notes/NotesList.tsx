"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, FileText, Download, PenSquare } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Note } from "./actions";
import { saveNote, saveNoteAs } from "./actions";

export function NotesList({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftContent, setDraftContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (notes.length === 0) {
    return (
      <p className="rounded-lg bg-pastel-mint/40 px-3 py-2 text-sm text-gray-600">
        No notes yet. Upload files and generate notes above.
      </p>
    );
  }

  function startEditing(note: Note) {
    setExpandedId(note.id);
    setEditingId(note.id);
    setDraftTitle(note.title || "");
    setDraftContent(note.content);
    setError(null);
  }

  async function handleSave(note: Note) {
    setSaving(true);
    setError(null);
    const res = await saveNote(note.id, draftTitle.trim() || null, draftContent);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function handleSaveAs(note: Note) {
    setSaving(true);
    setError(null);
    const res = await saveNoteAs(draftTitle.trim() || note.title || null, draftContent, note.source_file_ids);
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  function handleDownload(note: Note) {
    const blob = new Blob([note.content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${note.title || "notes"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <ul className="space-y-2">
      {notes.map((note) => {
        const isExpanded = expandedId === note.id;
        const isEditing = editingId === note.id;
        return (
          <li
            key={note.id}
            className="overflow-hidden rounded-xl border border-pastel-sage/50 bg-white"
          >
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : note.id)}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-pastel-mint/30"
            >
              <span className="flex items-center gap-2 font-medium text-gray-800">
                <FileText className="h-4 w-4 text-pastel-leaf" />
                {note.title || "Untitled notes"}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(note.created_at).toLocaleDateString()}
              </span>
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              )}
            </button>
            {isExpanded && (
              <div className="border-t border-pastel-sage/30 bg-pastel-cream/30 px-4 py-4">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {!isEditing && (
                    <button
                      type="button"
                      onClick={() => startEditing(note)}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-sage px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-pastel-leaf transition"
                    >
                      <PenSquare className="h-3.5 w-3.5" />
                      Edit
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownload(note)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-mint px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-pastel-sage transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download .md
                  </button>
                  {isEditing && (
                    <>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSave(note)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-leaf px-3 py-1.5 text-xs font-medium text-white hover:bg-pastel-sage transition disabled:opacity-60"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => handleSaveAs(note)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-butter px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-pastel-sage transition disabled:opacity-60"
                      >
                        Save as new
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setError(null);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
                {error && isEditing && (
                  <p className="mb-2 text-xs text-red-600">{error}</p>
                )}
                {isEditing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={draftTitle}
                      onChange={(e) => setDraftTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full rounded-lg border border-pastel-sage/60 px-3 py-2 text-sm"
                    />
                    <textarea
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      rows={12}
                      className="w-full rounded-lg border border-pastel-sage/60 px-3 py-2 text-sm font-mono"
                    />
                  </div>
                ) : (
                  <div className="prose prose-sm max-w-none prose-headings:text-gray-800 prose-p:text-gray-700 prose-ul:text-gray-700 prose-li:text-gray-700">
                    <ReactMarkdown>{note.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
