/**
 * SVG pattern defs for high-contrast chart accessibility.
 * Patterns activate when html.a11y-high-contrast is set.
 * Each series gets a unique visual texture (hatch, dots, crosshatch, etc.)
 * so colour-blind and greyscale users can distinguish data series.
 */

export const PATTERN_IDS = {
  diagonal:    'a11y-pat-diagonal',
  dots:        'a11y-pat-dots',
  crosshatch:  'a11y-pat-crosshatch',
  horizontal:  'a11y-pat-horizontal',
  vertical:    'a11y-pat-vertical',
  zigzag:      'a11y-pat-zigzag',
};

/** Inject into a Nivo chart via layers={[PatternDefsLayer, 'grid', 'axes', 'bars', ...]} */
export function PatternDefsLayer() {
  return (
    <defs>
      {/* Diagonal hatching — series 0 / Completed / Collected / conducted */}
      <pattern id={PATTERN_IDS.diagonal} patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
        <rect width="8" height="8" fill="currentColor" />
        <line x1="0" y1="0" x2="0" y2="8" stroke="white" strokeWidth="3.5" />
      </pattern>

      {/* Dots — series 1 / Pending / Outstanding / notConducted */}
      <pattern id={PATTERN_IDS.dots} patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="currentColor" />
        <circle cx="4" cy="4" r="2" fill="white" />
      </pattern>

      {/* Crosshatch — series 2 */}
      <pattern id={PATTERN_IDS.crosshatch} patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="currentColor" />
        <line x1="0" y1="0" x2="8" y2="8" stroke="white" strokeWidth="1.5" />
        <line x1="8" y1="0" x2="0" y2="8" stroke="white" strokeWidth="1.5" />
      </pattern>

      {/* Horizontal lines — series 3 */}
      <pattern id={PATTERN_IDS.horizontal} patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="currentColor" />
        <line x1="0" y1="4" x2="8" y2="4" stroke="white" strokeWidth="3" />
      </pattern>

      {/* Vertical lines — series 4 */}
      <pattern id={PATTERN_IDS.vertical} patternUnits="userSpaceOnUse" width="8" height="8">
        <rect width="8" height="8" fill="currentColor" />
        <line x1="4" y1="0" x2="4" y2="8" stroke="white" strokeWidth="3" />
      </pattern>

      {/* Zigzag — series 5+ */}
      <pattern id={PATTERN_IDS.zigzag} patternUnits="userSpaceOnUse" width="10" height="6">
        <rect width="10" height="6" fill="currentColor" />
        <polyline points="0,6 5,0 10,6" fill="none" stroke="white" strokeWidth="1.5" />
      </pattern>
    </defs>
  );
}

const PATTERN_SEQUENCE = [
  PATTERN_IDS.diagonal,
  PATTERN_IDS.dots,
  PATTERN_IDS.crosshatch,
  PATTERN_IDS.horizontal,
  PATTERN_IDS.vertical,
  PATTERN_IDS.zigzag,
];

/** Base colours — used in normal mode */
export const CHART_COLORS = {
  primary:   '#6a3e31',
  secondary: '#efe0dc',
  palette: [
    '#6a3e31', '#c99080', '#efe0dc', '#a0522d',
    '#8b6355', '#d4a090', '#b87060', '#e8c4b8',
  ],
};

/** Returns colour for a series key in normal mode */
export function barColor(id: string, normalColor: string): string {
  return normalColor;
}

/**
 * Returns a Nivo bar `colors` function that switches to pattern fills
 * when high-contrast mode is active. Pass the normal colour per key.
 */
export function makeBarColors(keyColorMap: Record<string, string>) {
  return ({ id }: { id: string | number }) => {
    const isHighContrast = document.documentElement.classList.contains('a11y-high-contrast');
    const keys = Object.keys(keyColorMap);
    const idx = keys.indexOf(String(id));
    if (isHighContrast && idx >= 0) {
      return `url(#${PATTERN_SEQUENCE[idx % PATTERN_SEQUENCE.length]})`;
    }
    return keyColorMap[String(id)] ?? CHART_COLORS.primary;
  };
}

/**
 * For multi-colour bar charts (palette-based, one bar per index).
 * In high contrast, cycles through patterns instead of colours.
 */
export function makeIndexedBarColors(palette: string[]) {
  return ({ index }: { index: number }) => {
    const isHighContrast = document.documentElement.classList.contains('a11y-high-contrast');
    if (isHighContrast) {
      return `url(#${PATTERN_SEQUENCE[index % PATTERN_SEQUENCE.length]})`;
    }
    return palette[index % palette.length];
  };
}

/**
 * Nivo Pie `fill` rules for high-contrast mode.
 * Pass the data ids in order — each gets a pattern.
 */
export function makePieFill(ids: string[]) {
  const isHighContrast = document.documentElement.classList.contains('a11y-high-contrast');
  if (!isHighContrast) return [];
  return ids.map((id, i) => ({
    match: { id },
    id: PATTERN_SEQUENCE[i % PATTERN_SEQUENCE.length],
  }));
}

/**
 * Nivo Pie `defs` block — the pattern shapes referenced by fill rules.
 * Add this to every ResponsivePie's `defs` prop.
 */
export const PIE_PATTERN_DEFS = PATTERN_SEQUENCE.map(pid => ({
  id: pid,
  type: 'patternLines' as const,
  // We use our own SVG patterns via PatternDefsLayer, but Nivo also needs
  // a defs entry to recognise the id. Use a transparent placeholder.
  background: 'transparent',
  color: 'transparent',
  rotation: -45,
  lineWidth: 0,
  spacing: 8,
}));
