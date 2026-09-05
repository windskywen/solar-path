import Link from 'next/link';

const linkClass =
  'text-[var(--solar-text-muted)] transition-colors hover:text-[var(--solar-text-strong)] underline decoration-sky-200/30 underline-offset-4';

const groups = [
  {
    title: 'Tools',
    links: [
      { href: '/', label: 'Sun Path Map' },
      { href: '/sunrise-sunset-calculator', label: 'Daylight Times' },
      { href: '/golden-hour-calculator', label: 'Golden Hour' },
      { href: '/solar-azimuth-altitude', label: 'Azimuth & Altitude' },
    ],
  },
  {
    title: 'Learn',
    links: [
      { href: '/guides', label: 'All Guides' },
      { href: '/guides/how-to-read-a-sun-path-diagram', label: 'Read a Sun Path' },
      { href: '/guides/brisbane-winter-vs-summer-sun-path', label: 'Seasonal Comparison' },
      { href: '/methodology', label: 'Methodology' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/about', label: 'About' },
      { href: '/contact', label: 'Contact Us' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy Policy' },
      { href: '/terms', label: 'Terms of Use' },
      { href: '/ads.txt', label: 'ads.txt' },
    ],
  },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 px-3 pb-4 pt-3 sm:px-4 lg:px-6">
      <div className="mx-auto max-w-screen-2xl rounded-[28px] border px-4 py-5 text-xs [border-color:var(--solar-glass-border)] [background:var(--solar-surface-soft-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-xl sm:px-6">
        <nav aria-label="Footer navigation" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((group) => (
            <div key={group.title}>
              <h2 className="text-[0.66rem] font-semibold uppercase tracking-[0.26em] text-[var(--solar-kicker)]">{group.title}</h2>
              <ul className="mt-3 space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}><Link href={link.href} className={linkClass}>{link.label}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="mt-6 border-t pt-5 [border-color:var(--solar-divider)]">
          <p className="text-[var(--solar-text-muted)]">
            Data and calculation sources:{' '}
            <a href="https://www.geoapify.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>Geoapify</a>,{' '}
            <a href="https://www.tomtom.com/" target="_blank" rel="noopener noreferrer" className={linkClass}>TomTom</a>,{' '}
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className={linkClass}>OpenStreetMap</a>,{' '}
            <a href="https://github.com/mourner/suncalc" target="_blank" rel="noopener noreferrer" className={linkClass}>SunCalc</a>, Luxon, and @photostructure/tz-lookup.
          </p>
          <p className="mt-3 max-w-6xl text-[0.68rem] leading-5 text-[var(--solar-text-faint)]">
            Solar data and 3D visualizations are general informational references. The model does not include local terrain, buildings, trees, weather, or surveyed site geometry and is not professional architectural, engineering, surveying, safety, or installation advice.
          </p>
          <p className="mt-4 text-[var(--solar-text-muted)]">&copy; {year} Solar Path Tracker</p>
        </div>
      </div>
    </footer>
  );
}
