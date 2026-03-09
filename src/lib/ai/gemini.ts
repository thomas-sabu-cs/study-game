/**
 * Use Gemini 1.5 Flash to generate quiz questions from study text.
 * Returns a JSON array of questions (multiple choice + true/false).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import type { QuizQuestion } from "@/types";

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 8192;

const SYSTEM_PROMPT = `You are a helpful study assistant. Based on the provided text, generate 10 challenging but fair multiple-choice and true/false questions. Return ONLY a valid JSON array, no markdown or explanation. Each item must have:
- "id": string (e.g. "q1", "q2")
- "type": "multiple_choice" or "true_false"
- "question": string
- "options": array of { "id": string, "text": string, "isCorrect": boolean }
- "explanation": string (optional)

For true_false, use exactly two options with text "True" and "False". Mix question types.`;

export async function generateQuizQuestions(text: string): Promise<{
  questions: QuizQuestion[];
  error?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { questions: [], error: "GEMINI_API_KEY is not set." };
  }

  const trimmed = text.trim().slice(0, 300_000); // ~300k chars max
  if (!trimmed) {
    return { questions: [], error: "No text provided to generate questions." };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${SYSTEM_PROMPT}\n\nStudy text:\n\n${trimmed}` }] }],
    });

    const response = result.response;
    const raw = response.text?.()?.trim() ?? "";
    if (!raw) return { questions: [], error: "Gemini returned no content." };

    // Strip markdown code block if present
    let jsonStr = raw;
    const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();

    const parsed = JSON.parse(jsonStr) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const questions: QuizQuestion[] = arr.slice(0, 15).map((q: unknown, i: number) => {
      const x = q as Record<string, unknown>;
      const options = Array.isArray(x.options)
        ? (x.options as Array<{ id?: string; text?: string; isCorrect?: boolean }>).map((o, j) => ({
            id: typeof o.id === "string" ? o.id : `opt-${i}-${j}`,
            text: typeof o.text === "string" ? o.text : String(o.text ?? ""),
            isCorrect: Boolean(o.isCorrect),
          }))
        : [];
      return {
        id: typeof x.id === "string" ? x.id : `q${i + 1}`,
        type: x.type === "true_false" ? "true_false" : "multiple_choice",
        question: typeof x.question === "string" ? x.question : String(x.question ?? ""),
        options,
        explanation: typeof x.explanation === "string" ? x.explanation : undefined,
      };
    });

    return { questions };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { questions: [], error: `Quiz generation failed: ${message}` };
  }
}
