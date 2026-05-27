import { Nav } from "@/components/site/Nav";
import { Footer } from "@/components/site/Footer";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16 lg:px-10 lg:py-24">{children}</div>
      </main>
      <Footer />
    </>
  );
}
