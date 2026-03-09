# Study Game – Folder Structure

```
09-Study-app-KT/
├── .env.example          # Template for env vars (copy to .env.local)
├── .env.local            # Your secrets (git-ignored)
├── ENV_SETUP.md          # Where to get each env variable
├── FOLDER_STRUCTURE.md   # This file
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts    # Pastel theme colors
├── tsconfig.json
│
├── public/               # Static assets
│
└── src/
    ├── app/              # App Router
    │   ├── layout.tsx
    │   ├── page.tsx      # Landing → link to dashboard
    │   ├── globals.css
    │   ├── dashboard/    # Locker: subjects, uploads (Step 2–4)
    │   ├── quiz/         # Game UI: play quiz, score, streak (Step 6)
    │   └── api/          # API routes (upload, generate-quiz, etc.)
    │
    ├── components/       # Reusable UI
    │   ├── ui/           # Buttons, cards, progress bars
    │   ├── dashboard/    # Locker, subject cards, file list
    │   └── quiz/         # Question card, feedback, streak badge
    │
    ├── lib/              # Services & utilities
    │   ├── supabase/     # client.ts, server.ts
    │   ├── auth/         # Clerk or NextAuth helpers
    │   ├── ai/           # Gemini service (generate questions)
    │   └── extract/      # PDF/TXT text extraction
    │
    └── types/            # Shared TypeScript types
        └── index.ts      # Subject, File, QuizQuestion, etc.
```

## Implementation steps (reference)

| Step | Focus |
|------|--------|
| 1 | Scaffold + Tailwind ✅ |
| 2 | Supabase DB schema + Storage buckets |
| 3 | Auth (Clerk or NextAuth) |
| 4 | File upload + text extraction (PDF/TXT) |
| 5 | Gemini 1.5 Flash → JSON questions API |
| 6 | Quiz UI: scoring, progress, streak, pastel theme |
