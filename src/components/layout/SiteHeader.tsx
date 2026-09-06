'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

const calculatorLinks = [
  { href: '/sunrise-sunset-calculator', label: 'Sunrise & Sunset' },
  { href: '/golden-hour-calculator', label: 'Golden Hour' },
  { href: '/solar-azimuth-altitude', label: 'Azimuth & Altitude' },
] as const;

const primaryLinks = [
  { href: '/', label: 'Sun Path Map' },
  { href: '/guides', label: 'Guides' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/about', label: 'About' },
] as const;

type OpenMenu = 'calculators' | 'mobile' | null;

export interface SiteHeaderProps {
  sticky?: boolean;
}

function pathIsActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass =
  'inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium transition-colors hover:text-[var(--solar-text-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]';

export function SiteHeader({ sticky = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const calculatorsTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const calculatorsActive = calculatorLinks.some((link) => pathIsActive(pathname, link.href));

  useEffect(() => {
    if (!openMenu) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      const trigger =
        openMenu === 'calculators' ? calculatorsTriggerRef.current : mobileTriggerRef.current;
      setOpenMenu(null);
      trigger?.focus();
    };
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpenMenu(null);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('pointerdown', handlePointerDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [openMenu]);

  const closeMenu = () => setOpenMenu(null);

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-40' : 'relative z-20'} px-3 py-3 sm:px-4 lg:px-6`}
    >
      <div
        ref={rootRef}
        className="relative mx-auto flex min-h-16 max-w-screen-2xl items-center justify-between gap-3 rounded-[24px] border px-3 py-2 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl sm:px-4"
      >
        <Link
          href="/"
          onClick={closeMenu}
          className="inline-flex min-h-11 min-w-0 items-center rounded-xl px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
        >
          <span className="min-w-0">
            <span className="block truncate text-base font-semibold tracking-[-0.02em] text-[var(--solar-text-strong)] sm:text-lg">
              Solar Path Tracker
            </span>
            <span className="hidden text-[0.65rem] uppercase tracking-[0.2em] text-[var(--solar-text-muted)] xl:block">
              Visualize the sun&apos;s journey
            </span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <nav aria-label="Primary navigation" className="flex items-center gap-1">
            <Link
              href="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              className={`${linkClass} ${
                pathname === '/'
                  ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)]'
                  : 'text-[var(--solar-text-muted)]'
              }`}
            >
              Sun Path Map
            </Link>

            <div className="relative">
              <button
                ref={calculatorsTriggerRef}
                type="button"
                aria-expanded={openMenu === 'calculators'}
                aria-controls="desktop-calculators-menu"
                aria-haspopup="true"
                aria-current={calculatorsActive ? 'page' : undefined}
                onClick={() =>
                  setOpenMenu((current) =>
                    current === 'calculators' ? null : 'calculators'
                  )
                }
                className={`${linkClass} gap-1.5 ${
                  calculatorsActive
                    ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)]'
                    : 'text-[var(--solar-text-muted)]'
                }`}
              >
                Calculators
                <svg
                  aria-hidden="true"
                  className={`h-4 w-4 transition-transform ${
                    openMenu === 'calculators' ? 'rotate-180' : ''
                  }`}
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path d="m5 7.5 5 5 5-5" />
                </svg>
              </button>
              {openMenu === 'calculators' ? (
                <nav
                  id="desktop-calculators-menu"
                  aria-label="Calculator navigation"
                  className="absolute left-0 top-[calc(100%+0.5rem)] z-50 min-w-64 rounded-2xl border p-2 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl"
                >
                  {calculatorLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      aria-current={pathIsActive(pathname, link.href) ? 'page' : undefined}
                      onClick={closeMenu}
                      className={`${linkClass} flex w-full ${
                        pathIsActive(pathname, link.href)
                          ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)]'
                          : 'text-[var(--solar-text-muted)]'
                      }`}
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>
              ) : null}
            </div>

            {primaryLinks.slice(1).map((link) => {
              const active = pathIsActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`${linkClass} ${
                    active
                      ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)]'
                      : 'text-[var(--solar-text-muted)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ThemeSwitcher className="ml-2" />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <ThemeSwitcher />
          <button
            ref={mobileTriggerRef}
            type="button"
            aria-expanded={openMenu === 'mobile'}
            aria-controls="mobile-primary-menu"
            onClick={() =>
              setOpenMenu((current) => (current === 'mobile' ? null : 'mobile'))
            }
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-semibold text-[var(--solar-text-strong)] [border-color:var(--solar-button-border)] [background:var(--solar-button-bg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--solar-input-focus-ring)]"
          >
            Menu
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              {openMenu === 'mobile' ? (
                <path d="m5 5 10 10M15 5 5 15" />
              ) : (
                <path d="M3 5h14M3 10h14M3 15h14" />
              )}
            </svg>
          </button>
        </div>

        {openMenu === 'mobile' ? (
          <nav
            id="mobile-primary-menu"
            aria-label="Mobile primary navigation"
            className="absolute inset-x-0 top-[calc(100%+0.5rem)] z-50 mx-1 max-h-[calc(100vh-6rem)] overflow-y-auto rounded-2xl border p-2 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)] backdrop-blur-2xl lg:hidden"
          >
            <Link
              href="/"
              aria-current={pathname === '/' ? 'page' : undefined}
              onClick={closeMenu}
              className={`${linkClass} flex w-full ${
                pathname === '/'
                  ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)]'
                  : 'text-[var(--solar-text-muted)]'
              }`}
            >
              Sun Path Map
            </Link>
            <p className="px-3 pb-1 pt-3 text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[var(--solar-kicker)]">
              Calculators
            </p>
            {calculatorLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathIsActive(pathname, link.href) ? 'page' : undefined}
                onClick={closeMenu}
                className={`${linkClass} flex w-full pl-5 ${
                  pathIsActive(pathname, link.href)
                    ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)]'
                    : 'text-[var(--solar-text-muted)]'
                }`}
              >
                {link.label}
              </Link>
            ))}
            {primaryLinks.slice(1).map((link) => {
              const active = pathIsActive(pathname, link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  onClick={closeMenu}
                  className={`${linkClass} flex w-full ${
                    active
                      ? '[background:var(--solar-accent-soft)] text-[var(--solar-text-strong)]'
                      : 'text-[var(--solar-text-muted)]'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
      <noscript>
        <nav
          aria-label="Primary navigation without JavaScript"
          className="mx-auto mt-2 flex max-w-screen-2xl flex-wrap gap-1 rounded-2xl border p-2 [border-color:var(--solar-glass-border)] [background:var(--solar-glass-bg)] [box-shadow:var(--solar-glass-shadow)]"
        >
          {primaryLinks.slice(0, 1).map((link) => (
            <Link key={link.href} href={link.href} className={`${linkClass} text-[var(--solar-text-muted)]`}>
              {link.label}
            </Link>
          ))}
          {calculatorLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`${linkClass} text-[var(--solar-text-muted)]`}>
              {link.label}
            </Link>
          ))}
          {primaryLinks.slice(1).map((link) => (
            <Link key={link.href} href={link.href} className={`${linkClass} text-[var(--solar-text-muted)]`}>
              {link.label}
            </Link>
          ))}
        </nav>
      </noscript>
    </header>
  );
}
