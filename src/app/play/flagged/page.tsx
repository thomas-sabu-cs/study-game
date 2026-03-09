import Link from "next/link";
import { Flag, AlertTriangle, ArrowLeft } from "lucide-react";
import { getFlaggedQuestions } from "../actions";
import { FlaggedList } from "./FlaggedList";

export const dynamic = "force-dynamic";

export default async function FlaggedPage() {
  const items = await getFlaggedQuestions();

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/play"
          className="mb-6 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Play
        </Link>
        <h1 className="mb-2 flex items-center gap-2 text-2xl font-bold text-gray-800">
          <Flag className="h-8 w-8 text-pastel-leaf" />
          Flagged & reported
        </h1>
        <p className="mb-6 text-gray-600">
          Questions you flagged for review or reported as potentially wrong. Review them here or remove when done.
        </p>
        <FlaggedList items={items} />
      </div>
    </main>
  );
}
