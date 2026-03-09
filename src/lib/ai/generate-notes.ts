/**
 * Use Gemini to turn raw document text into easily digestible notes.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";
const MAX_OUTPUT_TOKENS = 8192;

export async function generateNotesFromText(
  text: string,
  options?: { title?: string }
): Promise<{ content: string; title?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { content: "", error: "GEMINI_API_KEY is not set." };
  }

  const trimmed = text.trim().slice(0, 150_000);
  if (!trimmed) {
    return { content: "", error: "No text provided." };
  }

  const prompt = `You are a study assistant. Turn this document into easily digestible notes.

Format the notes in clear markdown:
- Use headers (##, ###) to organize by topic
- Use bullet points and numbered lists for key ideas
- Add brief summaries at the start of each section
- Highlight important terms or definitions with **bold**
- Keep paragraphs short (2-4 sentences max)
- Remove filler and redundancy; focus on what matters for studying
- If the content has distinct sections/chapters, preserve that structure

Return ONLY the markdown notes, no preamble or "Here are your notes" - just the notes themselves.`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: MODEL,
      generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS },
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: `${prompt}\n\n---\n\n${trimmed}` }] }],
    });

    const content = result.response.text?.()?.trim() ?? "";
    if (!content) return { content: "", error: "AI returned no content." };

    // Optional: extract first heading as title
    const firstH1 = content.match(/^#\s+(.+)$/m);
    const title = options?.title ?? (firstH1 ? firstH1[1].trim() : undefined);

    return { content, title };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { content: "", error: `Note generation failed: ${msg}` };
  }
}
