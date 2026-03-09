# Environment Variables – Study Game

Collect these **before** running the app. Copy `.env.example` to `.env.local` and fill in the values.

---

## 1. Supabase (Database + Storage)

| Variable | Where to get it | Notes |
|----------|-----------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | [Supabase Dashboard](https://supabase.com/dashboard) → Your project → **Settings** → **API** → Project URL | Required for client + server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same page → **Project API keys** → `anon` `public` | Safe for browser; RLS protects data |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page → **service_role** key | Server-only; bypasses RLS. Keep secret. |

---

## 2. Google Gemini (Free tier)

| Variable | Where to get it |
|----------|-----------------|
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) → Create API key (free tier) |

---

## 3. Authentication (pick one)

### Option A: Clerk (recommended)

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) → API Keys |
| `CLERK_SECRET_KEY` | Same page → Secret key |

### Option B: NextAuth with Google

| Variable | Where to get it |
|----------|-----------------|
| `NEXT_AUTH_URL` | Your app URL (e.g. `http://localhost:3000`) |
| `NEXT_AUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → OAuth 2.0 Client ID |
| `GOOGLE_CLIENT_SECRET` | Same OAuth client → Secret |

---

## Quick checklist

- [ ] Supabase project created; URL + anon key + service role key copied
- [ ] Gemini API key created at Google AI Studio
- [ ] Clerk **or** NextAuth Google credentials set up
- [ ] `.env.example` copied to `.env.local` and all values filled in
