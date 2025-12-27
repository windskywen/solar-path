'use client';

/**
 * SkipLinks Component
 *
 * Provides skip links for keyboard users to navigate directly to main content.
 * This improves accessibility by allowing users to bypass repetitive navigation.
 */

import React from 'react';

interface SkipLinkProps {
  /** Target element ID to skip to */
  targetId: string;
  /** Label for the skip link */
  label: string;
}

function SkipLink({ targetId, label }: SkipLinkProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className="
        sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[100]
        bg-blue-600 text-white px-4 py-2 rounded-md font-medium
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
      "
    >
      {label}
    </a>
  );
}

export interface SkipLinksProps {
  /** Links to main content areas */
  links?: Array<{ targetId: string; label: string }>;
}

const DEFAULT_LINKS = [
  { targetId: 'main-content', label: 'Skip to main content' },
  { targetId: 'solar-data', label: 'Skip to solar data' },
];

export function SkipLinks({ links = DEFAULT_LINKS }: SkipLinksProps) {
  return (
    <nav aria-label="Skip links" className="sr-only focus-within:not-sr-only">
      {links.map((link) => (
        <SkipLink key={link.targetId} targetId={link.targetId} label={link.label} />
      ))}
    </nav>
  );
}
