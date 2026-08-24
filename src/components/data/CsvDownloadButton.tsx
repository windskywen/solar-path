'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { sanitizeCsvFilename, serializeCsv, type CsvDataset } from '@/lib/utils/csv';

interface CsvDownloadButtonProps {
  dataset: CsvDataset;
  label?: string;
  className?: string;
}
export function CsvDownloadButton({
  dataset,
  label = 'Download CSV',
  className = '',
}: CsvDownloadButtonProps) {
  const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');
  const resetTimerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    },
    []
  );

  const handleDownload = useCallback(() => {
    try {
      const blob = new Blob([serializeCsv(dataset)], { type: 'text/csv;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = sanitizeCsvFilename(dataset.filename.replace(/\.csv$/i, ''));
      anchor.hidden = true;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setState('success');
    } catch (error) {
      console.error('Failed to download CSV.', error);
      setState('error');
    }

    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => setState('idle'), 2000);
  }, [dataset]);

  const statusLabel =
    state === 'success' ? 'CSV downloaded' : state === 'error' ? 'CSV download failed' : label;

  return (
    <button
      type="button"
      onClick={handleDownload}
      className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition-colors [border-color:var(--solar-pill-border)] [background:var(--solar-pill-bg)] text-[var(--solar-text-strong)] hover:[background:var(--solar-button-hover-bg)] ${className}`}
      aria-label={label}
      data-testid="csv-download"
      data-state={state}
    >
      {statusLabel}
    </button>
  );
}
