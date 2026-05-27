import { ClerkProvider, UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/site/Wordmark";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#FF6B2C",
          colorBackground: "#08080A",
          colorText: "#EDEDEF",
          fontFamily: "var(--font-outfit), system-ui, sans-serif",
          borderRadius: "0.75rem",
        },
      }}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
            <div className="flex items-center gap-8">
              <Link href="/app">
                <Wordmark size="sm" />
              </Link>
              <nav className="hidden items-center gap-1 md:flex">
                {[
                  { href: "/app", label: "Pipeline" },
                  { href: "/app/prospects", label: "Prospects" },
                  { href: "/app/sequences", label: "Sequences" },
                  { href: "/app/searches", label: "Searches" },
                  { href: "/app/settings", label: "Settings" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--color-foreground-dim)] transition-colors hover:bg-[color:var(--color-surface)] hover:text-foreground"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8",
                  },
                }}
              />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </ClerkProvider>
  );
}
