# Research: 3D Solar Path View

**Feature**: `002-3d-solar-path-view`
**Date**: 2025-12-29
**Status**: Complete

---

## Research Tasks

### 1. deck.gl + MapLibre Integration

**Question**: How to integrate deck.gl 3D layers with MapLibre GL JS in a React/Next.js application?

**Research Findings**:

**Decision**: Use `@deck.gl/mapbox` MapboxOverlay as a MapLibre control

**Rationale**:
- MapboxOverlay is officially compatible with MapLibre GL JS (uses same GL context)
- Provides seamless interleaved rendering with map tiles
- Supports built-in picking for hover/click interactions
- Minimal integration code compared to CustomLayer + raw WebGL

**Implementation Pattern**:
```typescript
import { MapboxOverlay } from '@deck.gl/mapbox';
import { ScatterplotLayer, PathLayer } from '@deck.gl/layers';

// Create overlay with layers
const overlay = new MapboxOverlay({
  interleaved: true,
  layers: [
    new ScatterplotLayer({ /* point config */ }),
    new PathLayer({ /* path config */ })
  ]
});

// Attach to MapLibre map instance
map.addControl(overlay);
```

**Coordinate System**:
- Use `coordinateSystem: COORDINATE_SYSTEM.METER_OFFSETS`
- Set `coordinateOrigin: [lng, lat]` to location center
- Positions as `[east, north, up]` in meters

**Alternatives Considered**:
- Three.js + MapLibre CustomLayer: Higher complexity, more control but unnecessary for this use case
- Pure MapLibre 3D markers: Limited to flat markers, no true 3D positioning
- Mapbox GL JS: Requires paid API key, against NFR3D-002

---

### 2. Radix UI Dialog Patterns

**Question**: How to implement an accessible near-fullscreen modal with Radix UI?

**Research Findings**:

**Decision**: Use `@radix-ui/react-dialog` with custom overlay and content styling

**Rationale**:
- Built-in focus trap (NFR3D-004)
- Automatic `Esc` close handling (FR3D-003)
- ARIA attributes handled automatically
- Composable API for custom layouts

