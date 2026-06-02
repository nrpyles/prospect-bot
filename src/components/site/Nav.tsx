"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Wordmark } from "./Wordmark";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "https://closercap.com", label: "Closer Capital ↗", external: true },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-10 lg:py-5">
        <Link href="/" className="flex items-center" onClick={() => setOpen(false)}>
          <Wordmark size="md" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              {...(l.external ? { target: "_blank" } : {})}
              className="text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <Link
            href="/sign-in"
            className="hidden text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground sm:block"
          >
            Log in
          </Link>
          <Link
            href="/sign-up"
            className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-[color:var(--color-accent)] px-5 text-sm font-bold text-black transition-all hover:bg-[color:var(--color-accent-hover)] hover:shadow-[0_10px_30px_-10px_var(--color-accent)]"
          >
            Start free
          </Link>

          {/* Mobile menu toggle */}
          <button
            type="button"
            aria-label="Open menu"
            onClick={() => setOpen((o) => !o)}
            className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[color:var(--color-border)] text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-foreground md:hidden"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="border-t border-[color:var(--color-border)] bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                {...(l.external ? { target: "_blank" } : {})}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-[color:var(--color-surface)]"
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/sign-in"
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-base font-semibold text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-foreground sm:hidden"
            >
              Log in
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
