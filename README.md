# Study Game

A cozy web app to upload class files, extract text, and generate AI-powered quizzes. Built with Next.js 15, Supabase, and Google Gemini 1.5 Flash.

## Get started

### 1. Collect environment variables

See **[ENV_SETUP.md](./ENV_SETUP.md)** for where to get each value. You need:

- **Supabase**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- **Gemini**: `GEMINI_API_KEY` (free at [Google AI Studio](https://aistudio.google.com/apikey))
- **Auth**: Clerk (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) *or* NextAuth + Google

Copy `.env.example` to `.env.local` and fill in your keys.

### 2. Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use “Open your Locker” to go to the dashboard.

**Database:** In Supabase (Dashboard → SQL Editor), run all SQL files in `supabase/migrations` in order (`001_*.sql`, `002_*.sql`, …, `009_*.sql`). These create subjects, study files, quizzes, attempts, notes, flashcards, soft-delete for quizzes, and dedupe metadata.

**Storage:** Create a bucket named `study-files` in Supabase → Storage → New bucket (private is fine).

### 3. Folder structure

See **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** for the full layout and implementation steps.

## Tech stack

- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Auth**: Clerk or NextAuth (Google)
- **Database & storage**: Supabase (Postgres, Storage)
- **AI**: Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Icons**: lucide-react

## Features

- **Locker dashboard**
  - Upload PDF / TXT / images (JPEG/PNG/WebP) per subject
  - Text extraction (PDF, plain text, or via Gemini for images)
  - Duplicate uploads are blocked per subject (by file hash); when you try to re-upload the same file, the existing one is auto-scrolled to and highlighted in the list
  - Generate AI quizzes from one or more files; quizzes show up under **Play**

- **Notes**
  - Dedicated “Notes” subject
  - Upload files once and reuse them to generate structured AI notes
  - Duplicate detection + highlight works here as well

- **Play**
  - **Quiz** game: scoring, per-question timing, total time, attempts saved in `quiz_attempts`
  - **Match** game: match prompts to correct answers based on the quiz
  - **Flip**: flashcard flip game (from the Notecards page)
  - Quiz list shows **times played**, **best accuracy**, and **best time**
  - Quizzes can be **soft-deleted**; a “Recently deleted” tab lets you restore or permanently delete them

- **Notecards**
  - Create flashcards manually or generate from notes with Gemini
  - Play the flip game from **Cards** or via the **Flip** option under **Play**

- **Visuals & UX**
  - Perlin-noise background with pastel green base and pink/white particles
  - Global dynamic buttons (`btn-dynamic`) for soft hover/press animation
  - Optional background music toggle in the top nav, using your own relaxing MP3 (`public/audio/relaxing.mp3` or `NEXT_PUBLIC_RELAXING_MP3_URL`)

