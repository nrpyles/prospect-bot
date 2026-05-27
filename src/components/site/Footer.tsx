import Link from "next/link";
import { LogoLockup, Wordmark } from "./Wordmark";

export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)] bg-background">
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <LogoLockup size={56} className="items-start text-left" />
            <p className="mt-6 max-w-sm text-sm text-[color:var(--color-foreground-dim)]">
              Find leads. Close deals. Skip the busywork. FunnelCloser is the
              outreach engine for operators who&apos;d rather be on the phone
              than in a spreadsheet.
            </p>
            <p className="mt-6 eyebrow">A Closer family brand</p>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Product</h3>
            <ul className="space-y-3 text-sm text-[color:var(--color-foreground-dim)]">
              <li><Link href="#how" className="transition-colors hover:text-foreground">How it works</Link></li>
              <li><Link href="#features" className="transition-colors hover:text-foreground">Features</Link></li>
              <li><Link href="#pricing" className="transition-colors hover:text-foreground">Pricing</Link></li>
              <li><Link href="/sign-up" className="transition-colors hover:text-foreground">Start free</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="eyebrow mb-4">Family</h3>
            <ul className="space-y-3 text-sm text-[color:var(--color-foreground-dim)]">
              <li><Link href="https://closercap.com" target="_blank" className="transition-colors hover:text-foreground">Closer Capital ↗</Link></li>
              <li><Link href="/legal/terms" className="transition-colors hover:text-foreground">Terms</Link></li>
              <li><Link href="/legal/privacy" className="transition-colors hover:text-foreground">Privacy</Link></li>
              <li><Link href="mailto:hello@funnelcloser.com" className="transition-colors hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col items-start justify-between gap-4 border-t border-[color:var(--color-border)] pt-8 text-xs text-[color:var(--color-foreground-muted)] md:flex-row md:items-center">
          <div className="mono-stat">© {new Date().getFullYear()} FUNNELCLOSER · ALL RIGHTS RESERVED</div>
          <div className="mono-stat">v0.1.0 · BUILT IN TEXAS</div>
        </div>
      </div>
    </footer>
  );
}
