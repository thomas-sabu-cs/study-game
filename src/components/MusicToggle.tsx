"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX, SkipBack, SkipForward, Pause, Play } from "lucide-react";

const STORAGE_KEY = "study-game-music-enabled";
// Default to first playlist track in public/audio/background
const DEFAULT_SRC = "/audio/background/Day-Off.mp3";
const TRACKS_META_KEY = "study-game-music-tracks";
const GLOBAL_AUDIO_KEY = "__study_buddy_bg_audio__";

// Fallback track list so next/prev work even before visiting Profile settings.
const FALLBACK_TRACKS: { id: string; src: string; title: string }[] = [
  { id: "day_off", src: "/audio/background/Day-Off.mp3", title: "Day Off" },
  { id: "late_at_night", src: "/audio/background/Late-at-Night.mp3", title: "Late at Night" },
  { id: "magical_moments", src: "/audio/background/Magical-Moments.mp3", title: "Magical Moments" },
  { id: "morning_routine", src: "/audio/background/Morning-Routine.mp3", title: "Morning Routine" },
  { id: "storm_clouds", src: "/audio/background/Storm-Clouds.mp3", title: "Storm Clouds" },
  { id: "sunset_drive", src: "/audio/background/Sunset-Drive.mp3", title: "Sunset Drive" },
  { id: "vibin", src: "/audio/background/Vibin.mp3", title: "Vibin" },
];

export function MusicToggle() {
  const [enabled, setEnabled] = useState(false);
  const [volume, setVolume] = useState(35);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);

  function broadcastSrc(src: string) {
    if (typeof window === "undefined") return;
    try {
      window.dispatchEvent(
        new CustomEvent("study-buddy-music-src", { detail: src } as CustomEventInit<string>)
      );
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const initiallyEnabled = raw === "true";
      setEnabled(initiallyEnabled);
      const volRaw = window.localStorage.getItem("study-game-music-volume");
      const vol = volRaw != null ? Number(volRaw) : 35;
      if (!Number.isNaN(vol) && vol >= 0 && vol <= 100) {
        setVolume(vol);
      }

      // Sync play/pause icon and track title with any existing global audio element
      const w = window as any;
      const existing: HTMLAudioElement | undefined = w[GLOBAL_AUDIO_KEY];
      if (existing) {
        audioRef.current = existing;
        existing.volume = (volRaw != null ? vol : 35) / 100;
        const actuallyPlaying = !existing.paused && !existing.ended;
        setIsPlaying(actuallyPlaying);

        const src = existing.src || "";
        const logicalSrc = src.startsWith("http")
          ? src.substring(src.indexOf("/audio/"))
          : src;
        setCurrentTitle(pickTitleForSrc(logicalSrc || DEFAULT_SRC));

        if (actuallyPlaying && !initiallyEnabled) {
          setEnabled(true);
          window.localStorage.setItem(STORAGE_KEY, "true");
        }
        if (!actuallyPlaying && initiallyEnabled) {
          // Music was marked on but nothing is playing; keep enabled but leave isPlaying false
          setIsPlaying(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  function getOrCreateAudio(overrideSrc?: string): HTMLAudioElement {
    // Always resolve the desired src from localStorage (or fallback/override).
    let src = overrideSrc ?? DEFAULT_SRC;

    if (typeof window !== "undefined" && !overrideSrc) {
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

    // Use a global singleton so we never have more than one background audio element.
    let audio: HTMLAudioElement | null = null;

    if (typeof window !== "undefined") {
      const w = window as any;
      audio = (w[GLOBAL_AUDIO_KEY] as HTMLAudioElement | undefined) ?? null;
      if (!audio) {
        audio = new Audio(src);
        audio.preload = "auto";
        w[GLOBAL_AUDIO_KEY] = audio;
      } else {
        const currentSrc = audio.src || "";
        if (!currentSrc.endsWith(src)) {
          audio.pause();
          audio.src = src;
          audio.currentTime = 0;
        }
      }
    } else if (audioRef.current) {
      audio = audioRef.current;
    } else {
      audio = new Audio(src);
      audio.preload = "auto";
    }

    audio.volume = volume / 100;
    audioRef.current = audio;
    return audio;
  }

  async function start() {
    const audio = getOrCreateAudio();
    try {
      await audio.play();
      setIsPlaying(true);
      if (typeof window !== "undefined") {
        const src =
          window.localStorage.getItem("study-game-music-src") ?? DEFAULT_SRC;
        setCurrentTitle(pickTitleForSrc(src));
        broadcastSrc(src);
      }
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

  function getTrackList(): { id: string; src: string; title?: string }[] {
    if (typeof window === "undefined") {
      return FALLBACK_TRACKS;
    }
    try {
      const raw = window.localStorage.getItem(TRACKS_META_KEY);
      if (!raw) return FALLBACK_TRACKS;
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return FALLBACK_TRACKS;
      const fromStorage = parsed
        .map((t: any) =>
          t && t.id && t.src
            ? { id: String(t.id), src: String(t.src), title: t.title as string | undefined }
            : null
        )
        .filter(Boolean) as { id: string; src: string; title?: string }[];
      return fromStorage.length ? fromStorage : FALLBACK_TRACKS;
    } catch {
      return FALLBACK_TRACKS;
    }
  }

  function pickTitleForSrc(src: string): string | null {
    if (!src) return null;
    try {
      const tracks = getTrackList();
      const found = tracks.find((t) => t.src === src);
      if (found && found.title) return found.title;
    } catch {
      // ignore
    }
    const parts = src.split("/");
    const file = parts[parts.length - 1] || "";
    if (!file) return null;
    const name = file.replace(/\.[^/.]+$/, "").replace(/-/g, " ");
    return name || null;
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
    broadcastSrc(nextSrc);
    const audio = getOrCreateAudio(nextSrc);
    audio.currentTime = 0;
    audio.volume = volume / 100;
    if (enabled) {
      try {
        await audio.play();
        setIsPlaying(true);
        setCurrentTitle(pickTitleForSrc(nextSrc));
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
        if (typeof window !== "undefined") {
          const src =
            window.localStorage.getItem("study-game-music-src") ?? DEFAULT_SRC;
          setCurrentTitle(pickTitleForSrc(src));
        }
      } catch {
        // ignore
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  // Allow other components (like MusicSettingsClient) to control playback via a simple event.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      const cmd = ce.detail;
      if (cmd === "next") {
        void changeTrack(1);
      } else if (cmd === "prev") {
        void changeTrack(-1);
      } else if (cmd === "toggle") {
        void togglePause();
      }
    };
    window.addEventListener("study-buddy-music-control", handler as EventListener);
    return () => {
      window.removeEventListener("study-buddy-music-control", handler as EventListener);
    };
  }, []);

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
      <div className="flex flex-col items-start gap-1">
        <span className="max-w-[10rem] truncate text-[11px] font-medium text-gray-700">
          {currentTitle ?? "Study Buddy mix"}
        </span>
        <input
          type="range"
          min={0}
          max={100}
          value={volume}
          onChange={handleVolumeChange}
          aria-label="Music volume"
          className="h-1 w-24 cursor-pointer accent-pastel-sage"
        />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggle}
            className="btn-dynamic inline-flex items-center gap-2 rounded-lg border border-pastel-sage/60 bg-white/70 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-pastel-mint/40 transition"
            aria-label={enabled ? "Mute music" : "Unmute music"}
            title={enabled ? "Mute music" : "Unmute music"}
          >
            {enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            <span className="hidden sm:inline">{enabled ? "Mute" : "Unmute"}</span>
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
        </div>
      </div>
    </div>
  );
}

