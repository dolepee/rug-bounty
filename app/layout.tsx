import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/judge", label: "Judge Mode" },
  { href: "/directory", label: "Directory" },
  { href: "/create", label: "Bond Launch" },
  { href: "/broken-oaths", label: "Broken Oaths" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="min-h-screen bg-[var(--bg-primary)] text-zinc-50 antialiased">
        <div className="noise-overlay" />
        <div className="background-grid" />
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[rgba(10,13,20,0.88)] backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/15 font-mono text-sm font-bold text-amber-400">
                RB
              </div>
              <div>
                <div className="text-sm font-semibold tracking-tight">RugBounty</div>
                <div className="font-mono text-[10px] uppercase tracking-[0.28em] text-zinc-500">
                  Bonded Launches For Four.Meme
                </div>
              </div>
            </Link>
            <nav className="flex items-center gap-2">
              {navLinks.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-md border border-transparent px-3 py-2 text-sm text-zinc-400 transition hover:border-white/10 hover:bg-white/5 hover:text-zinc-100">
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <main className="relative z-10">{children}</main>
      </body>
    </html>
  );
}
