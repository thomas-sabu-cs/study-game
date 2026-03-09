"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  X,
  ArrowRight,
  RotateCcw,
  Lightbulb,
  Flag,
  AlertTriangle,
  Loader2,
  Bookmark,
  Clock,
} from "lucide-react";
import {
  explainQuestion,
  flagQuestion,
  reportQuestion,
  saveQuizAttempt,
} from "../actions";
import type { QuizQuestion } from "@/types";

function formatTime(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s ? `${m}m ${s}s` : `${m}m`;
}

export function TakeQuizClient({
  questions,
  quizId,
}: {
  questions: QuizQuestion[];
  quizId: string;
}) {
  const [index, setIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [questionTimes, setQuestionTimes] = useState<number[]>([]);
  const [totalTimeSeconds, setTotalTimeSeconds] = useState(0);
  const [completedQuestionTimes, setCompletedQuestionTimes] = useState<number[]>([]);
  const questionStartRef = useRef(Date.now());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ explanation: string; memoryTip: string } | null>(null);
  const [reporting, setReporting] = useState(false);
  const [reportNote, setReportNote] = useState("");
  const [flagSuccess, setFlagSuccess] = useState<string | null>(null);

  const current = questions[index];
  const isLast = index === questions.length - 1;
  const correctOption = current?.options.find((o) => o.isCorrect);
  const userOption = current && selectedOptionId ? current.options.find((o) => o.id === selectedOptionId) : null;

  useEffect(() => {
    questionStartRef.current = Date.now();
  }, [index]);

  function handleSelect(optionId: string) {
    if (revealed) return;
    setSelectedOptionId(optionId);
  }

  function handleReveal() {
    if (!selectedOptionId || revealed) return;
    const elapsed = (Date.now() - questionStartRef.current) / 1000;
    setQuestionTimes((t) => [...t, elapsed]);
    const option = current.options.find((o) => o.id === selectedOptionId);
    const correct = option?.isCorrect ?? false;
    setRevealed(true);
    setAiResult(null);
    if (correct) setScore((s) => s + 1);
    setAnswers((a) => [...a, correct]);
  }

  async function handleExplain() {
    if (!current || !correctOption || !userOption) return;
    setAiLoading(true);
    setAiResult(null);
    const result = await explainQuestion({
      question: current.question,
      correctAnswer: correctOption.text,
      userAnswer: userOption.text,
      existingExplanation: current.explanation,
    });
    setAiLoading(false);
    if (result.error) {
      setAiResult({ explanation: result.error, memoryTip: "" });
    } else {
      setAiResult({ explanation: result.explanation, memoryTip: result.memoryTip });
    }
  }

  async function handleFlag() {
    if (!current) return;
    const res = await flagQuestion(quizId, current.id);
    if (res?.error) setFlagSuccess("Failed: " + res.error);
    else setFlagSuccess("Flagged for review");
    setTimeout(() => setFlagSuccess(null), 2000);
  }

  async function handleReport() {
    if (!current) return;
    const res = await reportQuestion(quizId, current.id, reportNote);
    setReporting(false);
    setReportNote("");
    if (res?.error) setFlagSuccess("Report failed: " + res.error);
    else setFlagSuccess("Reported. Thanks for helping improve the quiz.");
    setTimeout(() => setFlagSuccess(null), 3000);
  }

  function handleNext() {
    if (isLast) {
      const lastCorrect = correctOption?.id === selectedOptionId;
      const finalScore = score + (lastCorrect ? 1 : 0);
      const lastQuestionSec = (Date.now() - questionStartRef.current) / 1000;
      const allTimes = [...questionTimes, lastQuestionSec];
      const totalSec = Math.round(allTimes.reduce((a, b) => a + b, 0));
      setTotalTimeSeconds(totalSec);
      setCompletedQuestionTimes(allTimes);
      saveQuizAttempt(
        quizId,
        finalScore,
        questions.length,
        [...answers, lastCorrect].map((correct, i) => ({ questionIndex: i, correct })),
        totalSec,
        allTimes.map((s) => Math.round(s))
      );
    }
    setIndex((i) => i + 1);
    setSelectedOptionId(null);
    setRevealed(false);
    setAiResult(null);
  }

  if (!current) {
    return (
      <div className="rounded-2xl border border-pastel-sage/50 bg-white/60 p-8 text-center">
        <p className="text-gray-600">No questions in this quiz.</p>
        <Link href="/play" className="mt-4 inline-block text-pastel-leaf hover:underline">
          Back to Play
        </Link>
      </div>
    );
  }

  if (index >= questions.length) {
    const pct = Math.round((score / questions.length) * 100);
    const times = completedQuestionTimes.length > 0
      ? completedQuestionTimes.map((s) => Math.round(s))
      : [];

    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-800">Quiz complete</h1>

        <div className="rounded-2xl border border-pastel-sage/50 bg-white/80 p-6 shadow-sm transition">
          <div className="text-center">
            <p className="text-4xl font-bold text-pastel-leaf">
              {score} <span className="text-2xl font-normal text-gray-500">/ {questions.length}</span>
            </p>
            <p className="mt-1 text-lg text-gray-600">{pct}% correct</p>
            {totalTimeSeconds > 0 && (
              <p className="mt-2 flex items-center justify-center gap-1.5 text-gray-500">
                <Clock className="h-4 w-4" />
                {formatTime(totalTimeSeconds)} total
              </p>
            )}
          </div>

          {times.length > 0 && (
            <div className="mt-6 border-t border-pastel-sage/30 pt-4">
              <p className="mb-2 text-sm font-medium text-gray-600">Time per question</p>
              <div className="flex flex-wrap gap-2">
                {times.map((sec, i) => (
                  <span
                    key={i}
                    className="rounded-lg bg-pastel-mint/60 px-2.5 py-1 text-xs font-medium text-gray-700"
                  >
                    Q{i + 1}: {sec}s
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-gray-400">This attempt was saved.</p>

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
                setIndex(0);
                setSelectedOptionId(null);
                setRevealed(false);
                setScore(0);
                setAnswers([]);
                setQuestionTimes([]);
                setTotalTimeSeconds(0);
                setCompletedQuestionTimes([]);
                setAiResult(null);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-pastel-mint px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-pastel-sage transition"
            >
              <RotateCcw className="h-4 w-4" />
              Retry quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((index + 1) / questions.length) * 100;

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Question {index + 1} of {questions.length}</span>
          <span>{score} correct</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-pastel-sage/40">
          <div
            className="h-full rounded-full bg-pastel-leaf transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-pastel-sage/50 bg-white/80 p-5 shadow-sm transition">
        <h2 className="mb-4 text-lg font-semibold leading-snug text-gray-800">{current.question}</h2>
        <ul className="space-y-2">
          {current.options.map((opt) => {
            const isSelected = selectedOptionId === opt.id;
            const showCorrect = revealed && opt.isCorrect;
            const showWrong = revealed && isSelected && !opt.isCorrect;
            return (
              <li key={opt.id}>
                <button
                  type="button"
                  onClick={() => handleSelect(opt.id)}
                  disabled={revealed}
                  className={`w-full rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition ${
                    showCorrect
                      ? "border-green-500 bg-green-50 text-green-800"
                      : showWrong
                        ? "border-red-400 bg-red-50 text-red-800"
                        : isSelected
                          ? "border-pastel-leaf bg-pastel-mint/50 text-gray-800"
                          : "border-pastel-sage/50 bg-white hover:bg-pastel-mint/30 text-gray-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {showCorrect && <Check className="h-4 w-4 text-green-600" />}
                    {showWrong && <X className="h-4 w-4 text-red-600" />}
                    {opt.text}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {current.explanation && revealed && !aiResult && (
          <p className="mt-4 rounded-lg bg-pastel-mint/50 px-3 py-2 text-sm text-gray-700">
            {current.explanation}
          </p>
        )}

        {aiResult && revealed && (
          <div className="mt-4 space-y-2 rounded-lg bg-pastel-sky/40 px-3 py-3 text-sm">
            <p className="font-medium text-gray-800">Better explanation</p>
            <p className="text-gray-700">{aiResult.explanation}</p>
            {aiResult.memoryTip && (
              <p className="border-t border-pastel-sage/50 pt-2">
                <span className="font-medium text-gray-800">Memory tip:</span> {aiResult.memoryTip}
              </p>
            )}
          </div>
        )}

        {revealed && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-pastel-sage/30 pt-4">
            <button
              type="button"
              onClick={handleExplain}
              disabled={aiLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-butter px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-pastel-sage transition disabled:opacity-50"
            >
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lightbulb className="h-4 w-4" />}
              Explain with AI
            </button>
            <button
              type="button"
              onClick={handleFlag}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-mint px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-pastel-sage transition"
            >
              <Bookmark className="h-4 w-4" />
              Flag for review
            </button>
            <button
              type="button"
              onClick={() => setReporting(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-pastel-blossom/60 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-pastel-blossom transition"
            >
              <AlertTriangle className="h-4 w-4" />
              Report wrong
            </button>
            {flagSuccess && (
              <span className="text-sm text-pastel-leaf font-medium">{flagSuccess}</span>
            )}
          </div>
        )}

        {reporting && (
          <div className="mt-3 rounded-lg border border-pastel-sage/50 bg-white p-3">
            <p className="mb-2 text-sm font-medium text-gray-700">Optional: what seems wrong?</p>
            <textarea
              value={reportNote}
              onChange={(e) => setReportNote(e.target.value)}
              placeholder="e.g. Correct answer might be B, or the question is unclear"
              className="mb-2 w-full rounded-lg border border-pastel-sage/60 px-3 py-2 text-sm"
              rows={2}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReport}
                className="rounded-lg bg-pastel-blossom/80 px-3 py-1.5 text-sm font-medium"
              >
                Submit report
              </button>
              <button
                type="button"
                onClick={() => { setReporting(false); setReportNote(""); }}
                className="rounded-lg bg-gray-200 px-3 py-1.5 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          {!revealed ? (
            <button
              type="button"
              onClick={handleReveal}
              disabled={!selectedOptionId}
              className="rounded-xl bg-pastel-leaf px-4 py-2 text-sm font-medium text-white hover:bg-pastel-sage transition disabled:opacity-50"
            >
              Check answer
            </button>
          ) : (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1 rounded-xl bg-pastel-sage px-4 py-2 text-sm font-medium text-gray-800 hover:bg-pastel-leaf transition"
            >
              {isLast ? "See results" : "Next"}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
