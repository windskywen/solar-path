import type {
  EventValidationResult,
  PolarValidationResult,
  PositionValidationResult,
  SolarValidationResult,
} from '@/lib/solar/validation-benchmarks';

const EVENT_LABELS: Record<keyof EventValidationResult['actual'], string> = {
  civilDawnLocal: 'Civil dawn',
  sunriseLocal: 'Sunrise',
  solarNoonLocal: 'Solar noon',
  sunsetLocal: 'Sunset',
  civilDuskLocal: 'Civil dusk',
};

function StatusBadge({ passed }: { passed: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        passed
          ? '[border-color:var(--solar-success-border)] [background:var(--solar-success-bg)] text-[var(--solar-success-text)]'
          : '[border-color:var(--solar-danger-border)] [background:var(--solar-danger-bg)] text-[var(--solar-danger-text)]'
      }`}
    >
      {passed ? 'Within tolerance' : 'Outside tolerance'}
    </span>
  );
}
function PositionResult({ result }: { result: PositionValidationResult }) {
  return (
    <div className="overflow-x-auto rounded-[20px] border [border-color:var(--solar-surface-border)]">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
          <tr>
            <th className="px-4 py-3" scope="col">Angle</th>
            <th className="px-4 py-3" scope="col">External reference</th>
            <th className="px-4 py-3" scope="col">Solar Path Tracker</th>
            <th className="px-4 py-3" scope="col">Absolute difference</th>
          </tr>
        </thead>
        <tbody className="text-[var(--solar-text)]">
          <tr className="border-t [border-color:var(--solar-divider)]">
            <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">Azimuth</th>
            <td className="px-4 py-4">{result.benchmark.expected.azimuthDeg.toFixed(5)}°</td>
            <td className="px-4 py-4">{result.actual.azimuthDeg.toFixed(5)}°</td>
            <td className="px-4 py-4">{result.delta.azimuthDeg.toFixed(5)}°</td>
          </tr>
          <tr className="border-t [border-color:var(--solar-divider)]">
            <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">Altitude</th>
            <td className="px-4 py-4">{result.benchmark.expected.altitudeDeg.toFixed(5)}°</td>
            <td className="px-4 py-4">{result.actual.altitudeDeg.toFixed(5)}°</td>
            <td className="px-4 py-4">{result.delta.altitudeDeg.toFixed(5)}°</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function EventResult({ result }: { result: EventValidationResult }) {
  const keys = Object.keys(result.actual) as Array<keyof EventValidationResult['actual']>;
  return (
    <div className="overflow-x-auto rounded-[20px] border [border-color:var(--solar-surface-border)]">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
          <tr>
            <th className="px-4 py-3" scope="col">Event</th>
            <th className="px-4 py-3" scope="col">USNO snapshot</th>
            <th className="px-4 py-3" scope="col">Solar Path Tracker</th>
            <th className="px-4 py-3" scope="col">Difference</th>
          </tr>
        </thead>
        <tbody className="text-[var(--solar-text)]">
          {keys.map((key) => (
            <tr key={key} className="border-t [border-color:var(--solar-divider)]">
              <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{EVENT_LABELS[key]}</th>
              <td className="px-4 py-4">{result.benchmark.expected[key]}</td>
              <td className="px-4 py-4">{result.actual[key]}</td>
              <td className="px-4 py-4">{result.deltaMinutes[key]} min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PolarResult({ result }: { result: PolarValidationResult }) {
  return (
    <div className="overflow-x-auto rounded-[20px] border [border-color:var(--solar-surface-border)]">
      <table className="w-full min-w-[620px] text-left text-sm">
        <thead className="[background:var(--solar-surface-bg)] text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">
          <tr>
            <th className="px-4 py-3" scope="col">Date</th>
            <th className="px-4 py-3" scope="col">Expected state</th>
            <th className="px-4 py-3" scope="col">Calculated state</th>
            <th className="px-4 py-3" scope="col">Invented boundary</th>
          </tr>
        </thead>
        <tbody className="text-[var(--solar-text)]">
          {result.cases.map((entry) => (
            <tr key={entry.dateISO} className="border-t [border-color:var(--solar-divider)]">
              <th scope="row" className="px-4 py-4 text-[var(--solar-text-strong)]">{entry.label} · {entry.dateISO}</th>
              <td className="px-4 py-4">{entry.expectedState}</td>
              <td className="px-4 py-4">{entry.actualState}</td>
              <td className="px-4 py-4">{entry.hasInventedBoundary ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SolarValidationResults({
  results,
}: {
  results: readonly SolarValidationResult[];
}) {
  return (
    <div className="mt-5 grid gap-4" data-testid="solar-validation-results">
      {results.map((result) => (
        <article
          key={result.benchmark.id}
          className="rounded-[24px] border p-4 [border-color:var(--solar-surface-border)] [background:var(--solar-surface-soft-bg)] sm:p-5"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--solar-text-strong)]">{result.benchmark.label}</h3>
              <p className="mt-2 text-xs leading-5 text-[var(--solar-text-muted)]">
                Tolerance: {result.kind === 'position' ? `±${result.benchmark.toleranceDeg}°` : result.kind === 'events' ? `±${result.benchmark.toleranceMinutes} minutes` : 'continuous state and no fabricated rise/set boundary'}
              </p>
            </div>
            <StatusBadge passed={result.passed} />
          </div>

          <div className="mt-4">
            {result.kind === 'position' ? <PositionResult result={result} /> : null}
            {result.kind === 'events' ? <EventResult result={result} /> : null}
            {result.kind === 'polar' ? <PolarResult result={result} /> : null}
          </div>

          <p className="mt-4 text-xs leading-5 text-[var(--solar-text-muted)]">
            Source:{' '}
            <a
              href={result.benchmark.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--solar-accent)] underline underline-offset-4"
            >
              {result.benchmark.source.label}
            </a>{' '}
            · snapshot checked {result.benchmark.source.retrievedDate}. {result.benchmark.source.note}
          </p>
        </article>
      ))}
    </div>
  );
}
