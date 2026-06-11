import { useState } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';

const NS = { fontFamily: 'Noto Sans', fontVariationSettings: "'CTGR' 0, 'wdth' 100" };

const GEO_URL = '/karnataka-districts.json';

// Official GP counts per district — source: RDPR Month Book Closure report FY 2024-25
// Keys match GeoJSON NAME_2 field
const DEFAULT_GP_DATA: Record<string, number> = {
  'Bagalkot':        196,
  'Bangalore Rural': 107,
  'Bangalore Urban':  85,
  'Belgaum':         497,
  'Bellary':         100,
  'Bidar':           181,
  'Bijapur':         211,
  'Chamrajnagar':    130,
  'Chikmagalur':     226,
  'Chitradurga':     189,
  'Dakshin Kannad':  223,
  'Davanagere':      194,
  'Dharwad':         146,
  'Gadag':           122,
  'Gulbarga':        261,
  'Hassan':          264,
  'Haveri':          223,
  'Kodagu':          102,
  'Kolar':           154,
  'Koppal':          152,
  'Mandya':          231,
  'Mysore':          255,
  'Raichur':         179,
  'Shimoga':         262,
  'Tumkur':          330,
  'Udupi':           155,
  'Uttar Kannand':   229,
};

// Taluk counts keyed to same district names as DEFAULT_GP_DATA
const DEFAULT_TALUK_DATA: Record<string, number> = {
  'Bagalkot': 6,
  'Bangalore Rural': 4,
  'Bangalore Urban': 4,
  'Belgaum': 11,
  'Bellary': 5,
  'Bidar': 6,
  'Bijapur': 5,
  'Chamrajnagar': 5,
  'Chikmagalur': 7,
  'Chitradurga': 6,
  'Dakshin Kannad': 8,
  'Davanagere': 6,
  'Dharwad': 6,
  'Gadag': 6,
  'Gulbarga': 9,
  'Hassan': 8,
  'Haveri': 8,
  'Kodagu': 5,
  'Kolar': 6,
  'Koppal': 5,
  'Mandya': 7,
  'Mysore': 8,
  'Raichur': 6,
  'Shimoga': 7,
  'Tumkur': 10,
  'Udupi': 5,
  'Uttar Kannand': 11,
};

export interface KarnatakaMapProps {
  gpData?: Record<string, number>;
  talukData?: Record<string, number>;
  onDistrictClick?: (district: string, gpCount: number) => void;
  className?: string;
  width?: number;
  height?: number;
  valueLabel?: string;
  showTalukCount?: boolean;
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  district: string;
  gpCount: number;
  talukCount: number;
}

function getDistrictName(props: Record<string, unknown>): string {
  return (props['NAME_2'] as string) ?? '';
}

function getFillColor(gpCount: number, maxGp: number): string {
  if (gpCount === -1) return '#e8e8e8'; // greyed out (non-selected district)
  if (gpCount === 0) return '#efe0dc';
  const intensity = gpCount / maxGp;
  if (intensity > 0.8) return '#6a3e31';
  if (intensity > 0.6) return '#8a5446';
  if (intensity > 0.4) return '#aa6e5e';
  if (intensity > 0.2) return '#c99080';
  return '#dfc2b9';
}

export default function KarnatakaMap({
  gpData = DEFAULT_GP_DATA,
  talukData = DEFAULT_TALUK_DATA,
  onDistrictClick,
  className,
  width = 600,
  height = 500,
  valueLabel = 'Grama Panchayats',
  showTalukCount = true,
}: KarnatakaMapProps) {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, district: '', gpCount: 0, talukCount: 0,
  });
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);

  const maxGp = Math.max(...Object.values(gpData).filter(v => v >= 0), 1);

  return (
    <div className={`flex flex-col items-center ${className ?? ''}`}>
    <div className="relative" style={{ width, height }}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          center: [76.5, 15.0],
          scale: 3600,
        }}
        width={width}
        height={height}
        style={{ width: '100%', height: '100%' }}
      >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const name = getDistrictName(geo.properties);
                const gpCount = gpData[name] ?? 0;
                const isHovered = hoveredDistrict === name;
                const fill = isHovered ? '#4a2a1e' : getFillColor(gpCount, maxGp);

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fill}
                    stroke="#fff"
                    strokeWidth={0.8}
                    style={{
                      default: { outline: 'none', transition: 'fill 150ms ease' },
                      hover:   { outline: 'none', cursor: 'pointer' },
                      pressed: { outline: 'none' },
                    }}
                    onMouseEnter={e => {
                      if (gpCount === -1) return; // greyed out, no tooltip
                      setHoveredDistrict(name);
                      setTooltip({ visible: true, x: e.clientX, y: e.clientY, district: name, gpCount, talukCount: talukData[name] ?? 0 });
                    }}
                    onMouseMove={e => {
                      setTooltip(t => ({ ...t, x: e.clientX, y: e.clientY }));
                    }}
                    onMouseLeave={() => {
                      setHoveredDistrict(null);
                      setTooltip(t => ({ ...t, visible: false }));
                    }}
                    onClick={() => onDistrictClick?.(name, gpCount)}
                  />
                );
              })
            }
          </Geographies>
      </ComposableMap>

      {/* Tooltip — fixed to viewport */}
      {tooltip.visible && (
        <div
          className="fixed z-50 pointer-events-none bg-[#2d1f1a] text-white rounded-[10px] px-[16px] py-[12px] shadow-lg flex flex-col gap-[6px]"
          style={{ left: tooltip.x + 14, top: tooltip.y - 72 }}
        >
          <div className="flex flex-col gap-[1px]">
            <span className="font-normal text-[10px] text-[rgba(255,255,255,0.5)] leading-normal tracking-[0.4px] uppercase" style={NS}>Zilla</span>
            <span className="font-semibold text-[14px] leading-normal" style={NS}>{tooltip.district}</span>
          </div>
          <div className="w-full h-[1px] bg-[rgba(255,255,255,0.12)]" />
          <div className="flex flex-col gap-[3px]">
            {showTalukCount && (
              <span className="font-normal text-[12px] text-[rgba(255,255,255,0.8)] leading-normal" style={NS}>
                Taluks: <span className="font-semibold text-white">{tooltip.talukCount}</span>
              </span>
            )}
            <span className="font-normal text-[12px] text-[rgba(255,255,255,0.8)] leading-normal" style={NS}>
              {valueLabel}: <span className="font-semibold text-white">{tooltip.gpCount.toLocaleString('en-IN')}</span>
            </span>
          </div>
        </div>
      )}
    </div>

    </div>
  );
}

export function KarnatakaMapTooltip(_props: TooltipState) { return null; }
