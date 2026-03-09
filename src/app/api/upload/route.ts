import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractTextFromBuffer } from "@/lib/extract/text";

const BUCKET = "study-files";
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "text/plain",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subjectId = formData.get("subjectId") as string | null;

    if (!file || !subjectId) {
      return NextResponse.json(
        { error: "Missing file or subjectId" },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    let mime = file.type || "application/octet-stream";
    const ext = (file.name || "").toLowerCase();
    if (mime === "application/octet-stream" && ext) {
      if (ext.endsWith(".pdf")) mime = "application/pdf";
      else if (ext.endsWith(".txt")) mime = "text/plain";
      else if (ext.endsWith(".jpg") || ext.endsWith(".jpeg")) mime = "image/jpeg";
      else if (ext.endsWith(".png")) mime = "image/png";
      else if (ext.endsWith(".webp")) mime = "image/webp";
    }
    if (!ALLOWED_TYPES.includes(mime)) {
      return NextResponse.json(
        { error: "Only PDF, TXT, and JPEG/PNG/WebP images are allowed." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    const { data: subject } = await supabase
      .from("subjects")
      .select("id")
      .eq("id", subjectId)
      .eq("user_id", userId)
      .single();

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const safeName = (file.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
    const storagePath = `${userId}/${subjectId}/${crypto.randomUUID()}_${safeName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload storage error:", uploadError.message);
      const msg = uploadError.message ?? "";
      if (
        msg.includes("Bucket") ||
        msg.includes("bucket") ||
        msg.includes("not found") ||
        msg.includes("NotFound")
      ) {
        return NextResponse.json(
          {
            error:
              'Storage bucket "study-files" not found. In Supabase Dashboard go to Storage → New bucket → name it "study-files".',
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: msg || "Storage upload failed. Check Supabase Storage is set up." },
        { status: 500 }
      );
    }

    const { text, error: extractError } = await extractTextFromBuffer(buffer, mime);
    if (extractError && !text) {
      return NextResponse.json(
        { error: extractError },
        { status: 400 }
      );
    }

    const { data: row, error: insertError } = await supabase
      .from("study_files")
      .insert({
        subject_id: subjectId,
        user_id: userId,
        name: file.name || safeName,
        storage_path: uploadData.path,
        extracted_text: text || null,
      })
      .select("id, name, created_at, extracted_text")
      .single();

    if (insertError) {
      console.error("Insert study_files:", insertError.message);
      return NextResponse.json(
        { error: insertError.message || "Failed to save file record" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: row.id,
      name: row.name,
      created_at: row.created_at,
      hasText: Boolean(row.extracted_text),
    });
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error("Upload API error:", err.message, err.stack);
    const message =
      err.message.includes("SUPABASE") || err.message.includes("Missing")
        ? err.message
        : err.message || "Upload failed. Check the server terminal for details.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
