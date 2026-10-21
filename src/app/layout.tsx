import type {Metadata} from "next";
import "./globals.css";
export const metadata:Metadata={title:"FunnelCloser | Private CRM",description:"Neal’s private business research and outreach workspace.",robots:{index:false,follow:false}};
export default function RootLayout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en" className="h-full antialiased"><body className="min-h-full flex flex-col bg-background text-foreground">{children}</body></html>;}
