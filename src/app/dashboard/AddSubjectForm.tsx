"use client";

import { useState } from "react";
import { createSubject } from "./actions";

const SUBJECT_COLORS = [
  { name: "Mint", value: "#c8e6c9" },
  { name: "Sage", value: "#a5d6a7" },
  { name: "Leaf", value: "#81c784" },
  { name: "Seafoam", value: "#b2dfdb" },
  { name: "Blossom", value: "#f8bbd9" },
  { name: "Sky", value: "#b3e5fc" },
];

export function AddSubjectForm() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <div className="w-full sm:w-auto">
        <label className="mb-1 block text-sm font-medium text-gray-600">Color</label>
        <div className="flex gap-1.5">
          {SUBJECT_COLORS.map(({ name, value }) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="color"
                value={value}
                defaultChecked={name === "Mint"}
                className="peer sr-only"
              />
              <span
                className="block h-8 w-8 rounded-full border-2 border-gray-300 transition peer-checked:border-gray-600 peer-checked:ring-2 peer-checked:ring-pastel-leaf hover:scale-110"
                style={{ backgroundColor: value }}
                title={name}
              />
            </label>
          ))}
        </div>
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
