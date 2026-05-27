import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// Primary typeface — Inter. Cleanest, most legible sans for UI work.
// Variable font, all weights from 100 to 900 included.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Monospace for numerics + code.
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "FunnelCloser — Find leads. Close deals. Skip the busywork.",
  description:
    "FunnelCloser scans local markets for businesses with weak websites, scores them, and runs AI-personalized outreach. A Closer family brand.",
  metadataBase: new URL("https://funnelcloser.com"),
  openGraph: {
    title: "FunnelCloser",
    description:
      "Find leads. Close deals. Skip the busywork. A Closer family brand.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
