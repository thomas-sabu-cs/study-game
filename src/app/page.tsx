import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { BookOpen, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main className="min-h-screen p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center gap-2 rounded-xl border-2 border-gray-900 bg-pastel-sage p-3">
          <BookOpen className="h-12 w-12 text-gray-800" strokeWidth={1.5} />
          <Sparkles className="h-12 w-12 text-gray-800" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Study Buddy</h1>
        <p className="text-gray-600">
          Your cozy locker for subjects, file uploads, and AI-generated quizzes.
        </p>
        <SignedOut>
          <SignInButton mode="modal">
            <button
              type="button"
              className="btn-dynamic inline-flex items-center gap-2 rounded-xl border-2 border-gray-900 bg-pastel-sage px-6 py-3 text-gray-800 font-medium shadow-sm hover:bg-pastel-leaf transition"
            >
              Sign in to open your Locker
            </button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="btn-dynamic inline-flex items-center gap-2 rounded-xl border-2 border-gray-900 bg-pastel-sage px-6 py-3 text-gray-800 font-medium shadow-sm hover:bg-pastel-leaf transition"
          >
            Open your Locker
          </Link>
        </SignedIn>
      </div>
    </main>
  );
}
