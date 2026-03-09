import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { getTotalPlaytimeSeconds } from "@/app/play/actions";
import { NoiseParticleBackground } from "@/components/NoiseParticleBackground";
import { StarfieldBackground } from "@/components/StarfieldBackground";
import { getUserSettings } from "@/app/profile/actions";
import "./globals.css";

const RAINBOW_UNLOCK_HOURS = 1;
const RAINBOW_UNLOCK_SECONDS = RAINBOW_UNLOCK_HOURS * 3600;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study Buddy – Your Locker",
  description: "Upload notes, generate quizzes, and level up your study streak.",
  manifest: "/manifest.json",
  themeColor: "#a5d6a7",
  appleWebApp: {
    capable: true,
    title: "Study Buddy",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const totalPlaytimeSeconds = await getTotalPlaytimeSeconds();
  const rainbowUnlocked = totalPlaytimeSeconds >= RAINBOW_UNLOCK_SECONDS;
  const settings = await getUserSettings();
  const backgroundMode = settings?.background_mode ?? "stars";
  const baseTextClass =
    backgroundMode === "stars" ? "text-gray-100" : "text-gray-800";

  const content = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  ) : (
    children
  );
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className={`min-h-screen font-sans ${baseTextClass}`}>
        {backgroundMode === "perlin" ? (
          <NoiseParticleBackground rainbowUnlocked={rainbowUnlocked} />
        ) : backgroundMode === "starsLight" ? (
          <StarfieldBackground variant="light" />
        ) : (
          <StarfieldBackground variant="dark" />
        )}
        <div className="relative z-[1]">{content}</div>
      </body>
    </html>
  );
}
