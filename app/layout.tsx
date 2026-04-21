import type { ReactNode } from "react";
import { IBM_Plex_Mono, Manrope, Syne } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const bodyFont = Manrope({ variable: "--font-body", subsets: ["latin"] });
const displayFont = Syne({ variable: "--font-display", subsets: ["latin"] });
const mono = IBM_Plex_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500", "600"] });

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/judge", label: "Judge Mode" },
  { href: "/directory", label: "Directory" },
  { href: "/create", label: "Bond Launch" },
  { href: "/broken-oaths", label: "Broken Oaths" },
];

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable} ${mono.variable}`}>
      <body className="app-body min-h-screen bg-[var(--bg-primary)] text-zinc-50 antialiased">
        <div className="aurora-backdrop" />
        <div className="noise-overlay" />
        <div className="background-grid" />
        <header className="site-header sticky top-0 z-50">
          <div className="section-shell py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="flex flex-col gap-3">
                <div className="font-mono text-[10px] uppercase tracking-[0.34em] text-zinc-500">Field dossier / Four.Meme trust layer / mainnet proof</div>
                <Link href="/" className="flex items-center gap-4">
                <div className="brand-mark flex h-10 w-10 items-center justify-center rounded-xl font-mono text-sm font-semibold text-[var(--accent-contrast)]">
                  RB
                </div>
                <div>
                  <div className="font-display text-lg font-semibold tracking-tight text-zinc-50">RugBounty</div>
                  <div className="text-sm text-zinc-400">One public promise, one bond, one consequence.</div>
                </div>
                </Link>
              </div>
              <nav className="nav-dock flex flex-wrap items-center gap-2 rounded-xl p-1.5">
                {navLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="nav-link rounded-lg px-4 py-2.5 text-sm text-zinc-300 transition">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </header>
        <main className="relative z-10">{children}</main>
        <footer className="relative z-10 pb-10 pt-14">
          <div className="section-shell">
            <div className="surface rounded-[1rem] px-6 py-5">
              <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                <div>
                  <div className="font-mono text-[11px] uppercase tracking-[0.3em] text-zinc-500">Closing note</div>
                  <div className="mt-2 font-display text-xl font-semibold text-zinc-100">Built to be reviewed like evidence, not admired like branding.</div>
                  <div className="mt-2 max-w-2xl text-sm leading-7 text-zinc-400">
                    The product only matters if a reviewer can verify the claim, inspect the proof path, and understand the limit of what the vault actually enforces.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                  <Link href="/judge" className="button-secondary rounded-lg px-4 py-2.5 text-sm">
                    Judge Mode
                  </Link>
                  <Link href="/directory" className="button-secondary rounded-lg px-4 py-2.5 text-sm">
                    Proof Directory
                  </Link>
                  <Link href="/create" className="button-primary rounded-lg px-4 py-2.5 text-sm">
                    Launch With A Bond
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
