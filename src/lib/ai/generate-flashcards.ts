/**
 * Use Gemini to turn notes into Q/A flashcards.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 4096;

export interface GeneratedFlashcard {
  front: string;
  back: string;
}

export async function generateFlashcardsFromNotes(
  notesMarkdown: string
): Promise<{ cards: GeneratedFlashcard[]; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { cards: [], error: "GEMINI_API_KEY is not set." };
  }

  const trimmed = notesMarkdown.trim().slice(0, 60_000);
  if (!trimmed) {
    return { cards: [], error: "No notes content provided." };
  }

  const prompt = `You are a study assistant. Turn these notes into concise flashcards.

Return ONLY valid JSON, no markdown, in this shape:
[
  { "front": "Question or prompt", "back": "Short, clear answer" }
]

Rules:
- 8-20 flashcards depending on how much content there is.
- front: short prompt (max ~120 chars) that could go on the front of a card.
- back: short, clear answer or definition (1-3 sentences max).
- Focus on key concepts, definitions, formulas, and cause/effect relationships.
- Do NOT include markdown syntax in the JSON; just plain text strings.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${prompt}\n\n---\n\n${trimmed}` }] }],
    });

    const raw = result.response.text?.()?.trim() ?? "";
    if (!raw) return { cards: [], error: "AI returned no content." };

    let jsonStr = raw;
    const codeMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeMatch) jsonStr = codeMatch[1].trim();

    const parsed = JSON.parse(jsonStr) as unknown;
    const arr = Array.isArray(parsed) ? parsed : [parsed];
    const cards: GeneratedFlashcard[] = arr
      .map((c: any) => ({
        front: typeof c.front === "string" ? c.front.trim() : "",
        back: typeof c.back === "string" ? c.back.trim() : "",
      }))
      .filter((c) => c.front && c.back)
      .slice(0, 24);

    return { cards };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { cards: [], error: `Flashcard generation failed: ${msg}` };
  }
}

