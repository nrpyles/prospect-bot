import { ClerkProvider } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/site/AppHeader";

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
          fontFamily: "var(--font-inter), system-ui, sans-serif",
          borderRadius: "0.75rem",
        },
      }}
    >
      <div className="flex min-h-screen flex-col bg-background">
        <AppHeader />
        <main className="flex-1">{children}</main>
      </div>
    </ClerkProvider>
  );
}
