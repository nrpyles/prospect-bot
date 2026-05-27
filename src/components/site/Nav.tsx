import Link from "next/link";
import { Wordmark } from "./Wordmark";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <Link href="/" className="flex items-center">
          <Wordmark size="md" />
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="#how"
            className="text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
          >
            How it works
          </Link>
          <Link
            href="#features"
            className="text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
          >
            Pricing
          </Link>
          <Link
            href="https://closercap.com"
            target="_blank"
            className="text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
          >
            Closer Capital ↗
          </Link>
        </nav>

        <div className="flex items-center gap-3">
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
        </div>
      </div>
    </header>
  );
}
