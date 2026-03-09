"use client";

import { useEffect, useState } from "react";
import { GripVertical, ThumbsDown, ThumbsUp } from "lucide-react";

type Track = {
  id: string;
  title: string;
  artist: string;
  duration: string;
  src: string;
};

const TRACKS: Track[] = [
  {
    id: "day_off",
    title: "Day Off",
    artist: "Study Buddy",
    duration: "3:00",
    src: "/audio/background/Day%20Off.mp3",
  },
  {
    id: "late_at_night",
    title: "Late at Night",
    artist: "Study Buddy",
    duration: "3:00",
    src: "/audio/background/Late%20at%20Night.mp3",
  },
  {
    id: "magical_moments",
    title: "Magical Moments",
    artist: "Study Buddy",
    duration: "3:00",
    src: "/audio/background/Magical%20Moments.mp3",
  },
  {
    id: "morning_routine",
    title: "Morning Routine",
    artist: "Study Buddy",
    duration: "3:00",
    src: "/audio/background/Morning%20Routine.mp3",
  },
  {
    id: "storm_clouds",
    title: "Storm Clouds",
    artist: "Study Buddy",
    duration: "3:00",
    src: "/audio/background/Storm%20Clouds.mp3",
  },
  {
    id: "sunset_drive",
    title: "Sunset Drive",
    artist: "Study Buddy",
    duration: "3:00",
    src: "/audio/background/Sunset%20Drive.mp3",
  },
  {
    id: "vibin",
    title: "Vibin",
    artist: "Study Buddy",
    duration: "3:00",
    src: "/audio/background/Vibin.mp3",
  },
];

const SRC_KEY = "study-game-music-src";
const QUEUE_KEY = "study-game-music-queue";
const DISLIKED_KEY = "study-game-music-disliked";
const TRACKS_META_KEY = "study-game-music-tracks";

