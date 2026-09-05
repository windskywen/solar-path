# API Contracts: 3D Solar Path View

**Feature**: `002-3d-solar-path-view`
**Date**: 2025-12-29
**Status**: Complete

---

## Component Interfaces

### Solar3DViewModal

Main modal component wrapping the 3D view.

```typescript
/**
 * Props for the 3D View modal component.
 */
export interface Solar3DViewModalProps {
  /**
   * Whether the modal is open.
   */
  open: boolean;
  
  /**
   * Callback when modal open state changes.
   * Called with false when user closes via Esc or close button.
   */
  onOpenChange: (open: boolean) => void;
}

/**
 * Solar3DViewModal
 * 
 * Near-fullscreen modal displaying 3D solar path visualization.
 * - Captures data snapshot on open (FR3D-013)
 * - Focus trap and Esc close (NFR3D-004)
 * - Preserves main map camera on close (FR3D-004)
 * 
 * @example
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <button onClick={() => setIsOpen(true)}>3D View</button>
 * <Solar3DViewModal open={isOpen} onOpenChange={setIsOpen} />
 * ```
 */
export declare function Solar3DViewModal(props: Solar3DViewModalProps): JSX.Element;
```

---

### Solar3DMapCanvas

Inner canvas component for 3D map rendering. Client-only.

```typescript
/**
 * Props for the 3D map canvas component.
 */
export interface Solar3DMapCanvasProps {
  /**
   * Derived 3D view data including visible points and path.
   */
  viewData: Solar3DViewData;
  
  /**
   * Callback when user hovers over a point.
   * Called with null when hover ends.
   */
  onHover?: (tooltip: Solar3DTooltipData) => void;
  
  /**
   * Callback when Reset View button is clicked.
   */
  onResetView?: () => void;
}

/**
 * Solar3DMapCanvas
 * 
 * Renders MapLibre GL + deck.gl 3D visualization.
 * Must be dynamically imported with { ssr: false }.
 * 
 * @example
 * ```tsx
 * const DynamicCanvas = dynamic(
 *   () => import('./Solar3DMapCanvas').then(m => m.Solar3DMapCanvas),
 *   { ssr: false }
 * );
 * 
 * <DynamicCanvas viewData={viewData} onHover={setTooltip} />
 * ```
 */
export declare function Solar3DMapCanvas(props: Solar3DMapCanvasProps): JSX.Element;
```

---

### Solar3DTooltip

Tooltip component for point hover information.

```typescript
/**
 * Props for the tooltip component.
 */
export interface Solar3DTooltipProps {
  /**
   * Tooltip data or null if not showing.
   */
  data: Solar3DTooltipData;
}

/**
 * Solar3DTooltip
 * 
 * Displays hourly information on point hover.
 * Shows: hour label, azimuth°, altitude°, daylight state.
 * 
 * @example
 * ```tsx
 * <Solar3DTooltip data={tooltipData} />
 * ```
 */
export declare function Solar3DTooltip(props: Solar3DTooltipProps): JSX.Element | null;
```

---

### Solar3DLegend

Legend component for daylight state colors.

```typescript
/**
 * Props for the legend component.
 */
export interface Solar3DLegendProps {
  /**
   * Additional CSS classes.
   */
  className?: string;
}

/**
 * Solar3DLegend
 * 
 * Displays legend for point colors (golden/day).
 * Optional component per FR3D-051.
 * 
 * @example
 * ```tsx
 * <Solar3DLegend className="absolute bottom-4 left-4" />
 * ```
 */
export declare function Solar3DLegend(props: Solar3DLegendProps): JSX.Element;
```

---

### Solar3DAccessibleSummary

Screen reader accessible summary of solar data.

```typescript
/**
 * Props for the accessible summary component.
 */
export interface Solar3DAccessibleSummaryProps {
  /**
   * Visible points to summarize.
   */
  points: Solar3DPoint[];
  
  /**
   * Location name for context.
   */
  locationName: string;
  
  /**
   * Date in ISO format.
   */
  dateISO: string;
}

/**
 * Solar3DAccessibleSummary
 * 
 * Provides text-based summary for screen readers (NFR3D-004).
 * Visually hidden but accessible.
 * 
 * @example
 * ```tsx
 * <Solar3DAccessibleSummary 
 *   points={viewData.visiblePoints}
 *   locationName={snapshot.location.name}
 *   dateISO={snapshot.dateISO}
 * />
 * ```
 */
export declare function Solar3DAccessibleSummary(props: Solar3DAccessibleSummaryProps): JSX.Element;
```

---

### Solar3DEmptyState

Empty state for polar night scenarios.

```typescript
/**
 * Props for the empty state component.
 */
export interface Solar3DEmptyStateProps {
  /**
   * Location name for context.
   */
  locationName?: string;
  
  /**
   * Date for context.
   */
  dateISO: string;
}

/**
 * Solar3DEmptyState
 * 
 * Displays message when all hours are night (polar night).
 * Message: "Sun does not rise on this date at this location."
 * 
 * @example
 * ```tsx
 * {viewData.isEmpty && <Solar3DEmptyState dateISO={snapshot.dateISO} />}
 * ```
 */
export declare function Solar3DEmptyState(props: Solar3DEmptyStateProps): JSX.Element;
```

---

## Utility Function Interfaces

### Geometry Functions

```typescript
/**
 * Convert degrees to radians.
 */
export declare function degToRad(degrees: number): number;

/**
 * Compute 3D position from azimuth and altitude.
 * 
 * @param azimuthDeg - Azimuth in degrees (0° = North, 90° = East)
 * @param altitudeDeg - Altitude in degrees above horizon
 * @param radiusMeters - Path radius in meters (default: 1200)
 * @param heightScale - Height multiplier (default: 1.0)
 * @returns Position as [east, north, up] in meters
 * 
 * @example
 * ```ts
 * // Sun at azimuth 90° (East), altitude 45°
 * const pos = computePosition(90, 45);
 * // pos ≈ [848.5, 0, 848.5]
 * ```
 */
