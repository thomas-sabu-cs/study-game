"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  Trash2,
  Loader2,
  Plus,
} from "lucide-react";
import type { Flashcard } from "./actions";
import type { CardFolder } from "./actions";
import { createCardFolder, deleteCardFolder, addCardsToFolder, removeCardsFromFolder } from "./actions";
import { UNASSIGNED_FOLDER_ID } from "@/lib/cardFolders";

const UNASSIGNED_NAME = "Unassigned";

function cardsInFolder(
  folderId: string,
  cards: Flashcard[],
  memberships: { card_id: string; folder_id: string }[]
): Flashcard[] {
  if (folderId === UNASSIGNED_FOLDER_ID) {
    const inAny = new Set(memberships.map((m) => m.card_id));
    return cards.filter((c) => !inAny.has(c.id));
  }
  const inThis = new Set(
    memberships.filter((m) => m.folder_id === folderId).map((m) => m.card_id)
  );
  return cards.filter((c) => inThis.has(c.id));
}

export function CardFoldersSection({
  folders,
  cards,
  memberships,
}: {
  folders: CardFolder[];
  cards: Flashcard[];
  memberships: { card_id: string; folder_id: string }[];
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState<string | null>(UNASSIGNED_FOLDER_ID);
  const [newFolderName, setNewFolderName] = useState("");
  const [addToFolderCard, setAddToFolderCard] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allFolderOptions = [
    { id: UNASSIGNED_FOLDER_ID, name: UNASSIGNED_NAME },
    ...folders.map((f) => ({ id: f.id, name: f.name })),
  ];

  const handleCreateFolder = () => {
    const name = newFolderName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await createCardFolder(name);
      if (!res.error) {
        setNewFolderName("");
        router.refresh();
      }
    });
  };

  const handleRemoveFromFolder = (cardId: string, folderId: string) => {
    if (folderId === UNASSIGNED_FOLDER_ID) return;
    startTransition(async () => {
      const res = await removeCardsFromFolder([cardId], folderId);
      if (!res.error) router.refresh();
    });
  };

  const handleAddToFolder = (cardId: string, folderId: string) => {
    if (folderId === UNASSIGNED_FOLDER_ID) return;
    startTransition(async () => {
      const res = await addCardsToFolder([cardId], folderId);
      if (!res.error) {
        setAddToFolderCard(null);
        router.refresh();
      }
    });
  };

  const handleDeleteFolder = (folderId: string) => {
    if (folderId === UNASSIGNED_FOLDER_ID) return;
    if (!confirm("Delete this folder? Cards in it will only be removed from the folder, not deleted."))
      return;
    startTransition(async () => {
      const res = await deleteCardFolder(folderId);
      if (!res.error) {
        if (expanded === folderId) setExpanded(UNASSIGNED_FOLDER_ID);
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <input
          type="text"
          value={newFolderName}
          onChange={(e) => setNewFolderName(e.target.value)}
          placeholder="New folder name"
          className="rounded-lg border border-pastel-sage/50 px-3 py-1.5 text-sm w-48"
          onKeyDown={(e) => e.key === "Enter" && handleCreateFolder()}
        />
        <button
          type="button"
          disabled={isPending || !newFolderName.trim()}
          onClick={handleCreateFolder}
          className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-sage px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-pastel-leaf disabled:opacity-50"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Create folder
        </button>
      </div>

      <ul className="space-y-1">
        {allFolderOptions.map((folder) => {
          const id = folder.id;
          const isUnassigned = id === UNASSIGNED_FOLDER_ID;
          const list = cardsInFolder(id, cards, memberships);
          const isExpanded = expanded === id;

          return (
            <li key={id} className="rounded-xl border border-pastel-sage/40 bg-white/80 overflow-hidden">
              <button
                type="button"
                onClick={() => setExpanded(isExpanded ? null : id)}
                className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-pastel-mint/20 transition"
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-gray-500 shrink-0" />
                )}
                <FolderOpen className="h-4 w-4 text-pastel-leaf shrink-0" />
                <span className="font-medium text-gray-800">{folder.name}</span>
                <span className="text-xs text-gray-500">({list.length})</span>
                {!isUnassigned && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFolder(id);
                    }}
                    className="ml-auto p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition shrink-0"
                    title="Delete folder"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </button>

              {isExpanded && (
                <div className="border-t border-pastel-sage/30 px-4 py-3 bg-gray-50/50 max-h-64 overflow-y-auto">
                  {list.length === 0 ? (
                    <p className="text-sm text-gray-500 py-2">
                      {isUnassigned
                        ? "Cards not in any folder appear here. Add cards to folders from the list below."
                        : "No cards in this folder. Add cards from Unassigned or from Your cards."}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {list.map((c) => (
                        <li
                          key={c.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-pastel-sage/30 bg-white px-3 py-2 text-sm"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-800 truncate">{c.front}</p>
                            <p className="text-xs text-gray-600 truncate">{c.back}</p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {isUnassigned ? (
                              <>
                                <select
                                  value={addToFolderCard === c.id ? "..." : ""}
                                  onChange={(e) => {
                                    const fid = e.target.value;
                                    if (fid) handleAddToFolder(c.id, fid);
                                    setAddToFolderCard(null);
                                  }}
                                  onFocus={() => setAddToFolderCard(c.id)}
                                  className="rounded border border-pastel-sage/50 px-2 py-1 text-xs"
                                >
                                  <option value="">Add to folder…</option>
                                  {folders.map((f) => (
                                    <option key={f.id} value={f.id}>
                                      {f.name}
                                    </option>
                                  ))}
                                </select>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveFromFolder(c.id, id)}
                                disabled={isPending}
                                className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                              >
                                Remove from folder
                              </button>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
