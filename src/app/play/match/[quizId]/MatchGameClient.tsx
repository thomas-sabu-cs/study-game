"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Clock, RotateCcw } from "lucide-react";
import type { QuizQuestion } from "@/types";

type Pair = {
  id: string;
  left: string; // prompt
  right: string; // answer/definition
};

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

function truncate(s: string, max: number) {
  const t = (s || "").trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function MatchGameClient({
  questions,
  quizId,
}: {
  questions: QuizQuestion[];
  quizId: string;
}) {
  const startRef = useRef<number>(Date.now());
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [mistakesByPair, setMistakesByPair] = useState<Record<string, number>>({});
  const [flashWrong, setFlashWrong] = useState<{ left?: string; right?: string } | null>(null);
  const [doneAtSeconds, setDoneAtSeconds] = useState<number | null>(null);

  const pairs: Pair[] = useMemo(() => {
    const mc = questions
      .filter((q) => q.type === "multiple_choice")
      .map((q, i) => {
        const correct = q.options.find((o) => o.isCorrect)?.text?.trim() || "";
        return {
          id: q.id || `q${i + 1}`,
          left: q.question,
          right: correct,
        };
      })
      .filter((p) => p.right);

    // Keep it manageable
    const limited = mc.slice(0, 10);
    return limited;
  }, [questions]);

  const rightItems = useMemo(() => shuffle(pairs.map((p) => ({ id: p.id, text: p.right }))), [pairs]);

  const total = pairs.length;
  const complete = matched.size === total && total > 0;

  useEffect(() => {
    startRef.current = Date.now();
  }, [quizId]);

  useEffect(() => {
    if (!selectedLeft || !selectedRight) return;
    if (selectedLeft === selectedRight) {
      setMatched((prev) => new Set(prev).add(selectedLeft));
      setSelectedLeft(null);
      setSelectedRight(null);
      setFlashWrong(null);
      return;
    }

    // Wrong match
    setMistakesByPair((m) => ({
      ...m,
      [selectedLeft]: (m[selectedLeft] ?? 0) + 1,
    }));
    setFlashWrong({ left: selectedLeft, right: selectedRight });
    setSelectedRight(null);
    const leftId = selectedLeft;
    setTimeout(() => {
      setFlashWrong((f) => (f?.left === leftId ? null : f));
    }, 650);
  }, [selectedLeft, selectedRight]);

  useEffect(() => {
    if (!complete) return;
    const elapsed = (Date.now() - startRef.current) / 1000;
    setDoneAtSeconds(Math.max(0, Math.round(elapsed)));
  }, [complete]);

  if (pairs.length < 3) {
    return (
      <div className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-8 text-center">
        <p className="text-gray-700 font-medium">Not enough matchable questions.</p>
        <p className="mt-2 text-sm text-gray-600">
          Match uses multiple-choice questions (True/False are skipped). Generate a quiz with more multiple-choice questions and try again.
        </p>
        <Link href="/play" className="mt-4 inline-block text-pastel-leaf hover:underline">
          Back to Play
        </Link>
      </div>
    );
  }

  if (complete) {
    const mistakes = Object.values(mistakesByPair).reduce((a, b) => a + b, 0);
    const score = Math.max(0, total - mistakes);
    const pct = Math.round((score / total) * 100);

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Match complete</h1>

        <div className="rounded-2xl border border-pastel-sage/50 bg-white/80 p-6 shadow-sm">
          <div className="text-center">
            <p className="text-4xl font-bold text-gray-800">
              {score} <span className="text-2xl font-normal text-gray-500">/ {total}</span>
            </p>
            <p className="mt-1 text-lg text-gray-600">{pct}% accuracy</p>
            {typeof doneAtSeconds === "number" && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-gray-500">
                <Clock className="h-4 w-4" />
                {formatTime(doneAtSeconds)}
              </p>
            )}
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/play"
              className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
            >
              Back to Play
            </Link>
            <button
              type="button"
              onClick={() => {
                startRef.current = Date.now();
                setSelectedLeft(null);
                setSelectedRight(null);
                setMatched(new Set());
                setMistakesByPair({});
                setFlashWrong(null);
                setDoneAtSeconds(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-pastel-mint px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-sage transition"
            >
              <RotateCcw className="h-4 w-4" />
              Retry match
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Match</h1>
          <p className="text-sm text-gray-600">
            Tap one prompt on the left, then its matching answer on the right.
          </p>
        </div>
        <Link href={`/play/${quizId}`} className="text-sm text-gray-600 hover:text-gray-800 hover:underline">
          Switch to Quiz
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-pastel-sage/50 bg-white/70 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Prompts</p>
          <ul className="space-y-2">
            {pairs.map((p, idx) => {
              const isMatched = matched.has(p.id);
              const isSelected = selectedLeft === p.id;
              const wrong = flashWrong?.left === p.id;
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    disabled={isMatched}
                    onClick={() => setSelectedLeft(p.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isMatched
                        ? "border-green-300 bg-green-50 text-green-800"
                        : wrong
                          ? "border-red-300 bg-red-50 text-red-800"
                          : isSelected
                            ? "border-pastel-leaf bg-pastel-mint/60 text-gray-800"
                            : "border-pastel-sage/50 bg-white hover:bg-pastel-mint/30 text-gray-800"
                    }`}
                    title={p.left}
                  >
                    <span className="text-xs text-gray-500 mr-2">Q{idx + 1}</span>
                    {truncate(p.left, 80)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-pastel-sage/50 bg-white/70 p-4">
          <p className="mb-3 text-sm font-medium text-gray-700">Answers</p>
          <ul className="space-y-2">
            {rightItems.map((r) => {
              const isMatched = matched.has(r.id);
              const isSelected = selectedRight === r.id;
              const wrong = flashWrong?.right === r.id;
              return (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={isMatched || !selectedLeft}
                    onClick={() => setSelectedRight(r.id)}
                    className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                      isMatched
                        ? "border-green-300 bg-green-50 text-green-800"
                        : wrong
                          ? "border-red-300 bg-red-50 text-red-800"
                          : isSelected
                            ? "border-pastel-leaf bg-pastel-mint/60 text-gray-800"
                            : selectedLeft
                              ? "border-pastel-sage/50 bg-white hover:bg-pastel-mint/30 text-gray-800"
                              : "border-pastel-sage/30 bg-white/50 text-gray-400"
                    }`}
                    title={r.text}
                  >
                    {truncate(r.text, 80)}
                  </button>
                </li>
              );
            })}
          </ul>
          {!selectedLeft && (
            <p className="mt-3 text-xs text-gray-500">
              Pick a prompt first to unlock answers.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>
          Matched: <span className="font-medium text-gray-800">{matched.size}</span> / {total}
        </span>
        <span>
          Mistakes: <span className="font-medium text-gray-800">{Object.values(mistakesByPair).reduce((a, b) => a + b, 0)}</span>
        </span>
      </div>
    </div>
  );
}

