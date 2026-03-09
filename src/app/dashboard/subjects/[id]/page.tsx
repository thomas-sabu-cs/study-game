import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { ArrowLeft, FileUp, Sparkles } from "lucide-react";
import { getFilesForSubject } from "./actions";
import { FileUpload } from "./FileUpload";
import { FileList } from "./FileList";

export const dynamic = "force-dynamic";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { userId } = await auth();
  if (!userId) notFound();

  const supabase = createAdminClient();
  const { data: subject, error } = await supabase
    .from("subjects")
    .select("id, user_id, name, color, created_at")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !subject) notFound();

  const files = await getFilesForSubject(id);
  const color = subject.color ?? "#a5d6a7";

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Locker
        </Link>

        <header className="mb-8 flex items-center gap-4">
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color}90` }}
          >
            <span className="text-2xl" aria-hidden>
              📚
            </span>
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{subject.name}</h1>
            <p className="text-gray-600">Add files and generate quizzes from your notes.</p>
          </div>
        </header>

        <div className="space-y-8">
          <section className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <FileUp className="h-5 w-5 text-pastel-leaf" />
              Upload a file
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              PDF, TXT, or JPEG/PNG/WebP (max 10 MB). We’ll extract text (or from images via AI) so you can generate a quiz.
            </p>
            <FileUpload subjectId={id} />
          </section>

          <section className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <Sparkles className="h-5 w-5 text-pastel-leaf" />
              Your files & generate quiz
            </h2>
            <FileList files={files} subjectId={id} />
          </section>
        </div>
      </div>
    </main>
  );
}
