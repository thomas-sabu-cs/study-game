import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCardsInFolder } from "@/app/cards/actions";
import { UNASSIGNED_FOLDER_ID } from "@/lib/cardFolders";
import { FlashcardGameClient } from "@/app/cards/FlashcardGameClient";

export const dynamic = "force-dynamic";

export default async function FlipGamePage({
  params,
}: {
  params: Promise<{ folderId: string }>;
}) {
  const { folderId } = await params;
  const cards = await getCardsInFolder(folderId);

  if (cards.length === 0) {
    const label = folderId === UNASSIGNED_FOLDER_ID ? "Unassigned" : "this folder";
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/play"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 hover:underline mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Play
          </Link>
          <p className="card-surface p-6 text-gray-600">
            No cards in {label}. Add cards in Notecards and assign them to a folder, or play from another dataset.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/play"
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 hover:underline mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Play
        </Link>
        <div className="card-surface p-6">
          <FlashcardGameClient cards={cards} />
        </div>
      </div>
    </main>
  );
}
