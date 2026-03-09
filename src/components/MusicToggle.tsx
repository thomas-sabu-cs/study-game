"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "study-game-music-enabled";
// Default to first playlist track in public/audio/background
const DEFAULT_SRC = "/audio/background/Day%20Off.mp3";

export function MusicToggle() {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(35);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  function getOrCreateAudio(): HTMLAudioElement {
    // Always resolve the desired src from localStorage (or fallback).
    let src = DEFAULT_SRC;
    try {
      const storedSrc = window.localStorage.getItem("study-game-music-src");
      if (storedSrc) src = storedSrc;
    } catch {
      // ignore
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

