import { FileUp, Sparkles, StickyNote } from "lucide-react";
import { getOrCreateNotesSubject, getNotesFiles, getNotes } from "./actions";
import { NotesUpload } from "./NotesUpload";
import { NotesFileList } from "./NotesFileList";
import { NotesList } from "./NotesList";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const subject = await getOrCreateNotesSubject();
  const [files, notes] = subject
    ? await Promise.all([getNotesFiles(subject.id), getNotes()])
    : [[], []];

  if (!subject) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <p className="text-gray-600">Sign in to use Notes.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <StickyNote className="h-8 w-8 text-pastel-leaf" />
          Notes
        </h1>
        <p className="mb-6">
          Upload PDFs or images. We&apos;ll extract the content and turn it into easy-to-digest study notes.
        </p>

        <div className="space-y-8">
          <section className="card-surface p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <FileUp className="h-5 w-5 text-pastel-leaf" />
              Upload a document
            </h2>
            <p className="mb-4 text-sm text-gray-600">
              PDF, TXT, or JPEG/PNG/WebP (max 10 MB). Text is extracted and saved to your account.
            </p>
            <NotesUpload subjectId={subject.id} />
          </section>

          <section className="card-surface p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <Sparkles className="h-5 w-5 text-pastel-leaf" />
              Generate notes from your files
            </h2>
            <NotesFileList files={files} subjectId={subject.id} />
          </section>

          <section className="card-surface p-6">
            <h2 className="mb-3 font-semibold text-gray-800">Your saved notes</h2>
            <NotesList notes={notes} />
          </section>
        </div>
      </div>
    </main>
  );
}
