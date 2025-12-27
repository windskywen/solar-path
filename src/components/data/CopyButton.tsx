/**
 * CopyButton Component
 *
 * Button that copies text to clipboard with visual feedback.
 */

'use client';

import { useState, useCallback } from 'react';
import { copyWithFeedback } from '@/lib/utils/clipboard';

export interface CopyButtonProps {
  /** Text to copy to clipboard */
  text: string;
  /** Label for the feedback message */
  label: string;
  /** Optional icon or content to display */
  children?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md';
  /** Additional CSS classes */
  className?: string;
  /** Show the text value inline */
  showValue?: boolean;
}

/**
 * CopyButton - Click to copy text with visual feedback
 */
export function CopyButton({
  text,
  label,
  children,
  size = 'sm',
  className = '',
  showValue = false,
}: CopyButtonProps) {
  const [copyState, setCopyState] = useState<'idle' | 'success' | 'error'>('idle');

  const handleCopy = useCallback(async () => {
    const result = await copyWithFeedback(text, label);
    setCopyState(result.success ? 'success' : 'error');

    // Reset after 2 seconds
    setTimeout(() => {
      setCopyState('idle');
    }, 2000);
  }, [text, label]);

  const sizeClasses = {
    sm: 'p-1 text-xs',
    md: 'p-2 text-sm',
  };

  const stateClasses = {
    idle: 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700',
    success: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    error: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`
        inline-flex items-center gap-1 rounded transition-colors
        ${sizeClasses[size]}
        ${stateClasses[copyState]}
        ${className}
      `}
      title={`Copy ${label}`}
      aria-label={`Copy ${label} to clipboard`}
    >
      {showValue && <span className="font-mono">{text}</span>}
      {children || <CopyIcon state={copyState} />}
    </button>
  );
}

/**
 * Copy icon with state
 */
function CopyIcon({ state }: { state: 'idle' | 'success' | 'error' }) {
  if (state === 'success') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }

  if (state === 'error') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    );
  }

  // Default copy icon
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

/**
 * Inline value with copy button
 */
export function CopyableValue({
  value,
  label,
  className = '',
}: {
  value: string;
  label: string;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="font-mono">{value}</span>
      <CopyButton text={value} label={label} />
    </span>
  );
}