export function MusicSettingsClient() {
  const [queue, setQueue] = useState<Track[]>(TRACKS);
  const [disliked, setDisliked] = useState<Track[]>([]);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [currentSrc, setCurrentSrc] = useState<string | null>(null);

  // Load saved order and disliked list
  useEffect(() => {
    try {
      const idsJson = window.localStorage.getItem(QUEUE_KEY);
      const dislikedJson = window.localStorage.getItem(DISLIKED_KEY);
      let initialQueue = TRACKS;
      if (idsJson) {
        const ids: string[] = JSON.parse(idsJson);
        const byId = new Map(TRACKS.map((t) => [t.id, t]));
        const ordered: Track[] = [];
        ids.forEach((id) => {
          const t = byId.get(id);
          if (t) ordered.push(t);
          byId.delete(id);
        });
        // any new tracks not in saved ids go to the end
        for (const t of byId.values()) ordered.push(t);
        if (ordered.length) initialQueue = ordered;
      }
      setQueue(initialQueue);

      if (dislikedJson) {
        const dislikedIds: string[] = JSON.parse(dislikedJson);
        const dislikedTracks = dislikedIds
          .map((id) => TRACKS.find((t) => t.id === id))
          .filter(Boolean) as Track[];
        setDisliked(dislikedTracks);
      }

      // Persist track metadata for the toggle controls to use
      window.localStorage.setItem(
        TRACKS_META_KEY,
        JSON.stringify(
          TRACKS.map((t) => ({
            id: t.id,
            src: t.src,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
          }))
        )
      );

      // Ensure current src matches first item in queue
      if (initialQueue[0]) {
        window.localStorage.setItem(SRC_KEY, initialQueue[0].src);
        setCurrentSrc(initialQueue[0].src);
      }
    } catch {
      // ignore
    }
  }, []);

  // Also respect any existing current src (e.g. after skipping from the nav)
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(SRC_KEY);
      if (stored) setCurrentSrc(stored);
    } catch {
      // ignore
    }
  }, []);

  function persist(queueTracks: Track[], dislikedTracks: Track[]) {
    setQueue(queueTracks);
    setDisliked(dislikedTracks);
    try {
      window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queueTracks.map((t) => t.id)));
      window.localStorage.setItem(DISLIKED_KEY, JSON.stringify(dislikedTracks.map((t) => t.id)));
      if (queueTracks[0]) {
        window.localStorage.setItem(SRC_KEY, queueTracks[0].src);
        setCurrentSrc(queueTracks[0].src);
      } else {
        setCurrentSrc(null);
      }
      window.localStorage.setItem(
        TRACKS_META_KEY,
        JSON.stringify(
          TRACKS.map((t) => ({
            id: t.id,
            src: t.src,
            title: t.title,
            artist: t.artist,
            duration: t.duration,
          }))
        )
      );
    } catch {
      // ignore
    }
  }

  function onDragStart(id: string) {
    setDraggingId(id);
  }

  function onDrop(targetId: string) {
    if (!draggingId || draggingId === targetId) return;
    const fromIndex = queue.findIndex((t) => t.id === draggingId);
    const toIndex = queue.findIndex((t) => t.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;
    const next = [...queue];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    persist(next, disliked);
    setDraggingId(null);
  }

  function moveToDisliked(id: string) {
    const track = queue.find((t) => t.id === id);
    if (!track) return;
    const nextQueue = queue.filter((t) => t.id !== id);
    const nextDisliked = [...disliked, track];
    persist(nextQueue, nextDisliked);
  }

  function moveToQueue(id: string) {
    const track = disliked.find((t) => t.id === id);
    if (!track) return;
    const nextDisliked = disliked.filter((t) => t.id !== id);
    const nextQueue = [...queue, track];
    persist(nextQueue, nextDisliked);
  }

  if (!TRACKS.length) return null;

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Queue (first = current)
        </p>
        {queue.length === 0 ? (
          <p className="text-xs text-gray-500">No songs in queue. Move some back from Disliked.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((t) => (
              <li
                key={t.id}
                className={`flex items-center gap-3 rounded-xl border border-pastel-sage/60 bg-white/80 px-3 py-2 text-sm shadow-sm ${
                  draggingId === t.id ? "opacity-70" : ""
                }`}
                draggable
                onDragStart={() => onDragStart(t.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDrop(t.id)}
              >
                <span className="cursor-move text-gray-400 hover:text-gray-600">
                  <GripVertical className="h-4 w-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.artist}</p>
                </div>
                <span className="text-xs font-mono text-gray-500">{t.duration}</span>
                {t.src === currentSrc && (
                  <span className="ml-1 rounded-full bg-pastel-mint/60 px-2 py-0.5 text-[10px] font-semibold text-gray-800">
                    Now playing
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => moveToDisliked(t.id)}
                  className="ml-1 inline-flex items-center rounded-full border border-red-200 bg-red-50 px-2 py-1 text-[10px] font-medium text-red-700 hover:bg-red-100"
                  title="Dislike this song"
                >
                  <ThumbsDown className="mr-0.5 h-3 w-3" />
                  Dislike
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Disliked songs
        </p>
        {disliked.length === 0 ? (
          <p className="text-xs text-gray-500">No disliked songs yet.</p>
        ) : (
          <ul className="space-y-2">
            {disliked.map((t) => (
              <li
                key={t.id}
                className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
              >
                <div className="flex-1 min-w-0">
                  <p className="truncate font-medium text-gray-800">{t.title}</p>
                  <p className="text-xs text-gray-500">{t.artist}</p>
                </div>
                <span className="text-xs font-mono text-gray-500">{t.duration}</span>
                <button
                  type="button"
                  onClick={() => moveToQueue(t.id)}
                  className="ml-1 inline-flex items-center rounded-full border border-pastel-sage/60 bg-white px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-pastel-mint/30"
                  title="Move back to queue"
                >
                  <ThumbsUp className="mr-0.5 h-3 w-3" />
                  Like
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-xs text-gray-500">
        Drop more MP3s into <code>public/audio/background</code> and wire them into this list to
        make them selectable.
      </p>
    </div>
  );
}
 