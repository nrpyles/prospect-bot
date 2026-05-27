import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { Wordmark } from "@/components/site/Wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#FF6B2C",
          colorBackground: "#08080A",
          colorText: "#EDEDEF",
          colorTextSecondary: "#8E8E96",
          colorInputBackground: "#111114",
          colorInputText: "#EDEDEF",
          colorNeutral: "#FFFFFF",
          fontFamily: "var(--font-outfit), system-ui, sans-serif",
          borderRadius: "0.75rem",
        },
        elements: {
          rootBox: "w-full",
          card: "bg-[color:var(--color-surface)] border border-[color:var(--color-border)] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]",
          headerTitle: "text-foreground font-bold tracking-tight",
          headerSubtitle: "text-[color:var(--color-foreground-dim)]",
          socialButtonsBlockButton:
            "border border-[color:var(--color-border-strong)] hover:bg-[color:var(--color-surface-2)]",
          formButtonPrimary:
            "bg-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-hover)] text-black font-bold normal-case",
          footerActionLink: "text-[color:var(--color-accent)] hover:text-[color:var(--color-accent-hover)]",
        },
      }}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-[color:var(--color-border)]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
            <Link href="/">
              <Wordmark size="md" />
            </Link>
            <Link
              href="/"
              className="text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:text-foreground"
            >
              ← Back to home
            </Link>
          </div>
        </header>
        <main className="flex flex-1 items-center justify-center px-6 py-16">
          {children}
        </main>
      </div>
    </ClerkProvider>
  );
}
