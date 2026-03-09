/**
 * Use Gemini to explain an answer more clearly and suggest a memory tip.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";

export async function explainAnswer(params: {
  question: string;
  correctAnswer: string;
  userAnswer: string;
  existingExplanation?: string;
}): Promise<{ explanation: string; memoryTip: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      explanation: "",
      memoryTip: "",
      error: "GEMINI_API_KEY is not set.",
    };
  }

  const prompt = `You are a friendly study coach. A student got this question wrong or is confused.

Question: ${params.question}
Correct answer: ${params.correctAnswer}
What the student chose: ${params.userAnswer}
${params.existingExplanation ? `Original explanation (you can expand on this): ${params.existingExplanation}` : ""}

Respond with exactly two short paragraphs:
1. EXPLANATION: Explain why the correct answer is right in simple, clear language. Help the student understand, not just memorize.
2. MEMORY TIP: One brief memory trick, mnemonic, or tip to remember this (e.g. an acronym, a silly phrase, or a key word). Keep it short.

Format your response exactly like this (so we can parse it):
---EXPLANATION---
(your explanation here)
---MEMORY TIP---
(your memory tip here)`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });
    const result = await model.generateContent({ contents: [{ role: "user", parts: [{ text: prompt }] }] });
    const raw = result.response.text?.()?.trim() ?? "";
    if (!raw) return { explanation: "", memoryTip: "", error: "No response from AI." };

    const explMatch = raw.match(/---EXPLANATION---\s*([\s\S]*?)(?=---MEMORY TIP---|$)/);
    const tipMatch = raw.match(/---MEMORY TIP---\s*([\s\S]*?)$/);
    const explanation = (explMatch?.[1] ?? raw).trim().slice(0, 2000);
    const memoryTip = (tipMatch?.[1] ?? "").trim().slice(0, 500);

    return { explanation, memoryTip };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { explanation: "", memoryTip: "", error: message };
  }
}
