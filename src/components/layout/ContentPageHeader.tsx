import Link from 'next/link';

const navLinks = [
  { href: '/', label: 'Sun Path Map' },
  { href: '/sunrise-sunset-calculator', label: 'Calculators' },
  { href: '/guides', label: 'Guides' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'About' },
] as const;

export function ContentPageHeader() {
  return (
    <header className="relative z-20 px-3 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto flex max-w-screen-2xl flex-col gap-3 rounded-[24px] border px-4 py-3 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)]">
          Solar Path Tracker
        </Link>
        <nav aria-label="Primary navigation" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--solar-text-muted)] sm:text-sm">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-[var(--solar-text-strong)]">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
