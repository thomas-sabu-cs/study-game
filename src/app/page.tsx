import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { BookOpen, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pastel-cream via-pastel-mint/40 to-pastel-seafoam/30 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center gap-2">
          <BookOpen className="h-12 w-12 text-pastel-leaf" strokeWidth={1.5} />
          <Sparkles className="h-12 w-12 text-pastel-sage" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Study Game</h1>
        <p className="text-gray-600">
          Your cozy locker for subjects, file uploads, and AI-generated quizzes.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-6 py-3 text-gray-800 font-medium shadow-sm hover:bg-pastel-leaf transition"
            >
              Sign in to open your Locker
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-pastel-sage px-6 py-3 text-gray-800 font-medium shadow-sm hover:bg-pastel-leaf transition"
          >
            Open your Locker
          </Link>
        </SignedIn>
      </div>
    </main>
  );
}
