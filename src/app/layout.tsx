import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Study Game – Your Locker",
  description: "Upload notes, generate quizzes, and level up your study streak.",
  manifest: "/manifest.json",
  themeColor: "#a5d6a7",
  appleWebApp: {
    capable: true,
    title: "Study Game",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const content = publishableKey ? (
    <ClerkProvider publishableKey={publishableKey}>{children}</ClerkProvider>
  ) : (
    children
  );
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="min-h-screen font-sans">{content}</body>
    </html>
  );
}
