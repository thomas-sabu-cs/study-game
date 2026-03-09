"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, RotateCcw, Check, X } from "lucide-react";
import type { Flashcard } from "./actions";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

interface BestStats {
  pct: number;
  time: number;
  correct: number;
  total: number;
}

export function FlashcardGameClient({ cards }: { cards: Flashcard[] }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [seen, setSeen] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [best, setBest] = useState<BestStats | null>(null);
  const startRef = useRef<number | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem("study-game-best-cards");
      if (!raw) return;
      const parsed = JSON.parse(raw) as BestStats;
      if (
        parsed &&
        typeof parsed.pct === "number" &&
        typeof parsed.time === "number" &&
        typeof parsed.correct === "number" &&
        typeof parsed.total === "number"
      ) {
        setBest(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (cards.length === 0) return;
    startRef.current = Date.now();
    timerRef.current = window.setInterval(() => {
      if (!startRef.current) return;
      const diff = (Date.now() - startRef.current) / 1000;
      setSeconds(Math.max(0, Math.round(diff)));
    }, 1000);
    return () => {
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, [cards.length]);

  useEffect(() => {
    if (!done || cards.length === 0 || typeof window === "undefined") return;
    const total = cards.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    const current: BestStats = { pct, time: seconds, correct, total };

    let next = current;
    if (best) {
      if (best.pct > current.pct || (best.pct === current.pct && best.time <= current.time)) {
        next = best;
      }
    }
    setBest(next);
    try {
      window.localStorage.setItem("study-game-best-cards", JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [done, cards.length, correct, seconds, best]);

  if (cards.length === 0) {
    return (
      <p className="text-sm text-gray-600">
        No cards yet. Add or generate notecards above, then you can play the flip game here.
      </p>
    );
  }

  if (done) {
    const total = cards.length;
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    return (
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800">Session complete</h3>
          <p className="mt-1 text-3xl font-bold text-gray-800">
            {correct} <span className="text-lg font-normal text-gray-500">/ {total}</span>
          </p>
          <p className="mt-1 text-base text-gray-600">{pct}% correct</p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-500">
            <Clock className="h-4 w-4" />
            {formatTime(seconds)} total
          </p>
          {best && (
            <p className="mt-2 text-xs text-gray-500">
              Best so far: {best.pct}% in {formatTime(best.time)} ({best.correct}/{best.total})
            </p>
          )}
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-pastel-mint px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-sage transition"
            onClick={() => {
              setIndex(0);
              setFlipped(false);
              setCorrect(0);
              setSeen(0);
              setSeconds(0);
              setDone(false);
              startRef.current = Date.now();
            }}
          >
            <RotateCcw className="h-4 w-4" />
            Play again
          </button>
        </div>
      </div>
    );
  }

  const card = cards[index];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>
          Card <span className="font-medium text-gray-800">{index + 1}</span> / {cards.length}
        </span>
        <span>
          Correct: <span className="font-medium text-gray-800">{correct}</span>
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formatTime(seconds)}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[160px] w-full items-center justify-center rounded-2xl border border-pastel-sage/70 bg-white/90 px-4 py-6 text-center text-base font-medium text-gray-800 shadow-sm transition hover:bg-pastel-mint/40"
      >
        {flipped ? card.back : card.front}
      </button>
      <p className="text-xs text-gray-500 text-center">Tap the card to flip</p>

      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => {
            setSeen((s) => s + 1);
            setCorrect((c) => c + 1);
            if (index === cards.length - 1) {
              setDone(true);
            } else {
              setIndex((i) => i + 1);
              setFlipped(false);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-pastel-leaf px-4 py-2 text-sm font-medium text-white hover:bg-pastel-sage transition"
        >
          <Check className="h-4 w-4" />
          I know this
        </button>
        <button
          type="button"
          onClick={() => {
            setSeen((s) => s + 1);
            if (index === cards.length - 1) {
              setDone(true);
            } else {
              setIndex((i) => i + 1);
              setFlipped(false);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-xl bg-pastel-butter px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-sage transition"
        >
          <X className="h-4 w-4" />
          Still learning
        </button>
      </div>
    </div>
  );
}

