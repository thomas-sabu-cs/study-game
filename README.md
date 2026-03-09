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

Open [http://localhost:3000](http://localhost:3000). Use “Open your Locker” to go to the dashboard (auth and full features will be wired in the next steps).

**Database:** Run the SQL migrations in order in Supabase (Dashboard → SQL Editor): `001_subjects.sql`, then `002_study_files_and_quizzes.sql`. **Storage:** Create a bucket named `study-files` in Supabase Dashboard → Storage → New bucket (private is fine).

### 3. Folder structure

See **[FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md)** for the full layout and implementation steps.

## Tech stack

- **Framework**: Next.js 15 (App Router), TypeScript, Tailwind CSS
- **Auth**: Clerk or NextAuth (Google)
- **Database & storage**: Supabase (Postgres, Storage)
- **AI**: Google Gemini 1.5 Flash (`@google/generative-ai`)
- **Icons**: lucide-react

## Implementation status

| Step | Status |
|------|--------|
| 1. Scaffold + Tailwind | ✅ Done |
| 2. Supabase (DB + Storage) | Next |
| 3. Auth | Pending |
| 4. File upload + text extraction | Pending |
| 5. Gemini quiz generation | Pending |
| 6. Quiz UI (scoring, streak, theme) | Pending |
