/**
 * Use Gemini to categorize quiz questions by topic and suggest what to work on.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuizQuestion } from "@/types";

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 4096;

export interface CategoryResult {
  name: string;
  correct: number;
  missed: number;
}

export interface AnalyzeResult {
  categories: CategoryResult[];
  suggestions: string[];
}

export async function analyzeQuizResults(
  questions: QuizQuestion[],
  answers: boolean[]
): Promise<{ data?: AnalyzeResult; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { error: "GEMINI_API_KEY is not set." };
  }

  if (questions.length === 0 || answers.length !== questions.length) {
    return { error: "Invalid questions or answers." };
  }

  const items = questions.map((q, i) => ({
    index: i + 1,
    id: q.id,
    question: q.question,
    correct: answers[i],
  }));

  const prompt = `You are a study coach. Analyze these quiz questions and results. For each question, assign a SHORT category/topic (2-4 words) based on what the question is testing (e.g. "Cell Division", "World War II", "Algebra Basics").

Return ONLY valid JSON in this exact shape, no markdown:
{
  "assignments": [
    { "index": 1, "category": "Category Name" },
    { "index": 2, "category": "Category Name" },
    ...
  ],
  "suggestions": [
    "One actionable suggestion for what to study based on missed questions.",
    "Another suggestion if relevant."
  ]
}

Rules:
- assignments: one object per question, index 1-based. category must be 2-4 words.
- Group similar topics into the same category name (e.g. all mitosis questions get "Cell Division").
- suggestions: 1-3 short, friendly tips. Prioritize categories where the user missed questions.
- Return ONLY the JSON object, no other text.

Questions and results:
${JSON.stringify(items)}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const raw = result.response.text?.()?.trim() ?? "";
    if (!raw) return { error: "AI returned no content." };

    let jsonStr = raw;
    const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();

    const parsed = JSON.parse(jsonStr) as { assignments?: { index: number; category: string }[]; suggestions?: unknown[] };
    const assignments = parsed.assignments ?? [];

    // Aggregate by category from per-question assignments
    const map = new Map<string, { correct: number; missed: number }>();
    for (let i = 0; i < questions.length; i++) {
      const a = assignments.find((x) => x.index === i + 1);
      const cat = (a?.category?.trim() || "Other").slice(0, 40);
      const correct = answers[i];
      if (!map.has(cat)) map.set(cat, { correct: 0, missed: 0 });
      const entry = map.get(cat)!;
      if (correct) entry.correct++;
      else entry.missed++;
    }
    const categories = Array.from(map.entries()).map(([name, v]) => ({
      name,
      correct: v.correct,
      missed: v.missed,
    }));
    const suggestions = (parsed.suggestions ?? []).filter((s): s is string => typeof s === "string");

    return { data: { categories, suggestions } };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { error: `Analysis failed: ${msg}` };
  }
}
