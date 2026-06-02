"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Wordmark";

const APP_NAV = [
  { href: "/app", label: "Pipeline" },
  { href: "/app/prospects", label: "Prospects" },
  { href: "/app/sequences", label: "Sequences" },
  { href: "/app/searches", label: "Searches" },
  { href: "/app/settings", label: "Settings" },
];

export function AppHeader() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 lg:px-10 lg:py-4">
        <div className="flex items-center gap-6">
          <Link href="/app" onClick={() => setOpen(false)}>
            <Wordmark size="sm" />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {APP_NAV.map((item) => {
              const active =
                item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                    active
                      ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                      : "text-[color:var(--color-foreground-dim)] hover:bg-[color:var(--color-surface)] hover:text-foreground"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-foreground md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-[color:var(--color-border)] bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3">
            {APP_NAV.map((item) => {
              const active =
                item.href === "/app" ? pathname === "/app" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={`rounded-lg px-3 py-2.5 text-base font-semibold transition-colors ${
                    active
                      ? "bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent)]"
                      : "text-foreground hover:bg-[color:var(--color-surface)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
