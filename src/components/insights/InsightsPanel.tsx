'use client';

/**
 * InsightsPanel Component
 *
 * Displays rule-based solar insights with icons and styling.
 * Shows contextual information about solar conditions based on location,
 * date, and computed solar data.
 */

import React from 'react';
import type { SolarInsights } from '@/types/solar';

/**
 * Map insight content to appropriate icons
 */
function getInsightIcon(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('midnight sun') || lowerMessage.includes('polar day')) {
    return '☀️';
  }
  if (lowerMessage.includes('polar night')) {
    return '🌙';
  }
  if (lowerMessage.includes('winter') || lowerMessage.includes('short daylight')) {
    return '❄️';
  }
  if (lowerMessage.includes('summer') || lowerMessage.includes('extended daylight')) {
    return '🌞';
  }
  if (lowerMessage.includes('equator')) {
    return '🌍';
  }
  if (lowerMessage.includes('golden hour')) {
    return '🌅';
  }
  if (lowerMessage.includes('shadow') || lowerMessage.includes('low maximum solar')) {
    return '📐';
  }
  if (lowerMessage.includes('overhead') || lowerMessage.includes('high maximum solar')) {
    return '☀️';
  }

  // Default insight icon
  return '💡';
}

/**
 * Get severity/type class for insight styling
 */
function getInsightVariant(message: string): 'info' | 'warning' | 'highlight' {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('polar night') || lowerMessage.includes('short daylight')) {
    return 'warning';
  }
  if (lowerMessage.includes('midnight sun') || lowerMessage.includes('nearly overhead')) {
    return 'highlight';
  }

  return 'info';
}

interface InsightsPanelProps {
  /** Solar insights object containing messages array */
  insights: SolarInsights | null;
  /** Optional class name for additional styling */
  className?: string;
  /** Whether to show a compact version (fewer details) */
  compact?: boolean;
}

export function InsightsPanel({ insights, className = '', compact = false }: InsightsPanelProps) {
  const hasInsights = insights && insights.messages.length > 0;

  const variantStyles = {
    info: {
      shell:
        'border-sky-300/18 bg-[linear-gradient(135deg,rgba(56,189,248,0.14),rgba(15,23,42,0.52))]',
      icon: 'bg-sky-300/14 text-sky-100',
    },
    warning: {
      shell:
        'border-amber-300/18 bg-[linear-gradient(135deg,rgba(251,191,36,0.16),rgba(15,23,42,0.52))]',
      icon: 'bg-amber-300/14 text-amber-100',
    },
    highlight: {
      shell:
        'border-emerald-300/18 bg-[linear-gradient(135deg,rgba(74,222,128,0.16),rgba(15,23,42,0.52))]',
      icon: 'bg-emerald-300/14 text-emerald-100',
    },
  };

  return (
    <section aria-labelledby="insights-heading" className={className}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[0.64rem] font-semibold uppercase tracking-[0.28em] text-sky-200/72">
            Insight stream
          </p>
          <h2
            id="insights-heading"
            className="mt-2 text-lg font-semibold tracking-[-0.02em] text-white sm:text-xl"
          >
            Solar insights
          </h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[0.68rem] font-medium text-slate-300">
          {hasInsights ? `${insights.messages.length} signals` : 'Nominal'}
        </span>
      </div>

      <div role="region" aria-label="Solar insights">
        {hasInsights ? (
          <ul className="space-y-2.5" role="list">
            {insights.messages.map((message, index) => {
              const icon = getInsightIcon(message);
              const variant = getInsightVariant(message);
              const tone = variantStyles[variant];

              if (compact && index > 1) {
                return null;
              }

              return (
                <li
                  key={index}
                  className={`rounded-[22px] border p-3 text-sm text-slate-100 shadow-[0_16px_40px_rgba(2,6,23,0.16)] backdrop-blur-xl sm:p-4 ${tone.shell}`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${tone.icon}`}
                      role="img"
                      aria-hidden="true"
                    >
                      {icon}
                    </span>
                    <span className="leading-6 text-slate-100/92">{message}</span>
                  </div>
                </li>
              );
            })}

            {compact && insights.messages.length > 2 && (
              <li className="pl-1 text-xs text-slate-400">
                +{insights.messages.length - 2} more insight
                {insights.messages.length > 3 ? 's' : ''}
              </li>
            )}
          </ul>
        ) : (
          <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
            <p className="flex items-center gap-3 text-sm text-slate-200" role="status">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                role="img"
                aria-hidden="true"
              >
                ✓
              </span>
              <span>Normal daylight conditions for this location and date.</span>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
