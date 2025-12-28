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
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    highlight: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
  };

  return (
    <section aria-labelledby="insights-heading" className={className}>
      <div className="flex items-center gap-2 mb-2 sm:mb-3">
        <span className="text-base sm:text-lg">💡</span>
        <h2
          id="insights-heading"
          className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white"
        >
          Insights
        </h2>
      </div>

      <div className="" role="region" aria-label="Solar insights">
        {hasInsights ? (
          <ul className="space-y-1.5 sm:space-y-2" role="list">
            {insights.messages.map((message, index) => {
              const icon = getInsightIcon(message);
              const variant = getInsightVariant(message);

              if (compact && index > 1) {
                // In compact mode, show max 2 insights
                return null;
              }

              return (
                <li
                  key={index}
                  className={`
                    flex items-start gap-2 sm:gap-3 text-xs sm:text-sm p-2 sm:p-3 rounded-lg
                    bg-white/50 dark:bg-slate-800/50 border border-white/50 dark:border-slate-700/50
                    shadow-sm backdrop-blur-sm
                    text-slate-700 dark:text-slate-300
                  `}
                >
                  <span
                    className="shrink-0 text-base sm:text-lg leading-none mt-0.5"
                    role="img"
                    aria-hidden="true"
                  >
                    {icon}
                  </span>
                  <span className="leading-snug">{message}</span>
                </li>
              );
            })}

            {compact && insights.messages.length > 2 && (
              <li className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 pl-5 sm:pl-6">
                +{insights.messages.length - 2} more insight
                {insights.messages.length > 3 ? 's' : ''}
              </li>
            )}
          </ul>
        ) : (
          <div className="bg-white/50 dark:bg-slate-800/50 rounded-lg p-3 sm:p-4 border border-white/50 dark:border-slate-700/50 shadow-sm">
            <p
              className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2"
              role="status"
            >
              <span className="text-green-500" role="img" aria-hidden="true">
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