export declare function computePosition(
  azimuthDeg: number,
  altitudeDeg: number,
  radiusMeters?: number,
  heightScale?: number
): [number, number, number];
```

### Visibility Functions

```typescript
/**
 * Filter hourly positions to only visible hours (altitude >= 0).
 * 
 * @param hourly - Array of 24 hourly positions
 * @returns Filtered array of visible positions
 */
export declare function filterVisibleHours(
  hourly: HourlySolarPosition[]
): HourlySolarPosition[];

/**
 * Build 3D points from visible hourly positions.
 * 
 * @param visibleHours - Filtered visible positions
 * @param constants - Visual constants for radius/scale
 * @returns Array of Solar3DPoint with computed positions
 */
export declare function buildSolar3DPoints(
  visibleHours: HourlySolarPosition[],
  constants?: typeof SOLAR_3D_CONSTANTS
): Solar3DPoint[];

/**
 * Build path from 3D points.
 * 
 * @param points - Visible 3D points
 * @returns Solar3DPath with positions in hour order
 */
export declare function buildSolar3DPath(
  points: Solar3DPoint[]
): Solar3DPath;

/**
 * Check if selected hour is visible.
 * 
 * @param selectedHour - Selected hour or null
 * @param hourly - All 24 hourly positions
 * @returns True if selectedHour is not null and has altitude >= 0
 */
export declare function isSelectedHourVisible(
  selectedHour: number | null,
  hourly: HourlySolarPosition[]
): boolean;
```

---

## Hook Interfaces

### useSolar3DData

Hook to derive 3D view data from a snapshot.

```typescript
/**
 * Derives complete 3D view data from a snapshot.
 * 
 * @param snapshot - Data snapshot captured on modal open
 * @returns Derived view data including points, path, and flags
 * 
 * @example
 * ```tsx
 * function Solar3DViewModal({ open }) {
 *   const [snapshot, setSnapshot] = useState(null);
 *   
 *   useEffect(() => {
 *     if (open) {
 *       setSnapshot(captureSnapshot());
 *     }
 *   }, [open]);
 *   
 *   const viewData = useSolar3DData(snapshot);
 *   
 *   if (!viewData) return <Loading />;
 *   if (viewData.isEmpty) return <EmptyState />;
 *   return <Canvas viewData={viewData} />;
 * }
 * ```
 */
export declare function useSolar3DData(
  snapshot: Solar3DSnapshot | null
): Solar3DViewData | null;
```

### useWebGLSupport

Hook to detect WebGL support.

```typescript
/**
 * Detects whether WebGL is supported in the current browser.
 * 
 * @returns True if WebGL (1 or 2) is available
 * 
 * @example
 * ```tsx
 * const hasWebGL = useWebGLSupport();
 * 
 * if (!hasWebGL) {
 *   return <FallbackView />;
 * }
 * return <Solar3DMapCanvas />;
 * ```
 */
export declare function useWebGLSupport(): boolean;
```

---

## Layer Configuration Contracts

### ScatterplotLayer Configuration

```typescript
/**
 * Configuration for deck.gl ScatterplotLayer rendering hour points.
 */
export interface Solar3DPointLayerConfig {
  id: 'solar-3d-points';
  data: Solar3DPoint[];
  coordinateSystem: typeof COORDINATE_SYSTEM.METER_OFFSETS;
  coordinateOrigin: [number, number]; // [lng, lat]
  getPosition: (d: Solar3DPoint) => [number, number, number];
  getRadius: (d: Solar3DPoint) => number;
  getFillColor: (d: Solar3DPoint) => [number, number, number, number];
  pickable: true;
  onHover: (info: PickingInfo) => void;
}
```

### PathLayer Configuration

```typescript
/**
 * Configuration for deck.gl PathLayer rendering the trajectory polyline.
 */
export interface Solar3DPathLayerConfig {
  id: 'solar-3d-path';
  data: [Solar3DPath];
  coordinateSystem: typeof COORDINATE_SYSTEM.METER_OFFSETS;
  coordinateOrigin: [number, number]; // [lng, lat]
  getPath: (d: Solar3DPath) => [number, number, number][];
  getWidth: number;
  getColor: [number, number, number, number];
  pickable: false;
}
```

---

## Event Contracts

### Modal Events

| Event | Trigger | Handler Signature |
|-------|---------|-------------------|
| Open | Click "3D View" button | `onOpenChange(true)` |
| Close | Click close button | `onOpenChange(false)` |
| Close | Press Esc key | `onOpenChange(false)` |
| Reset View | Click "Reset View" button | `onResetView()` |

### Interaction Events

| Event | Trigger | Data |
|-------|---------|------|
| Hover Point | Mouse over point | `Solar3DTooltipData` |
| Hover End | Mouse leaves point | `null` |

---

## Error States

### Data Error

When required data is missing or invalid:

```typescript
interface Solar3DErrorState {
  type: 'DATA_ERROR';
  message: 'Solar data unavailable. Please reselect location/date and try again.';
}
```

### WebGL Error

When WebGL is not supported:

```typescript
interface Solar3DWebGLError {
  type: 'WEBGL_ERROR';
  message: 'Your device does not support 3D rendering. Showing simplified view.';
  fallback: 'STATIC_2D';
}
```

### Empty State

When all hours are night (polar night):

```typescript
interface Solar3DEmptyState {
  type: 'EMPTY';
  message: 'Sun does not rise on this date at this location.';
}
```
