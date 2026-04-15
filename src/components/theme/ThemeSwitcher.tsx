'use client';

import { useTheme } from '@/components/providers/ThemeProvider';

export interface ThemeSwitcherProps {
  className?: string;
}

function SunIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2.5M12 19v2.5M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2.5 12H5M19 12h2.5M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
    </svg>
  );
}

function MoonIcon({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.8A9 9 0 1111.2 3a7.2 7.2 0 009.8 9.8z" />
    </svg>
  );
}

export function ThemeSwitcher({ className = '' }: ThemeSwitcherProps) {
  const { isLight, toggleTheme } = useTheme();
  const activeIconShell =
    '[background:var(--solar-switch-thumb-bg)] [box-shadow:var(--solar-switch-thumb-shadow)]';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isLight}
      aria-label={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      title={`Switch to ${isLight ? 'dark' : 'light'} mode`}
      onClick={toggleTheme}
      className={`inline-flex items-center rounded-full border p-1 backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:[--tw-ring-color:var(--solar-switch-ring)] [background:var(--solar-switch-shell-bg)] [border-color:var(--solar-switch-shell-border)] [box-shadow:var(--solar-switch-shell-shadow)] ${className}`}
    >
      <span className="grid h-10 w-[5rem] grid-cols-2 items-center gap-1 rounded-full px-1 [background:var(--solar-switch-track-bg)] sm:w-[5.25rem]">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ${
            isLight ? activeIconShell : ''
          }`}
        >
          <SunIcon
            className={`h-4 w-4 ${
              isLight
                ? '[color:var(--solar-switch-icon-active)]'
                : '[color:var(--solar-switch-icon-muted)]'
            }`}
          />
        </span>
        <span
          className={`flex h-8 w-8 items-center justify-center justify-self-end rounded-full transition-all duration-300 ${
            isLight ? '' : activeIconShell
          }`}
        >
          <MoonIcon
            className={`h-4 w-4 ${
              isLight
                ? '[color:var(--solar-switch-icon-muted)]'
                : '[color:var(--solar-switch-icon-active)]'
            }`}
          />
        </span>
      </span>
    </button>
  );
}