**Implementation Pattern**:
```tsx
import * as Dialog from '@radix-ui/react-dialog';

<Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
  <Dialog.Trigger asChild>
    <button>3D View</button>
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay className="fixed inset-0 bg-black/50" />
    <Dialog.Content className="fixed inset-4 md:inset-[2.5%] bg-background rounded-lg">
      <Dialog.Title>3D Solar Path</Dialog.Title>
      <Dialog.Description className="sr-only">
        Interactive 3D visualization of the sun path
      </Dialog.Description>
      {/* Modal content */}
      <Dialog.Close asChild>
        <button aria-label="Close">×</button>
      </Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

**Responsive Sizing**:
- Desktop: `inset: 2.5%` (~95% viewport)
- Mobile: `inset: 0` (100% viewport)

**Alternatives Considered**:
- Custom modal implementation: More work to get accessibility right
- Headless UI Dialog: Similar features but Radix has better React 19 support
- shadcn/ui Dialog: Built on Radix, could use if already in project

---

### 3. WebGL Fallback Strategies

**Question**: How to detect WebGL support and provide graceful degradation?

**Research Findings**:

**Decision**: Runtime WebGL detection with static 2D fallback component

**Rationale**:
- Per NFR3D-005, must show static 2D fallback if WebGL unavailable
- Canvas-based detection is reliable and fast
- Fallback can reuse existing 2D chart rendering (recharts)

**Detection Pattern**:
```typescript
function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    return gl !== null;
  } catch {
    return false;
  }
}
```

**Fallback Strategy**:
1. Check WebGL support on modal open
2. If supported: render deck.gl 3D view
3. If not supported: render static SVG/Canvas 2D representation
   - Option A: Use recharts PolarAngleAxis for 2D sun path
   - Option B: Generate static SVG with polar projection

**FPS Monitoring** (optional enhancement):
- Use `requestAnimationFrame` loop to measure frame times
- If avg FPS < 15 for 2 seconds, suggest switching to fallback

**Alternatives Considered**:
- Server-rendered static image: Higher latency, requires API endpoint
- No fallback (error message only): Poor UX for older devices

---

### 4. Static Snapshot Data Binding

**Question**: How to capture a static snapshot of store data when modal opens?

**Research Findings**:

**Decision**: Capture snapshot in `useState` on modal open, ignore subsequent store changes

**Rationale**:
- Per FR3D-013, modal must not update when main view changes
- Simple pattern: copy values to local state on open
- Avoids complex subscription management

**Implementation Pattern**:
```typescript
function Solar3DViewModal({ open, onOpenChange }) {
  // Capture snapshot when modal opens
  const [snapshot, setSnapshot] = useState<Solar3DSnapshot | null>(null);
  
  // Get current store values
  const location = useLocation();
  const dateISO = useDateISO();
  const timezone = useTimezone();
  const hourly = useSolarData()?.hourly;
  const selectedHour = useSelectedHour();
  
  useEffect(() => {
    if (open && location && hourly) {
      setSnapshot({
        location,
        dateISO,
        timezone,
        hourly,
        selectedHour
      });
    }
  }, [open]); // Only capture on open, ignore other deps
  
  // Render using snapshot, not live store
  return snapshot ? <Canvas data={snapshot} /> : <Loading />;
}
```

**Alternatives Considered**:
- Live binding with store subscription: Against FR3D-013
- Props drilling from parent: Works but less encapsulated

---

### 5. Tile Source Selection

**Question**: Which free tile source provides lowest latency?

**Research Findings**:

**Decision**: Use OpenStreetMap CDN tiles with potential fallback to MapTiler free tier

**Options Evaluated**:

| Provider | Latency | Free Tier | Notes |
|----------|---------|-----------|-------|
| OpenStreetMap | ~200-400ms | Unlimited (fair use) | Current project choice |
| Stadia Maps | ~100-200ms | 200k req/month | Fast CDN |
| MapTiler | ~150-250ms | No key required for basic | Styled options |
| Carto | ~200-300ms | 75k req/month | Basemaps only |

**Recommendation**: Keep OSM tiles for consistency with existing MapPanel, which already uses:
```typescript
tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png']
```

Per clarification (prioritize latency), can switch to Stadia or MapTiler if performance testing shows OSM is too slow for 3D pitched view.

---

### 6. deck.gl Version Compatibility

**Question**: Which deck.gl version is compatible with MapLibre GL JS 5.x?

**Research Findings**:

**Decision**: Use deck.gl 9.x (latest stable)

**Compatibility Matrix**:
- deck.gl 9.x: Compatible with MapLibre 4.x and 5.x
- `@deck.gl/mapbox` works with both Mapbox GL and MapLibre
- No special configuration needed

**Peer Dependencies**:
```json
{
  "@deck.gl/core": "^9.0.0",
  "@deck.gl/layers": "^9.0.0",
  "@deck.gl/mapbox": "^9.0.0"
}
```

**Note**: deck.gl 9.x requires `@luma.gl/core` as peer dependency but it's bundled automatically.

---

## Summary of Decisions

| Topic | Decision | Key Rationale |
|-------|----------|---------------|
| 3D Rendering | deck.gl MapboxOverlay | Built-in picking, GPU acceleration, simple integration |
| Modal | Radix UI Dialog | Accessibility out-of-box (focus trap, Esc, ARIA) |
| WebGL Fallback | Runtime detection + 2D static | Graceful degradation per NFR3D-005 |
| Data Binding | useState snapshot on open | Static data per FR3D-013 |
| Tile Source | OSM (existing) | Consistency; can optimize later if needed |
| deck.gl Version | 9.x | Compatible with MapLibre 5.x |

---

## Outstanding Questions

None. All NEEDS CLARIFICATION items resolved.
