"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { BookOpen, Gamepad2, Home, StickyNote } from "lucide-react";

const navLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/dashboard", label: "Locker", icon: BookOpen },
  { href: "/notes", label: "Notes", icon: StickyNote },
  { href: "/play", label: "Play", icon: Gamepad2 },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-10 border-b border-pastel-sage/50 bg-pastel-cream/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-1 sm:gap-2">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  isActive
                    ? "bg-pastel-sage text-gray-800"
                    : "text-gray-600 hover:bg-pastel-mint hover:text-gray-800"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden xs:inline sm:inline">{label}</span>
              </Link>
            );
          })}
        </div>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: { avatarBox: "h-9 w-9 ring-2 ring-pastel-sage/50" },
          }}
        />
      </div>
    </nav>
  );
}
