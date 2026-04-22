import type { Metadata } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Manrope } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const bodyFont = Manrope({ variable: "--font-body", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

export const metadata: Metadata = {
  title: "RugBounty",
  description: "Bonded launch trust for Four.Meme creators on BNB mainnet.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/directory", label: "Proofs" },
  { href: "/broken-oaths", label: "Slashed" },
  { href: "/create", label: "Create" },
  { href: "/judge", label: "Judge" },
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${mono.variable}`}>
      <body className="app-body min-h-screen bg-[var(--bg)] text-white antialiased">
        <header className="site-header sticky top-0 z-50">
          <div className="section-shell py-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <Link href="/" className="flex items-center gap-3">
                <div className="brand-mark flex h-9 w-9 items-center justify-center rounded-md font-mono text-sm">
                  RB
                </div>
                <div className="flex flex-col leading-tight">
                  <div className="font-display text-lg font-extrabold tracking-tight text-white">RugBounty</div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-[var(--fg-muted)]">
                    Bonded launch trust / BNB mainnet
                  </div>
                </div>
              </Link>
              <nav className="nav-dock flex flex-wrap items-center gap-1 rounded-md p-1">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="nav-link rounded px-3 py-2">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>
        <main className="relative">{children}</main>
        <footer className="mt-20">
          <div className="warning-stripes warning-stripes--thin" />
          <div className="section-shell py-10">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="hazard-title--sm">Bonded trust for launches.</div>
                <div className="mt-2 font-mono text-xs uppercase tracking-[0.24em] text-[var(--fg-muted)]">
                  Four.Meme launch proofs / slash and refund receipts
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link href="/create" className="btn-hazard">Create a bond</Link>
                <Link href="/directory" className="btn-outline">View proofs</Link>
              </div>
            </div>
          </div>
          <div className="warning-stripes warning-stripes--thin" />
        </footer>
      </body>
    </html>
  );
}
