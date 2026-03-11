"use client";

import { usePathname } from "next/navigation";
import { useUser, SignUpButton } from "@clerk/nextjs";

export function GuestModeBanner() {
  const { isLoaded, isSignedIn } = useUser();
  const pathname = usePathname();

  if (!isLoaded || isSignedIn) return null;

  const inStudyArea =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/play") ||
    pathname.startsWith("/notes") ||
    pathname.startsWith("/cards");

  if (!inStudyArea) return null;

  return (
    <div className="px-4 pt-4 sm:pt-6 flex justify-center">
      <div className="card-surface flex w-full max-w-4xl items-start gap-3 px-4 py-3 text-sm">
        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(251,191,36,0.35)]" />
        <div className="space-y-1">
          <p className="font-medium text-amber-100 sm:text-amber-50">
            You&apos;re exploring in guest mode.
          </p>
          <p className="text-xs text-amber-100/90">
            Your subjects, notes, and games are stored in a shared guest space and may be cleared.
            <span className="hidden sm:inline"> </span>
            <span className="block sm:inline">
              <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
                <button
                  type="button"
                  className="font-semibold underline underline-offset-2"
                >
                  Create a free account
                </button>
              </SignUpButton>{" "}
              to keep a private locker synced across devices.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

