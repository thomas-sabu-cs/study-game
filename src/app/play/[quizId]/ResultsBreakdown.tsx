"use client";

import { useEffect, useState } from "react";
import { Loader2, Lightbulb } from "lucide-react";
import { analyzeQuizResults } from "../actions";
import type { QuizQuestion } from "@/types";
import type { CategoryResult } from "../actions";

function scoreColor(pct: number): string {
  if (pct <= 60) return "hsl(0, 70%, 42%)";
  if (pct < 80) {
    const t = (pct - 60) / 20;
    return `hsl(${0 + t * 50}, 85%, 45%)`;
  }
  const t = (pct - 80) / 20;
  return `hsl(${50 + t * 70}, 75%, 42%)`;
}

function DonutChart({ categories }: { categories: CategoryResult[] }) {
  const total = categories.reduce((s, c) => s + c.correct + c.missed, 0);
  if (total === 0) return null;

  const size = 160;
  const stroke = 24;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;

  let startAngle = -90; // start from top (12 o'clock)
  const rad = (a: number) => (a * Math.PI) / 180;
  const segments = categories.map((cat) => {
    const count = cat.correct + cat.missed;
    const pct = count / total;
    const angle = pct * 360;
    const color = scoreColor((cat.correct / count) * 100);
    const endAngle = startAngle + angle;

    const x1 = cx + r * Math.cos(rad(startAngle));
    const y1 = cy + r * Math.sin(rad(startAngle));
    const x2 = cx + r * Math.cos(rad(endAngle));
    const y2 = cy + r * Math.sin(rad(endAngle));
    const large = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;

    startAngle = endAngle;
    return { d, color, name: cat.name, correct: cat.correct, missed: cat.missed };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <svg width={size} height={size} className="transform -rotate-90">
        {segments.map((seg, i) => (
          <path
            key={i}
            d={seg.d}
            fill="none"
            stroke={seg.color}
            strokeWidth={stroke}
            strokeLinecap="round"
          />
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: seg.color }}
            />
            <span className="text-xs text-gray-600">
              {seg.name}: {seg.correct}/{seg.correct + seg.missed}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResultsBreakdown({
  questions,
  answers,
}: {
  questions: QuizQuestion[];
  answers: boolean[];
}) {
  const [data, setData] = useState<{
    categories: CategoryResult[];
    suggestions: string[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      const result = await analyzeQuizResults(questions, answers);
      if (cancelled) return;
      setLoading(false);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setData(result.data);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [questions, answers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Analyzing your results…</span>
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-4 text-center text-sm text-amber-600">
        Could not analyze categories: {error}
      </p>
    );
  }

  if (!data || data.categories.length === 0) {
    return null;
  }

  return (
    <div className="mt-6 border-t border-pastel-sage/30 pt-4">
      <p className="mb-3 text-sm font-medium text-gray-600">Performance by topic</p>
      <DonutChart categories={data.categories} />
      {data.suggestions.length > 0 && (
        <div className="mt-4 rounded-xl bg-pastel-butter/50 p-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-800">
            <Lightbulb className="h-4 w-4 text-amber-600" />
            What to work on
          </p>
          <ul className="space-y-1.5 text-sm text-gray-700">
            {data.suggestions.map((s, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-pastel-leaf">•</span>
                {s}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
