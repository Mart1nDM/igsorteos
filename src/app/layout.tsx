import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { Sparkles } from "lucide-react";

import { auth } from "@/auth";
import { isDemoMode } from "@/lib/instagram";
import { InstagramIcon } from "@/components/instagram-icon";
import { SignOutButton } from "@/components/sign-out-button";
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
  title: "IGSorteos · Sorteos verificables de Instagram",
  description:
    "Creá sorteos sobre tus historias y publicaciones de Instagram, definí las reglas y sortea con semilla verificable.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const demo = isDemoMode();

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen font-sans antialiased`}
      >
        <header className="sticky top-0 z-40 border-b border-ink-200/80 bg-white/85 backdrop-blur">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-xl bg-brand-600 text-white">
                <InstagramIcon className="size-5" />
              </span>
              <span className="text-lg font-semibold tracking-tight text-ink-900">
                IG<span className="text-brand-600">Sorteos</span>
              </span>
            </Link>

            <nav className="flex items-center gap-3">
              {demo ? (
                <span className="hidden items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-brand-100 sm:inline-flex">
                  <Sparkles className="size-3.5" />
                  Modo demo
                </span>
              ) : null}

              {session?.user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-ink-600 transition hover:text-brand-700"
                  >
                    @{session.user.igUsername ?? session.user.name ?? "cuenta"}
                  </Link>
                  <SignOutButton />
                </>
              ) : (
                <Link
                  href="/login"
                  className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
                >
                  Entrar con Instagram
                </Link>
              )}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
