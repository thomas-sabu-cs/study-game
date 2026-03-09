"use client";

import { useEffect, useState } from "react";
import { createSubject } from "./actions";

// Solid rainbow-ish palette, left→right: red → violet
const SUBJECT_COLORS = [
  { name: "Red", value: "#ef9a9a" },
  { name: "Orange", value: "#ffcc80" },
  { name: "Yellow", value: "#fff59d" },
  { name: "Green", value: "#a5d6a7" },
  { name: "Blue", value: "#90caf9" },
  { name: "Indigo", value: "#9fa8da" },
  { name: "Violet", value: "#ce93d8" },
];

export function AddSubjectForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(SUBJECT_COLORS[3].value); // Green default
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customColor, setCustomColor] = useState<string>(SUBJECT_COLORS[3].value);
  const [savedColors, setSavedColors] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("study-game-subject-colors");
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setSavedColors(parsed.filter((c) => typeof c === "string"));
      }
    } catch {
      // ignore
    }
  }, []);

  function persistSavedColors(next: string[]) {
    setSavedColors(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("study-game-subject-colors", JSON.stringify(next));
    }
  }

  function handleSaveCustomColor() {
    const value = customColor.trim();
    if (!value) return;
    const lower = value.toLowerCase();
    const defaultSet = new Set(SUBJECT_COLORS.map((c) => c.value.toLowerCase()));
    if (defaultSet.has(lower)) return;
    if (savedColors.some((c) => c.toLowerCase() === lower)) return;
    const next = [...savedColors, value].slice(-8);
    persistSavedColors(next);
  }

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await createSubject(formData);
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    const form = document.getElementById("add-subject-form") as HTMLFormElement;
    form?.reset();
  }

  return (
    <form
      id="add-subject-form"
      action={submit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-pastel-sage/50 bg-white/60 p-4 shadow-sm"
    >
      <input
        type="hidden"
        name="color"
        value={showAdvanced ? customColor : selectedColor}
      />
      <div className="flex-1 min-w-[140px]">
        <label htmlFor="subject-name" className="mb-1 block text-sm font-medium text-gray-600">
          Name
        </label>
        <input
          id="subject-name"
          name="name"
          type="text"
          placeholder="e.g. History, Biology"
          required
          maxLength={80}
          className="w-full rounded-lg border border-pastel-sage/60 bg-white px-3 py-2 text-gray-800 placeholder-gray-400 focus:border-pastel-leaf focus:outline-none focus:ring-2 focus:ring-pastel-sage/50"
        />
      </div>
      <div className="w-full sm:w-auto space-y-1">
        <label className="block text-sm font-medium text-gray-600">Color</label>
        <div className="flex flex-wrap items-center gap-1.5">
          {SUBJECT_COLORS.map(({ name, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSelectedColor(value);
                setCustomColor(value);
                setShowAdvanced(false);
              }}
              className="cursor-pointer"
              title={name}
            >
              <span
                className={`block h-8 w-8 rounded-full border-2 transition hover:scale-110 ${
                  selectedColor === value
                    ? "border-gray-700 ring-2 ring-pastel-leaf"
                    : "border-gray-300"
                }`}
                style={{ backgroundColor: value }}
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="ml-1 rounded-full border border-pastel-sage/60 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-pastel-mint/40"
          >
            {showAdvanced ? "Hide advanced" : "Advanced…"}
          </button>
        </div>
        {savedColors.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-[11px] text-gray-500">Saved colors</p>
            <div className="flex flex-wrap items-center gap-2">
              {savedColors.map((value) => (
                <div key={value} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedColor(value);
                      setCustomColor(value);
                      setShowAdvanced(false);
                    }}
                    className="cursor-pointer"
                    title={value}
                  >
                    <span
                      className={`block h-7 w-7 rounded-full border-2 transition hover:scale-110 ${
                        selectedColor === value
                          ? "border-gray-700 ring-2 ring-pastel-leaf"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: value }}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Remove saved color"
                    onClick={() => {
                      const next = savedColors.filter((c) => c !== value);
                      persistSavedColors(next);
                    }}
                    className="text-[10px] text-gray-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {showAdvanced && (
          <div className="mt-2 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="h-8 w-12 cursor-pointer rounded-md border border-pastel-sage/60 bg-transparent"
                aria-label="Custom color"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => setCustomColor(e.target.value)}
                className="w-28 rounded-lg border border-pastel-sage/60 px-2 py-1 text-xs font-mono"
                placeholder="#a5d6a7"
              />
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span
                  className="inline-block h-4 w-4 rounded-full border border-gray-300"
                  style={{ backgroundColor: customColor }}
                />
                Live preview
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              Tap the little color box to pick any custom color you like.
            </p>
            <button
              type="button"
              onClick={handleSaveCustomColor}
              className="text-[11px] font-medium text-pastel-leaf hover:underline"
            >
              Save this color to your palette
            </button>
          </div>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf disabled:opacity-60 transition"
      >
        {pending ? "Adding…" : "Add subject"}
      </button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
    </form>
  );
}
