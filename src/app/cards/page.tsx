import { Sparkles, StickyNote, Plus, Gamepad2 } from "lucide-react";
import { getFlashcards, getNotesForFlashcards } from "./actions";
import { ManualCardForm } from "./ManualCardForm";
import { GenerateFromNoteForm } from "./GenerateFromNoteForm";
import { FlashcardList } from "./FlashcardList";
import { FlashcardGameClient } from "./FlashcardGameClient";

export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const [cards, notes] = await Promise.all([getFlashcards(), getNotesForFlashcards()]);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold">
          <StickyNote className="h-8 w-8 text-pastel-leaf" />
          Notecards
        </h1>
        <p className="mb-6">
          Create flashcards manually or let AI turn your Notes into question–answer cards. These cards
          will power future games like Match and spaced repetition.
        </p>

        <div className="space-y-8">
          <section className="card-surface p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <Plus className="h-5 w-5 text-pastel-leaf" />
              Add a card manually
            </h2>
            <ManualCardForm />
          </section>

          <section className="card-surface p-6">
            <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-800">
              <Sparkles className="h-5 w-5 text-pastel-leaf" />
              Generate cards from Notes
            </h2>
            <GenerateFromNoteForm notes={notes} />
          </section>

          <section className="card-surface p-6 space-y-4">
            <h2 className="mb-1 font-semibold text-gray-800">Your cards</h2>
            <FlashcardList cards={cards} />
            <div className="mt-4 border-t border-pastel-sage/30 pt-4">
              <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-800">
                <Gamepad2 className="h-4 w-4 text-pastel-leaf" />
                Play flip game
              </h3>
              <p className="mb-3 text-xs text-gray-600">
                Flip through your cards, mark what you know, and see your best accuracy and time.
              </p>
              <FlashcardGameClient cards={cards} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

