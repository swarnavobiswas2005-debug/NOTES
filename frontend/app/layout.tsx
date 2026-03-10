import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/Navbar";
import { CursorGlow } from "@/components/CursorGlow";
import { ScrollProgress } from "@/components/ScrollProgress";

export const metadata: Metadata = {
  title: "NOTES — Decentralized Academic Note Sharing",
  description:
    "Upload, discover, and verify academic study notes backed by blockchain. Tamper-proof, decentralized knowledge sharing for students.",
  keywords: ["notes", "study", "blockchain", "IPFS", "decentralized", "academic"],
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "NOTES — Decentralized Academic Notes",
    description: "Tamper-proof study notes on the blockchain.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="relative min-h-screen overflow-x-hidden">
        <Providers>
          <CursorGlow />
          <ScrollProgress />
          <Navbar />
          <main className="relative z-10">{children}</main>
          <footer className="relative z-10 border-t border-white/10 py-10 mt-24">
            <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-400 to-purple-500 flex items-center justify-center text-xs font-bold text-white">N</div>
                <span className="font-semibold text-white/80">NOTES</span>
              </div>
              <p className="text-white/40 text-sm">© 2025 NOTES Platform. All notes are verified on-chain.</p>
              <div className="flex gap-6 text-sm text-white/40">
                <a href="/explore" className="hover:text-white/70 transition-colors">Explore</a>
                <a href="/upload" className="hover:text-white/70 transition-colors">Upload</a>
                <a href="/verify" className="hover:text-white/70 transition-colors">Verify</a>
              </div>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
