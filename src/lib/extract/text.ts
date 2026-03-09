/**
 * Extract plain text from PDF, TXT, or image (JPEG/PNG/WebP) buffer.
 * PDF: pdf-parse; TXT: UTF-8; Images: Gemini vision.
 */

import { extractTextFromImage } from "@/lib/ai/extract-from-image";

// Dynamic import for pdf-parse (CommonJS, used only on server)
async function loadPdfParse() {
  const pdfParse = (await import("pdf-parse")).default;
  return pdfParse as (buffer: Buffer) => Promise<{ text: string; numpages: number }>;
}

const MAX_TEXT_LENGTH = 500_000; // ~500k chars to avoid overwhelming Gemini

const IMAGE_MIMES = ["image/jpeg", "image/png", "image/webp"];

export async function extractTextFromBuffer(
  buffer: Buffer,
  mimeType: string
): Promise<{ text: string; error?: string }> {
  try {
    if (mimeType === "application/pdf") {
      const pdfParse = await loadPdfParse();
      const { text } = await pdfParse(buffer);
      const trimmed = (text || "").trim();
      if (!trimmed) return { text: "", error: "PDF contained no extractable text." };
      return { text: trimmed.slice(0, MAX_TEXT_LENGTH) };
    }
    if (
      mimeType === "text/plain" ||
      mimeType === "text/html" ||
      mimeType === "application/octet-stream"
    ) {
      const text = buffer.toString("utf-8").trim();
      if (!text) return { text: "", error: "File was empty or not valid UTF-8 text." };
      return { text: text.slice(0, MAX_TEXT_LENGTH) };
    }
    if (IMAGE_MIMES.includes(mimeType)) {
      return extractTextFromImage(buffer, mimeType);
    }
    return { text: "", error: "Unsupported file type. Use PDF, TXT, or JPEG/PNG/WebP." };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { text: "", error: `Extraction failed: ${message}` };
  }
}
