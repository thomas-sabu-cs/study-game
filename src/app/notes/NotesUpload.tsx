"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { uploadFileForNotes } from "./actions";

export function NotesUpload({ subjectId: _subjectId }: { subjectId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const input = inputRef.current;
    const file = input?.files?.[0];
    if (!file) {
      setError("Choose a file first.");
      return;
    }
    const ext = (file.name || "").toLowerCase();
    const allowed = [".pdf", ".txt", ".jpg", ".jpeg", ".png", ".webp"];
    if (!allowed.some((e) => ext.endsWith(e))) {
      setError("Only PDF, TXT, and JPEG/PNG/WebP are allowed.");
      return;
    }
    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("file", file);
    try {
      const result = await uploadFileForNotes(formData);
      if (result?.duplicateFileId) {
        try {
          window.localStorage.setItem("study-game-highlight-notes-file", String(result.duplicateFileId));
        } catch {
          // ignore
        }
        setError(result.error || "That file is already uploaded (highlighted below).");
        router.refresh();
        return;
      }
      if (result?.error) {
        setError(result.error);
        return;
      }
      if (inputRef.current) inputRef.current.value = "";
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[180px] flex-1">
          <span className="mb-1 block text-sm font-medium text-gray-600">PDF, TXT, or image</span>
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.txt,.jpg,.jpeg,.png,.webp,application/pdf,text/plain,image/jpeg,image/png,image/webp"
            className="w-full rounded-lg border border-pastel-sage/60 bg-white px-3 py-2 text-sm text-gray-800 file:mr-2 file:rounded file:border-0 file:bg-pastel-sage file:px-3 file:py-1 file:text-sm file:font-medium"
          />
        </label>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 transition hover:bg-pastel-leaf disabled:opacity-60"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
