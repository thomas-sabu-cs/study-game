/**
 * Use Gemini to extract text / study-relevant info from an image (JPEG, PNG, WebP).
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

const MODEL = "gemini-2.5-flash";
const EXTRACT_PROMPT = `Extract all text visible in this image. If there are diagrams, charts, labels, or handwritten notes, describe them clearly so the content can be used for study notes. If there is no text, describe the image and any key information in a concise study-note format. Return only the extracted text or description, no preamble or markdown.`;

export async function extractTextFromImage(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { text: "", error: "GEMINI_API_KEY is not set." };
  }

  const base64 = buffer.toString("base64");
  const allowedMime = ["image/jpeg", "image/png", "image/webp"];
  const safeMime = allowedMime.includes(mimeType) ? mimeType : "image/jpeg";

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: MODEL });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: safeMime,
                data: base64,
              },
            },
            { text: EXTRACT_PROMPT },
          ],
        },
      ],
    });

    const raw = result.response.text?.()?.trim() ?? "";
    if (!raw) return { text: "", error: "No text could be extracted from the image." };
    return { text: raw.slice(0, 500_000) };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { text: "", error: `Image extraction failed: ${message}` };
  }
}
