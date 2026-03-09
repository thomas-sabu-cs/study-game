"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const STORAGE_KEY = "study-game-music-enabled";
const DEFAULT_SRC = "/audio/relaxing.mp3";

export function MusicToggle() {
  const [enabled, setEnabled] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      setEnabled(raw === "true");
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    // If enabled on page load, don't autoplay. We'll start on first gesture.
    if (!enabled) return;
    const onFirstGesture = () => {
      void start();
    };
    window.addEventListener("pointerdown", onFirstGesture, { once: true });
    window.addEventListener("keydown", onFirstGesture, { once: true });
    return () => {
      window.removeEventListener("pointerdown", onFirstGesture);
      window.removeEventListener("keydown", onFirstGesture);
    };
  }, [enabled]);

  function getOrCreateAudio(): HTMLAudioElement {
    if (audioRef.current) return audioRef.current;
    const src = process.env.NEXT_PUBLIC_RELAXING_MP3_URL || DEFAULT_SRC;
    const audio = new Audio(src);
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.35;
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
  );
}

