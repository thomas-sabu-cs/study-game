"use client";

import Link from "next/link";
import { FolderOpen, Trash2 } from "lucide-react";
import { deleteSubjectForm } from "./actions";
import type { Subject } from "@/types";

export function SubjectCard({ subject }: { subject: Subject }) {
  const color = subject.color ?? "#a5d6a7";

  function handleDelete(e: React.FormEvent) {
    e.preventDefault();
    if (confirm("Delete this subject? Files and quizzes in it will be affected.")) {
      (e.target as HTMLButtonElement).form?.requestSubmit();
    }
  }

  return (
    <li className="group rounded-2xl border border-pastel-sage/50 bg-white/70 shadow-sm transition hover:shadow-md">
      <Link
        href={`/dashboard/subjects/${subject.id}`}
        className="flex items-center gap-4 p-4"
      >
        <span
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: `${color}80` }}
        >
          <FolderOpen className="h-6 w-6 text-gray-700" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-800 truncate">{subject.name}</h3>
          <p className="text-sm text-gray-500">Open to add files & generate quiz</p>
        </div>
      </Link>
      <form action={deleteSubjectForm} className="px-4 pb-3">
        <input type="hidden" name="id" value={subject.id} />
        <button
          type="submit"
          onClick={handleDelete}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600 transition"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </form>
    </li>
  );
}
