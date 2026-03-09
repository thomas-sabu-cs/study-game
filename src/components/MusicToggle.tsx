"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, SkipBack, SkipForward, Pause, Play } from "lucide-react";

const STORAGE_KEY = "study-game-music-enabled";
// Default to first playlist track in public/audio/background
const DEFAULT_SRC = "/audio/background/Day Off.mp3";
const TRACKS_META_KEY = "study-game-music-tracks";

export function MusicToggle() {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(35);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setEnabled(raw === "true");
      const volRaw = window.localStorage.getItem("study-game-music-volume");
      const vol = volRaw != null ? Number(volRaw) : 35;
      if (!Number.isNaN(vol) && vol >= 0 && vol <= 100) {
        setVolume(vol);
      }
    } catch {
      // ignore
    }
  }, []);

  function getOrCreateAudio(overrideSrc?: string): HTMLAudioElement {
    // Always resolve the desired src from localStorage (or fallback/override).
    let src = overrideSrc ?? DEFAULT_SRC;
    if (!overrideSrc) {
      try {
        const storedSrc = window.localStorage.getItem("study-game-music-src");
        // Only trust values that point at the new background folder.
        if (storedSrc && storedSrc.startsWith("/audio/background/")) {
          src = storedSrc;
        } else if (storedSrc) {
          // Old/stale value (e.g. /audio/background_music.mp3) – clear it.
          window.localStorage.removeItem("study-game-music-src");
        }
      } catch {
        // ignore
      }
    }
    const existing = audioRef.current;
    if (existing) {
      // If the source has changed (e.g. new first track in queue), update it.
      const currentSrc = existing.src || "";
      if (!currentSrc.endsWith(src)) {
        existing.pause();
        existing.src = src;
        existing.currentTime = 0;
      }
      existing.volume = volume / 100;
      return existing;
    }
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = volume / 100;
    audioRef.current = audio;
    return audio;
  }

  async function start() {
    const audio = getOrCreateAudio();
    try {
      await audio.play();
      setIsPlaying(true);
    } catch {
      // Autoplay might still be blocked; user can tap again.
    }
  }

  function stop() {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      audio.pause();
      audio.currentTime = 0;
    } catch {
      // ignore
    }
    setIsPlaying(false);
  }

  function handleVolumeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = Number(e.target.value);
    if (Number.isNaN(next)) return;
    const clamped = Math.min(100, Math.max(0, next));
    setVolume(clamped);
    try {
      window.localStorage.setItem("study-game-music-volume", String(clamped));
    } catch {
      // ignore
    }
    const audio = audioRef.current;
    if (audio) {
      audio.volume = clamped / 100;
    }
  }

  function getTrackList(): { id: string; src: string }[] {
    try {
      const raw = window.localStorage.getItem(TRACKS_META_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((t: any) => (t && t.id && t.src ? { id: String(t.id), src: String(t.src) } : null))
        .filter(Boolean) as { id: string; src: string }[];
    } catch {
      return [];
    }
  }

  async function changeTrack(direction: 1 | -1) {
    const tracks = getTrackList();
    if (!tracks.length) return;
    let current = DEFAULT_SRC;
    try {
      const stored = window.localStorage.getItem("study-game-music-src");
      if (stored && stored.startsWith("/audio/background/")) current = stored;
    } catch {
      // ignore
    }
    let index = tracks.findIndex((t) => t.src === current);
    if (index === -1) index = 0;
    const nextIndex = (index + direction + tracks.length) % tracks.length;
    const nextSrc = tracks[nextIndex].src;
    try {
      window.localStorage.setItem("study-game-music-src", nextSrc);
    } catch {
      // ignore
    }
    const audio = getOrCreateAudio(nextSrc);
    audio.currentTime = 0;
    audio.volume = volume / 100;
    if (enabled) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // ignore
      }
    } else {
      setIsPlaying(false);
    }
  }

  async function togglePause() {
    const audio = getOrCreateAudio();
    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        // ignore
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
    if (!next) stop();
    else void start(); // click = user gesture, safe to start
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={toggle}
        className="btn-dynamic inline-flex items-center gap-2 rounded-lg border border-pastel-sage/60 bg-white/70 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pastel-mint/40 transition"
        aria-label={enabled ? "Turn music off" : "Turn music on"}
        title={enabled ? "Music: on" : "Music: off"}
      >
        {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        <span className="hidden sm:inline">Music</span>
      </button>
      <button
        type="button"
        onClick={() => void changeTrack(-1)}
        className="inline-flex items-center rounded-md border border-pastel-sage/60 bg-white px-1.5 py-1 text-xs text-gray-700 hover:bg-pastel-mint/40"
        aria-label="Previous track"
        title="Previous track"
      >
        <SkipBack className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={() => void togglePause()}
        className="inline-flex items-center rounded-md border border-pastel-sage/60 bg-white px-1.5 py-1 text-xs text-gray-700 hover:bg-pastel-mint/40"
        aria-label={isPlaying ? "Pause" : "Play"}
        title={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
      </button>
      <button
        type="button"
        onClick={() => void changeTrack(1)}
        className="inline-flex items-center rounded-md border border-pastel-sage/60 bg-white px-1.5 py-1 text-xs text-gray-700 hover:bg-pastel-mint/40"
        aria-label="Next track"
        title="Next track"
      >
        <SkipForward className="h-3 w-3" />
      </button>
      <input
        type="range"
        min={0}
        max={100}
        value={volume}
        onChange={handleVolumeChange}
        aria-label="Music volume"
        className="h-1 w-20 cursor-pointer accent-pastel-sage"
      />
    </div>
  );
}

