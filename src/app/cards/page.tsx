import { Sparkles, StickyNote, Plus } from "lucide-react";
import { getFlashcards, getNotesForFlashcards } from "./actions";
import { ManualCardForm } from "./ManualCardForm";
import { GenerateFromNoteForm } from "./GenerateFromNoteForm";
import { FlashcardList } from "./FlashcardList";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const [cards, notes] = await Promise.all([getFlashcards(), getNotesForFlashcards()]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-pastel-cream to-pastel-butter/30 p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-800">
          <StickyNote className="h-8 w-8 text-pastel-leaf" />
          Notecards
        </h1>
        <p className="mb-6 text-gray-600">
          Create flashcards manually or let AI turn your Notes into question–answer cards. These cards
          will power future games like Match and spaced repetition.
        </p>

        <div className="space-y-8">
          <section className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <Plus className="h-5 w-5 text-pastel-leaf" />
              Add a card manually
            </h2>
            <ManualCardForm />
          </section>

          <section className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-6 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <Sparkles className="h-5 w-5 text-pastel-leaf" />
              Generate cards from Notes
            </h2>
            <GenerateFromNoteForm notes={notes} />
          </section>

          <section className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-6 shadow-sm">
            <h2 className="mb-3 font-semibold text-gray-800">Your cards</h2>
            <FlashcardList cards={cards} />
          </section>
        </div>
      </div>
    </main>
  );
}

