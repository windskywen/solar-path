import { SITE_NAME, SITE_TITLE } from '@/lib/site';

export function SeoImageCard() {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px',
        background:
          'radial-gradient(circle at top left, rgba(56,189,248,0.32), transparent 34%), radial-gradient(circle at top right, rgba(250,204,21,0.24), transparent 28%), linear-gradient(180deg, #07111f 0%, #03050a 100%)',
        color: '#edf2ff',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          fontSize: 26,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: 'rgba(186,230,253,0.9)',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 999,
            background: 'linear-gradient(135deg, #7dd3fc 0%, #facc15 100%)',
          }}
        />
        Solar Path Tracker
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', maxWidth: '78%' }}>
        <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.02 }}>{SITE_TITLE}</div>
        <div style={{ fontSize: 30, lineHeight: 1.35, color: 'rgba(226,232,240,0.92)' }}>
          Explore sunrise, sunset, solar altitude, azimuth, and 3D daylight views for any
          location and date.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: '16px',
          fontSize: 24,
          color: 'rgba(203,213,225,0.94)',
        }}
      >
        <div style={{ display: 'flex' }}>Sun path map</div>
        <div style={{ display: 'flex' }}>Azimuth &amp; altitude</div>
        <div style={{ display: 'flex' }}>3D solar views</div>
        <div style={{ display: 'flex' }}>{SITE_NAME}</div>
      </div>
    </div>
  );
}
