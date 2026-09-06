import Link from 'next/link';
import {
  formatEvidenceDirection,
  getCameraBearingForLightingSetup,
  type GoldenHourShotPlanEvidence,
  type LightingSetup,
  type SeasonalComparisonEvidence,
  type ShadowDirectionEvidence,
} from '@/lib/guide-evidence';
import type { GuideDefinition } from '@/lib/guides';
import { SOLAR_MODEL_INFO } from '@/lib/solar/model-info';

const insetPanel =
  'rounded-[22px] border [border-color:var(--solar-surface-border)] [background:var(--solar-surface-bg)]';

function CalculatedCaseIntro({ guide }: { guide: GuideDefinition }) {
  const applicationCase = guide.applicationCase;
  if (!applicationCase) return null;

  return (
    <div data-testid={`application-case-${guide.slug}`}>
      <div className="rounded-[24px] border p-4 [border-color:var(--solar-pill-border)] [background:var(--solar-accent-soft)] sm:p-5">
        <p className="text-[0.64rem] font-semibold uppercase tracking-[0.24em] text-[var(--solar-kicker)]">
          Calculated example — not a field measurement
        </p>
        <h3 className="mt-2 text-xl font-semibold tracking-[-0.025em] text-[var(--solar-text-strong)]">
          A task you can reproduce
        </h3>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--solar-text)]">
          {applicationCase.task}
        </p>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-4">
        <div className={`${insetPanel} p-4`}>
          <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Observation point</dt>
          <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">{guide.example.locationName}</dd>
        </div>
        <div className={`${insetPanel} p-4`}>
          <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Coordinates</dt>
          <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">
            {guide.example.latitude.toFixed(4)}°, {guide.example.longitude.toFixed(4)}°
          </dd>
        </div>
        <div className={`${insetPanel} p-4`}>
          <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Timezone and model</dt>
          <dd className="mt-2 font-semibold text-[var(--solar-text-strong)]">
            {guide.example.timezone} · {SOLAR_MODEL_INFO.id}
          </dd>
        </div>
        <div className={`${insetPanel} p-4`}>
          <dt className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Reference dates</dt>
          <dd className="mt-2 space-y-1 font-semibold text-[var(--solar-text-strong)]">
            {guide.example.dates.map((date) => (
              <span key={date.dateISO} className="block">{date.dateISO}</span>
            ))}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function CaseReproduction({ guide }: { guide: GuideDefinition }) {
  const applicationCase = guide.applicationCase;
  if (!applicationCase) return null;

  return (
    <div className="mt-5 grid gap-4 lg:grid-cols-2" data-testid="case-reproduction">
      <section className={`${insetPanel} p-4 sm:p-5`} aria-labelledby={`${guide.slug}-reproduce-heading`}>
        <h3 id={`${guide.slug}-reproduce-heading`} className="text-lg font-semibold text-[var(--solar-text-strong)]">
          Reproduce the case
        </h3>
        <ol className="mt-4 space-y-3 text-sm leading-6 text-[var(--solar-text)]">
          <li>
            <strong className="text-[var(--solar-text-strong)]">1.</strong>{' '}
            <Link
              href={applicationCase.reproduction.toolHref}
              className="font-semibold text-[var(--solar-accent)] underline decoration-sky-200/40 underline-offset-4"
            >
              {applicationCase.reproduction.toolLabel}
            </Link>
            .
          </li>
          {applicationCase.reproduction.steps.map((step, index) => (
            <li key={step}>
              <strong className="text-[var(--solar-text-strong)]">{index + 2}.</strong> {step}
            </li>
          ))}
        </ol>
      </section>

      <section className={`${insetPanel} p-4 sm:p-5`} aria-labelledby={`${guide.slug}-assumptions-heading`}>
        <h3 id={`${guide.slug}-assumptions-heading`} className="text-lg font-semibold text-[var(--solar-text-strong)]">
          Assumptions and stop conditions
        </h3>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-[var(--solar-text)]">
          {applicationCase.assumptions.map((assumption) => (
            <li key={assumption} className="flex gap-3">
              <span aria-hidden="true" className="text-[var(--solar-accent)]">•</span>
              <span>{assumption}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function bearingPoint(
  bearingDeg: number,
  radius: number,
  centreX = 160,
  centreY = 145
) {
  const radians = (bearingDeg * Math.PI) / 180;
  return {
    x: centreX + Math.sin(radians) * radius,
    y: centreY - Math.cos(radians) * radius,
  };
}

const lightingSetupCopy: Record<LightingSetup, { title: string; description: string }> = {
  front: {
    title: 'Front light',
    description: 'Keep the camera on the Sun-facing side of the subject, with the Sun generally behind the photographer.',
  },
  side: {
    title: 'Side light',
    description: 'Move the camera about 90° around the subject so the direct light crosses the frame from one side.',
  },
  back: {
    title: 'Back light',
    description: 'Place the camera opposite the Sun, leaving the subject between the camera and the incoming light.',
  },
};

function LightingSetupDiagram({
  setup,
  sunBearingDeg,
}: {
  setup: LightingSetup;
  sunBearingDeg: number;
}) {
  const copy = lightingSetupCopy[setup];
  const cameraBearingDeg = getCameraBearingForLightingSetup(sunBearingDeg, setup);
  const sun = bearingPoint(sunBearingDeg, 108);
  const camera = bearingPoint(cameraBearingDeg, setup === 'front' ? 70 : 88);
  const titleId = `lighting-${setup}-title`;
  const descriptionId = `lighting-${setup}-description`;
  const lightArrowId = `lighting-${setup}-light-arrow`;
  const cameraArrowId = `lighting-${setup}-camera-arrow`;

  return (
    <figure className={`${insetPanel} p-4`}>
      <h4 className="font-semibold text-[var(--solar-text-strong)]">{copy.title}</h4>
      <p className="mt-2 min-h-16 text-sm leading-6 text-[var(--solar-text)]">{copy.description}</p>
      <svg
        viewBox="0 0 320 290"
        role="img"
        aria-labelledby={`${titleId} ${descriptionId}`}
        className="mx-auto mt-3 h-auto w-full max-w-[320px]"
      >
        <title id={titleId}>{`${copy.title} camera placement for a winter evening Sun bearing`}</title>
        <desc id={descriptionId}>
          A top-down relative-position diagram. The subject is in the centre, the Sun is at a bearing of {sunBearingDeg.toFixed(1)} degrees, and the camera is at {cameraBearingDeg.toFixed(1)} degrees. Amber shows incoming light and the dashed blue line shows the camera view toward the subject.
        </desc>
        <defs>
          <marker id={lightArrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
          </marker>
          <marker id={cameraArrowId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
          </marker>
        </defs>
        <circle cx="160" cy="145" r="112" fill="currentColor" fillOpacity="0.02" stroke="currentColor" strokeOpacity="0.18" />
        <line x1="160" y1="26" x2="160" y2="65" stroke="currentColor" strokeWidth="2" />
        <path d="M 154 35 L 160 24 L 166 35" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="160" y="18" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="700">TRUE NORTH</text>
        <line x1={sun.x} y1={sun.y} x2="160" y2="145" stroke="#f59e0b" strokeWidth="5" markerEnd={`url(#${lightArrowId})`} />
        <line x1={camera.x} y1={camera.y} x2="160" y2="145" stroke="#38bdf8" strokeWidth="3" strokeDasharray="7 6" markerEnd={`url(#${cameraArrowId})`} />
        <circle cx={sun.x} cy={sun.y} r="15" fill="#f59e0b" />
        <text x={sun.x} y={sun.y + 4} textAnchor="middle" fill="#111827" fontSize="10" fontWeight="800">SUN</text>
        <circle cx={camera.x} cy={camera.y} r="13" fill="#38bdf8" />
        <text x={camera.x} y={camera.y + 4} textAnchor="middle" fill="#082f49" fontSize="9" fontWeight="800">CAM</text>
        <circle cx="160" cy="145" r="20" fill="#0f172a" />
        <text x="160" y="149" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">SUBJECT</text>
        <text x="160" y="278" textAnchor="middle" fill="currentColor" fillOpacity="0.72" fontSize="11">
          Camera bearing {cameraBearingDeg.toFixed(1)}° · relative layout only
        </text>
      </svg>
      <figcaption className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
        Sun {formatEvidenceDirection(sunBearingDeg)}; camera {formatEvidenceDirection(cameraBearingDeg)} relative to the subject.
      </figcaption>
    </figure>
  );
}

export function GoldenHourApplicationCase({
  guide,
  data,
}: {
  guide: GuideDefinition;
  data: GoldenHourShotPlanEvidence;
}) {
  const winterStart = data.rows.find(
    (row) => row.season === 'Winter reference' && row.window === 'Evening' && row.boundary === 'Start'
  )?.value;
  const winterEnd = data.rows.find(
    (row) => row.season === 'Winter reference' && row.window === 'Evening' && row.boundary === 'End'
  )?.value;
  const summerStart = data.rows.find(
    (row) => row.season === 'Summer reference' && row.window === 'Evening' && row.boundary === 'Start'
  )?.value;

  return (
    <div className="mt-5" data-testid="golden-hour-application-case">
      <CalculatedCaseIntro guide={guide} />
      {winterStart && winterEnd && summerStart ? (
        <>
          <section className="mt-5" aria-labelledby="golden-camera-layout-heading">
            <h3 id="golden-camera-layout-heading" className="text-xl font-semibold text-[var(--solar-text-strong)]">
              Place the camera around the subject
            </h3>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--solar-text)]">
              The winter evening window begins at {winterStart.localTime}, with the Sun at {formatEvidenceDirection(winterStart.azimuthDeg)}. Each diagram keeps that calculated Sun direction fixed and changes only the camera position.
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {(['front', 'side', 'back'] as const).map((setup) => (
                <LightingSetupDiagram key={setup} setup={setup} sunBearingDeg={winterStart.azimuthDeg} />
              ))}
            </div>
          </section>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className={`${insetPanel} p-4`}>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Read the winter span</p>
              <p className="mt-2 text-sm leading-7 text-[var(--solar-text)]">
                From {winterStart.localTime} to {winterEnd.localTime}, the Sun moves from {formatEvidenceDirection(winterStart.azimuthDeg)} to {formatEvidenceDirection(winterEnd.azimuthDeg)}. Treat the setup as a moving directional range, not one permanent arrow.
              </p>
            </div>
            <div className={`${insetPanel} p-4`}>
              <p className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">Recheck in summer</p>
              <p className="mt-2 text-sm leading-7 text-[var(--solar-text)]">
                The summer evening window starts with the Sun at {formatEvidenceDirection(summerStart.azimuthDeg)}, in a different compass sector from winter. Recalculate the camera plan instead of reusing the winter placement.
              </p>
            </div>
          </div>
        </>
      ) : (
        <p className="mt-5 rounded-[22px] border p-4 text-sm [border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] text-[var(--solar-warning-text)]">
          The fixed evening boundary is unavailable, so no camera-placement diagram is produced.
        </p>
      )}
      <CaseReproduction guide={guide} />
    </div>
  );
}

function SolarAltitudeComparisonChart({ data }: { data: SeasonalComparisonEvidence }) {
  const [winter, summer] = data.seasons;
  const toX = (index: number) => 48 + (index / 23) * 624;
  const toY = (altitudeDeg: number) => 150 - altitudeDeg * 1.2;
  const buildPath = (positions: SeasonalComparisonEvidence['seasons'][number]['positions']) =>
    positions.map((position, index) => `${index === 0 ? 'M' : 'L'} ${toX(index)} ${toY(position.altitudeDeg)}`).join(' ');

  return (
    <figure className={`${insetPanel} mt-5 p-4`}>
      <svg viewBox="0 0 720 310" role="img" aria-labelledby="season-chart-title season-chart-desc" className="h-auto w-full">
        <title id="season-chart-title">Brisbane winter and summer solar altitude curves</title>
        <desc id="season-chart-desc">
          A solid amber curve shows the winter-reference solar altitude and a dashed pink curve shows the summer-reference altitude across 24 local hours. The 08:00, 12:00, and 16:00 comparison points are labelled and also listed in text cards below.
        </desc>
        <rect x="0" y="0" width="720" height="310" rx="18" fill="currentColor" fillOpacity="0.025" />
        {[-60, -30, 0, 30, 60, 90].map((altitude) => (
          <g key={altitude}>
            <line x1="48" y1={toY(altitude)} x2="672" y2={toY(altitude)} stroke="currentColor" strokeOpacity={altitude === 0 ? 0.42 : 0.13} strokeDasharray={altitude === 0 ? undefined : '5 7'} />
            <text x="40" y={toY(altitude) + 4} textAnchor="end" fill="currentColor" fillOpacity="0.7" fontSize="11">{altitude}°</text>
          </g>
        ))}
        {[0, 4, 8, 12, 16, 20, 23].map((hour) => (
          <text key={hour} x={toX(hour)} y="286" textAnchor="middle" fill="currentColor" fillOpacity="0.7" fontSize="11">
            {String(hour).padStart(2, '0')}:00
          </text>
        ))}
        <path d={buildPath(winter.positions)} fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        <path d={buildPath(summer.positions)} fill="none" stroke="#fb7185" strokeWidth="4" strokeDasharray="9 7" strokeLinecap="round" strokeLinejoin="round" />
        {data.observations.map((observation) => {
          const hour = Number(observation.localTime.slice(0, 2));
          const x = toX(hour);
          return (
            <g key={observation.localTime}>
              <circle cx={x} cy={toY(observation.winter.altitudeDeg)} r="6" fill="#f59e0b" stroke="white" strokeWidth="2" />
              <rect x={x - 6} y={toY(observation.summer.altitudeDeg) - 6} width="12" height="12" rx="2" fill="#fb7185" stroke="white" strokeWidth="2" />
              <text x={x} y="302" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700">{observation.localTime}</text>
            </g>
          );
        })}
        <g transform="translate(492 20)" fill="currentColor" fontSize="11">
          <line x1="0" y1="7" x2="28" y2="7" stroke="#f59e0b" strokeWidth="4" /><text x="36" y="11">June 21</text>
          <line x1="100" y1="7" x2="128" y2="7" stroke="#fb7185" strokeWidth="4" strokeDasharray="7 5" /><text x="136" y="11">December 21</text>
        </g>
      </svg>
      <figcaption className="mt-3 text-sm leading-6 text-[var(--solar-text)]">
        Solid circles mark winter and square markers identify summer. The horizon is 0°. The curves are astronomical altitude values and do not model a local skyline.
      </figcaption>
    </figure>
  );
}

function seasonalObservationNote(
  localTime: string,
  data: SeasonalComparisonEvidence
) {
  if (localTime === '08:00') {
    return 'Morning check: compare whether the real eastern horizon admits direct light at each calculated height.';
  }
  if (localTime === '12:00') {
    const [winter, summer] = data.seasons;
    return `Clock-time check: 12:00 is a sample, while calculated solar noon is ${winter.events.solarNoonBoundary?.localTime ?? 'unavailable'} in winter and ${summer.events.solarNoonBoundary?.localTime ?? 'unavailable'} in summer.`;
  }
  return 'Afternoon check: keep the viewpoint fixed and record which western obstacles intersect each calculated direction.';
}

export function SeasonalApplicationCase({
  guide,
  data,
}: {
  guide: GuideDefinition;
  data: SeasonalComparisonEvidence;
}) {
  return (
    <div className="mb-5" data-testid="seasonal-application-case">
      <CalculatedCaseIntro guide={guide} />
      <SolarAltitudeComparisonChart data={data} />
      <section className="mt-5" aria-labelledby="season-observation-heading">
        <h3 id="season-observation-heading" className="text-xl font-semibold text-[var(--solar-text-strong)]">
          Three repeatable observation times
        </h3>
        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {data.observations.map((observation) => (
            <article key={observation.localTime} className={`${insetPanel} p-4`}>
              <h4 className="text-lg font-semibold text-[var(--solar-text-strong)]">{observation.localTime}</h4>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-[var(--solar-text)]">
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-[var(--solar-text-muted)]">June 21</dt>
                  <dd className="mt-1 font-semibold">{formatEvidenceDirection(observation.winter.azimuthDeg)}</dd>
                  <dd>{observation.winter.altitudeDeg.toFixed(1)}° altitude</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[0.12em] text-[var(--solar-text-muted)]">December 21</dt>
                  <dd className="mt-1 font-semibold">{formatEvidenceDirection(observation.summer.azimuthDeg)}</dd>
                  <dd>{observation.summer.altitudeDeg.toFixed(1)}° altitude</dd>
                </div>
              </dl>
              <p className="mt-4 text-sm leading-6 text-[var(--solar-text)]">
                {seasonalObservationNote(observation.localTime, data)}
              </p>
            </article>
          ))}
        </div>
      </section>
      <CaseReproduction guide={guide} />
    </div>
  );
}

function ShadowPlanDiagram({ row }: { row: ShadowDirectionEvidence['rows'][number] }) {
  if (row.shadowBearingDeg === null) return null;
  const sun = bearingPoint(row.position.azimuthDeg, 105);
  const shadow = bearingPoint(row.shadowBearingDeg, 100);

  return (
    <figure className={`${insetPanel} p-4`}>
      <svg viewBox="0 0 320 290" role="img" aria-labelledby="shadow-plan-title shadow-plan-desc" className="mx-auto h-auto w-full max-w-[340px]">
        <title id="shadow-plan-title">Top-down solar and shadow bearings at 10:00</title>
        <desc id="shadow-plan-desc">
          A top-down compass diagram places the Sun at {row.position.azimuthDeg.toFixed(1)} degrees and the shadow at the opposite bearing of {row.shadowBearingDeg.toFixed(1)} degrees, with the object at the centre.
        </desc>
        <defs>
          <marker id="shadow-plan-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b" />
          </marker>
        </defs>
        <circle cx="160" cy="145" r="112" fill="currentColor" fillOpacity="0.02" stroke="currentColor" strokeOpacity="0.18" />
        <line x1="160" y1="26" x2="160" y2="65" stroke="currentColor" strokeWidth="2" />
        <path d="M 154 35 L 160 24 L 166 35" fill="none" stroke="currentColor" strokeWidth="2" />
        <text x="160" y="18" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="700">TRUE NORTH</text>
        <line x1={sun.x} y1={sun.y} x2="160" y2="145" stroke="#f59e0b" strokeWidth="5" />
        <line x1="160" y1="145" x2={shadow.x} y2={shadow.y} stroke="#64748b" strokeWidth="7" markerEnd="url(#shadow-plan-arrow)" />
        <circle cx={sun.x} cy={sun.y} r="15" fill="#f59e0b" />
        <text x={sun.x} y={sun.y + 4} textAnchor="middle" fill="#111827" fontSize="10" fontWeight="800">SUN</text>
        <circle cx="160" cy="145" r="16" fill="#0f172a" />
        <text x="160" y="149" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="800">POST</text>
        <text x={shadow.x} y={shadow.y + 20} textAnchor="middle" fill="currentColor" fontSize="10" fontWeight="700">SHADOW</text>
        <text x="160" y="278" textAnchor="middle" fill="currentColor" fillOpacity="0.72" fontSize="11">Bearings differ by 180°</text>
      </svg>
      <figcaption className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
        Sun {formatEvidenceDirection(row.position.azimuthDeg)}; shadow {formatEvidenceDirection(row.shadowBearingDeg)} on the horizontal plan.
      </figcaption>
    </figure>
  );
}

function ShadowSideDiagram({ row }: { row: ShadowDirectionEvidence['rows'][number] }) {
  if (row.shadowLengthM === null) return null;
  const diagramScale = Math.min(138 / row.objectHeightM, 180 / row.shadowLengthM);
  const postPixels = row.objectHeightM * diagramScale;
  const shadowPixels = row.shadowLengthM * diagramScale;
  const shadowEndX = 92 + shadowPixels;
  const postTopY = 230 - postPixels;

  return (
    <figure className={`${insetPanel} p-4`}>
      <svg viewBox="0 0 360 290" role="img" aria-labelledby="shadow-side-title shadow-side-desc" className="mx-auto h-auto w-full max-w-[380px]">
        <title id="shadow-side-title">Side-view shadow-length triangle at 10:00</title>
        <desc id="shadow-side-desc">
          A right triangle shows a {row.objectHeightM.toFixed(1)} metre vertical post, a {row.shadowLengthM.toFixed(2)} metre level-ground shadow, and a solar altitude angle of {row.position.altitudeDeg.toFixed(1)} degrees.
        </desc>
        <line x1="36" y1="230" x2="330" y2="230" stroke="currentColor" strokeOpacity="0.55" strokeWidth="3" />
        <line x1="92" y1="230" x2="92" y2={postTopY} stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
        <line x1="92" y1={postTopY} x2={shadowEndX} y2="230" stroke="#f59e0b" strokeWidth="4" />
        <line x1="92" y1="230" x2={shadowEndX} y2="230" stroke="#64748b" strokeWidth="8" strokeLinecap="round" />
        <path d="M 92 214 L 108 214 L 108 230" fill="none" stroke="currentColor" strokeOpacity="0.65" strokeWidth="2" />
        <path d={`M ${shadowEndX - 34} 230 A 34 34 0 0 0 ${shadowEndX - 27} ${230 - Math.tan((row.position.altitudeDeg * Math.PI) / 180) * 27}`} fill="none" stroke="#fb7185" strokeWidth="3" />
        <text x="78" y="156" textAnchor="end" fill="currentColor" fontSize="11" fontWeight="700">{row.objectHeightM.toFixed(1)} m post</text>
        <text x={(92 + shadowEndX) / 2} y="253" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700">{row.shadowLengthM.toFixed(2)} m shadow</text>
        <text x={shadowEndX - 35} y="212" textAnchor="end" fill="#fb7185" fontSize="11" fontWeight="700">{row.position.altitudeDeg.toFixed(1)}°</text>
        <text x="180" y="278" textAnchor="middle" fill="currentColor" fillOpacity="0.72" fontSize="11">Level-ground geometric model</text>
      </svg>
      <figcaption className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
        The vertical post and horizontal ground form the right angle; solar altitude sets the shadow-length ratio.
      </figcaption>
    </figure>
  );
}

export function ShadowApplicationCase({
  guide,
  data,
}: {
  guide: GuideDefinition;
  data: ShadowDirectionEvidence;
}) {
  const featuredRow = data.rows.find((row) => row.localTime === '10:00');
  const comparisonRows = data.rows.filter((row) => ['08:00', '12:00', '16:00'].includes(row.localTime));

  return (
    <div className="mt-5" data-testid="shadow-application-case">
      <CalculatedCaseIntro guide={guide} />
      {featuredRow && featuredRow.shadowBearingDeg !== null && featuredRow.shadowLengthM !== null ? (
        <>
          <section className="mt-5" aria-labelledby="shadow-worked-calculation-heading">
            <h3 id="shadow-worked-calculation-heading" className="text-xl font-semibold text-[var(--solar-text-strong)]">
              Work the 10:00 result step by step
            </h3>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <div className={`${insetPanel} p-4`}>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">1. Reverse the solar bearing</p>
                <p className="mt-3 break-words font-mono text-sm font-semibold leading-7 text-[var(--solar-text-strong)]">
                  ({featuredRow.position.azimuthDeg.toFixed(1)}° + 180°) mod 360° = {featuredRow.shadowBearingDeg.toFixed(1)}°
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
                  The shadow points {formatEvidenceDirection(featuredRow.shadowBearingDeg)}, directly away from the calculated Sun bearing.
                </p>
              </div>
              <div className={`${insetPanel} p-4`}>
                <p className="text-xs uppercase tracking-[0.16em] text-[var(--solar-text-muted)]">2. Calculate the level-ground length</p>
                <p className="mt-3 break-words font-mono text-sm font-semibold leading-7 text-[var(--solar-text-strong)]">
                  {featuredRow.objectHeightM.toFixed(1)} m ÷ tan({featuredRow.position.altitudeDeg.toFixed(1)}°) = {featuredRow.shadowLengthM.toFixed(2)} m
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--solar-text)]">
                  The displayed result uses the full engine value before rounding the labels shown here.
                </p>
              </div>
            </div>
          </section>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <ShadowPlanDiagram row={featuredRow} />
            <ShadowSideDiagram row={featuredRow} />
          </div>

          <section className="mt-5" aria-labelledby="shadow-time-comparison-heading">
            <h3 id="shadow-time-comparison-heading" className="text-xl font-semibold text-[var(--solar-text-strong)]">
              Compare lower and higher Sun angles
            </h3>
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {comparisonRows.map((row) => (
                <article key={row.localTime} className={`${insetPanel} p-4`}>
                  <h4 className="text-lg font-semibold text-[var(--solar-text-strong)]">{row.localTime}</h4>
                  <p className="mt-2 text-sm text-[var(--solar-text)]">Altitude {row.position.altitudeDeg.toFixed(1)}°</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--solar-text-strong)]">
                    Shadow {row.shadowLengthM === null ? 'unavailable' : `${row.shadowLengthM.toFixed(2)} m`}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-4 text-sm leading-7 text-[var(--solar-text)]">
              Lower positive altitude produces a longer level-ground shadow. At the same altitude, doubling the object height from {featuredRow.objectHeightM.toFixed(1)} m to {(featuredRow.objectHeightM * 2).toFixed(1)} m doubles this theoretical shadow from {featuredRow.shadowLengthM.toFixed(2)} m to {(featuredRow.shadowLengthM * 2).toFixed(2)} m.
            </p>
          </section>
        </>
      ) : (
        <p className="mt-5 rounded-[22px] border p-4 text-sm [border-color:var(--solar-warning-border)] [background:var(--solar-warning-bg)] text-[var(--solar-warning-text)]">
          No shadow length is produced because the featured solar altitude is at or below 0°.
        </p>
      )}
      <CaseReproduction guide={guide} />
    </div>
  );
}
