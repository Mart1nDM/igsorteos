"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { cn } from "@/lib/utils";

export function SignOutButton({ className }: { className?: string }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-ink-200 px-3 py-2 text-sm font-medium text-ink-600 transition hover:border-ink-300 hover:bg-ink-50",
        className,
      )}
    >
      <LogOut className="size-4" />
      Salir
    </button>
  );
}
