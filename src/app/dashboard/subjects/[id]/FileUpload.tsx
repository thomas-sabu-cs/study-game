"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { FileUp, Loader2 } from "lucide-react";
import { uploadFile } from "./actions";

export function FileUpload({ subjectId }: { subjectId: string }) {
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
    formData.set("subjectId", subjectId);
    try {
      const result = await uploadFile(formData);
      if (result && typeof result === "object" && "error" in result && result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
      input.value = "";
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.toLowerCase().includes("fetch") || msg.toLowerCase().includes("network") || msg.toLowerCase().includes("unexpected")) {
        setError("Upload failed. Use a file under 4 MB and try again. If it still fails, check your connection.");
      } else {
        setError(msg || "Upload failed. Try again.");
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex-1 min-w-[180px]">
          <span className="mb-1 block text-sm font-medium text-gray-600">PDF, TXT, or image (JPEG/PNG/WebP)</span>
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
          className="flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf disabled:opacity-60 transition"
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />}
          {pending ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
